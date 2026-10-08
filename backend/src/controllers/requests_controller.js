import { db } from "../../lib/db.js";
import { rows } from "../utils/records.js";

const ids = (a, b) => ({ me: parseInt(a), other: parseInt(b) });

// Accepting creates the friendship with fresh tie properties, which feed the
// recommender's strength and recency factors
const ACCEPT = `
  MATCH (requester:User)-[r:FRIEND_REQUEST]->(me:User)
  WHERE id(me) = $me AND id(requester) = $other
  DELETE r
  MERGE (me)-[f:FRIENDS_WITH]-(requester)
  ON CREATE SET f.since = datetime(), f.lastInteraction = datetime(),
                f.strength = 0.5, f.interactions = 1
  SET me.lastActiveAt = datetime()
  RETURN count(f) AS accepted`;

export const sendRequest = async (req, res) => {
  const params = ids(req.body.user_id, req.body.friend_id);
  if (params.me === params.other) return res.status(400).json({ error: "You can't send a request to yourself" });
  try {
    const [state] = await db.executeQuery(
      `MATCH (me:User), (other:User) WHERE id(me) = $me AND id(other) = $other
       RETURN EXISTS { (me)-[:FRIENDS_WITH]-(other) } AS friends,
              EXISTS { (other)-[:FRIEND_REQUEST]->(me) } AS incoming`,
      params
    );
    if (!state) return res.status(404).json({ error: "User not found" });
    if (state.get("friends")) return res.json({ status: "friends" });

    // They already asked me: sending back counts as accepting
    if (state.get("incoming")) {
      await db.executeQuery(ACCEPT, params);
      return res.json({ status: "friends" });
    }
    await db.executeQuery(
      `MATCH (me:User), (other:User) WHERE id(me) = $me AND id(other) = $other
       MERGE (me)-[r:FRIEND_REQUEST]->(other)
       ON CREATE SET r.sentAt = datetime()
       SET me.lastActiveAt = datetime()`,
      params
    );
    res.json({ status: "requested" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRequests = async (req, res) => {
  const me = parseInt(req.query.user_id);
  const person = `{
    id: id(p), username: p.username, name: p.name, bio: p.bio, sentAt: r.sentAt,
    mutualCount: COUNT { (me)-[:FRIENDS_WITH]-(:User)-[:FRIENDS_WITH]-(p) }
  }`;
  try {
    const [result] = await db.executeQuery(
      `MATCH (me:User) WHERE id(me) = $me
       RETURN
         COLLECT { MATCH (p:User)-[r:FRIEND_REQUEST]->(me) RETURN ${person} AS x ORDER BY r.sentAt DESC } AS incoming,
         COLLECT { MATCH (me)-[r:FRIEND_REQUEST]->(p:User) RETURN ${person} AS x ORDER BY r.sentAt DESC } AS outgoing`,
      { me }
    );
    if (!result) return res.status(404).json({ error: "User not found" });
    res.json(rows([result])[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const [result] = await db.executeQuery(ACCEPT, ids(req.body.user_id, req.body.requester_id));
    if (!result || result.get("accepted").toNumber() === 0) {
      return res.status(404).json({ error: "That request no longer exists" });
    }
    res.json({ status: "friends" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const declineRequest = async (req, res) => {
  try {
    await db.executeQuery(
      `MATCH (requester:User)-[r:FRIEND_REQUEST]->(me:User)
       WHERE id(me) = $me AND id(requester) = $other
       DELETE r`,
      ids(req.body.user_id, req.body.requester_id)
    );
    res.json({ status: "none" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelRequest = async (req, res) => {
  try {
    await db.executeQuery(
      `MATCH (me:User)-[r:FRIEND_REQUEST]->(target:User)
       WHERE id(me) = $me AND id(target) = $other
       DELETE r`,
      ids(req.body.user_id, req.body.target_id)
    );
    res.json({ status: "none" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
