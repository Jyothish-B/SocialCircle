import neo4j from "neo4j-driver";
import { db } from "../../lib/db.js";
import { rows, RELATIONSHIP_STATUS } from "../utils/records.js";

// LIMIT and the full-text limit option need integers, not JS floats
const neo4jInt = (n) => neo4j.int(n);

const PERSON_CARD = `{
  id: id(p), username: p.username, name: p.name, bio: p.bio,
  friendCount: COUNT { (p)-[:FRIENDS_WITH]-() },
  mutualCount: COUNT { (me)-[:FRIENDS_WITH]-(:User)-[:FRIENDS_WITH]-(p) },
  status: ${RELATIONSHIP_STATUS}
}`;

// Lucene treats these as syntax; escape them so user input is always a literal
const escapeLucene = (term) => term.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, "\\$&");

// "priya hik" -> "priya* hik*": prefix match on every word, best matches first
const toLuceneQuery = (q) =>
  q.trim().split(/\s+/).filter(Boolean).map((t) => `${escapeLucene(t.toLowerCase())}*`).join(" ");

export const searchPeople = async (req, res) => {
  const me = parseInt(req.query.viewer_id);
  const q = String(req.query.q || "").slice(0, 100);
  const limit = Math.min(parseInt(req.query.limit) || 24, 60);
  try {
    const records = toLuceneQuery(q)
      ? await db.executeQuery(
          `MATCH (me:User) WHERE id(me) = $me
           CALL db.index.fulltext.queryNodes('people_search', $query, {limit: $limit + 1})
           YIELD node AS p, score
           WHERE p <> me
           RETURN ${PERSON_CARD} AS person
           ORDER BY score DESC
           LIMIT $limit`,
          { me, query: toLuceneQuery(q), limit: neo4jInt(limit) }
        )
      : // No query yet: people with the most mutual friends who aren't friends already
        await db.executeQuery(
          `MATCH (me:User) WHERE id(me) = $me
           MATCH (me)-[:FRIENDS_WITH]-(:User)-[:FRIENDS_WITH]-(p:User)
           WHERE p <> me AND NOT (me)-[:FRIENDS_WITH]-(p)
           WITH me, p, count(*) AS mutual
           ORDER BY mutual DESC LIMIT $limit
           RETURN ${PERSON_CARD} AS person`,
          { me, limit: neo4jInt(limit) }
        );
    res.json(rows(records).map((r) => r.person));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPerson = async (req, res) => {
  const me = parseInt(req.query.viewer_id);
  const person = parseInt(req.params.id);
  try {
    const [record] = await db.executeQuery(
      `MATCH (me:User), (p:User) WHERE id(me) = $me AND id(p) = $person
       RETURN {
         id: id(p), username: p.username, name: p.name, bio: p.bio, email: p.email,
         joinedAt: p.joinedAt, lastActiveAt: p.lastActiveAt,
         status: ${RELATIONSHIP_STATUS},
         friendCount: COUNT { (p)-[:FRIENDS_WITH]-() },
         followerCount: COUNT { (p)<-[:FOLLOWS]-() },
         followingCount: COUNT { (p)-[:FOLLOWS]->() },
         interests: COLLECT {
           MATCH (p)-[r:INTERESTED_IN]->(i:Interest)
           RETURN { name: i.name, category: i.category, weight: r.weight,
                    shared: EXISTS { (me)-[:INTERESTED_IN]->(i) } } AS x
           ORDER BY r.weight DESC, i.name
         },
         groups: COLLECT {
           MATCH (p)-[m:MEMBER_OF]->(g:Group)
           RETURN { id: id(g), name: g.name, role: m.role,
                    members: COUNT { (g)<-[:MEMBER_OF]-() },
                    shared: EXISTS { (me)-[:MEMBER_OF]->(g) } } AS x
           ORDER BY g.name
         },
         mutualFriends: COLLECT {
           MATCH (me)-[:FRIENDS_WITH]-(m:User)-[:FRIENDS_WITH]-(p)
           RETURN { id: id(m), username: m.username, name: m.name } AS x
           ORDER BY m.name LIMIT 12
         },
         mutualCount: COUNT { (me)-[:FRIENDS_WITH]-(:User)-[:FRIENDS_WITH]-(p) },
         closeFriends: COLLECT {
           MATCH (p)-[f:FRIENDS_WITH]-(c:User)
           RETURN { id: id(c), username: c.username, name: c.name, strength: f.strength } AS x
           ORDER BY f.strength DESC, f.lastInteraction DESC LIMIT 8
         }
       } AS profile`,
      { me, person }
    );
    if (!record) return res.status(404).json({ error: "That person doesn't exist" });
    res.json(rows([record])[0].profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
