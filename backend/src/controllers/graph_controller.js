import neo4j from "neo4j-driver";
import { db } from "../../lib/db.js";
import { loadQuery } from "../utils/cypher_loader.js";
import { rows } from "../utils/records.js";

const HYBRID_QUERY = loadQuery("03_recommend_hybrid.cypher");

// Ego network around `center`: friends (ring 1) and the best-connected
// friends-of-friends (ring 2), plus every friendship among them. Rings are
// capped so an influencer with 700+ friends still draws smoothly.
const EGO_QUERY = `
  MATCH (center:User) WHERE id(center) = $center
  CALL (center) {
    MATCH (center)-[r:FRIENDS_WITH]-(f:User)
    WITH f, r ORDER BY r.strength DESC, r.lastInteraction DESC
    RETURN collect(f) AS allFriends
  }
  WITH center, allFriends, allFriends[..$maxFirst] AS ring1
  CALL (center, ring1) {
    UNWIND (CASE WHEN $depth > 1 THEN ring1 ELSE [] END) AS f
    MATCH (f)-[:FRIENDS_WITH]-(fof:User)
    WHERE fof <> center AND NOT fof IN ring1
    WITH fof, count(*) AS links
    ORDER BY links DESC, fof.lastActiveAt DESC
    RETURN collect(fof) AS allSecond
  }
  WITH center, allFriends, ring1, allSecond, allSecond[..$maxSecond] AS ring2,
       COLLECT { MATCH (x:User) WHERE id(x) IN $extraIds RETURN x } AS extras
  WITH center, allFriends, ring1, ring2, allSecond,
       [x IN extras WHERE x <> center AND NOT x IN ring1 AND NOT x IN ring2] AS suggested
  WITH center, size(allFriends) AS friendTotal, size(allSecond) AS secondTotal,
       [{n: center, ring: 0}] + [x IN ring1 | {n: x, ring: 1}]
         + [x IN ring2 | {n: x, ring: 2}] + [x IN suggested | {n: x, ring: 3}] AS placed
  WITH friendTotal, secondTotal, placed, [p IN placed | p.n] AS members
  CALL (placed) {
    UNWIND placed AS p
    WITH p.n AS n, p.ring AS ring
    RETURN collect({
      id: id(n), name: n.name, username: n.username, ring: ring,
      friendCount: COUNT { (n)-[:FRIENDS_WITH]-() }
    }) AS nodes
  }
  RETURN friendTotal, secondTotal, nodes,
         COLLECT {
           UNWIND members AS a
           MATCH (a)-[r:FRIENDS_WITH]->(b) WHERE b IN members
           RETURN { source: id(a), target: id(b), strength: coalesce(r.strength, 0.5) } AS link
         } AS links`;

export const getEgoGraph = async (req, res) => {
  const viewer = parseInt(req.query.viewer_id);
  const center = parseInt(req.query.center_id ?? req.query.viewer_id);
  const depth = req.query.depth === "1" ? 1 : 2;
  try {
    // On your own graph, mark the people the recommender would suggest
    let suggestions = [];
    if (center === viewer) {
      const [me] = await db.executeQuery(
        "MATCH (u:User) WHERE id(u) = $id RETURN u.userId AS userId, COUNT { (u)-[:FRIENDS_WITH]-() } AS friends",
        { id: center }
      );
      if (me && me.get("friends").toNumber() > 0) {
        const recs = await db.executeQuery(HYBRID_QUERY, { userId: me.get("userId") });
        const userIds = recs.map((r) => r.get("userId"));
        const idRows = await db.executeQuery(
          "MATCH (u:User) WHERE u.userId IN $userIds RETURN u.userId AS userId, id(u) AS id",
          { userIds }
        );
        const byUserId = new Map(idRows.map((r) => [r.get("userId"), r.get("id").toNumber()]));
        suggestions = recs.map((r) => ({
          id: byUserId.get(r.get("userId")),
          score: r.get("matchScore"),
          reason: r.get("reason"),
        }));
      }
    }

    const [record] = await db.executeQuery(EGO_QUERY, {
      center,
      depth: neo4j.int(depth),
      maxFirst: neo4j.int(150),
      maxSecond: neo4j.int(depth > 1 ? 150 : 0),
      extraIds: suggestions.map((s) => neo4j.int(s.id)),
    });
    if (!record) return res.status(404).json({ error: "That person doesn't exist" });

    const graph = rows([record])[0];
    const rank = new Map(suggestions.map((s, i) => [s.id, { rank: i + 1, ...s }]));
    graph.nodes = graph.nodes.map((n) => {
      const s = rank.get(n.id);
      return s ? { ...n, suggestedRank: s.rank, matchScore: s.score, reason: s.reason } : n;
    });
    res.json(graph);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
