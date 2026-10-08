import neo4j from "neo4j-driver";
import { db } from "../../lib/db.js";
import { loadQuery } from "../utils/cypher_loader.js";

export const getFriends = async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await db.executeQuery(
      `MATCH (u:User)-[:FRIENDS_WITH]-(friend:User)
       WHERE id(u) = $user_id
       RETURN id(friend) as id, friend.username as username,
              friend.name as name, friend.bio as bio
       ORDER BY friend.name`,
      { user_id: parseInt(user_id) }
    );
    res.json(
      result?.map((record) => ({
        id: record._fields[0].low,
        username: record._fields[1],
      })) || []
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  const { current_user_id } = req.query;
  try {
    const result = await db.executeQuery(
      `MATCH (u:User)
       WHERE id(u) <> $current_user_id
       OPTIONAL MATCH (u)-[f:FRIENDS_WITH]-(current:User)
       WHERE id(current) = $current_user_id
       RETURN id(u) as id, u.username as username, f IS NOT NULL as isFriend`,
      { current_user_id: parseInt(current_user_id) }
    );
    res.json(
      result?.map((record) => ({
        id: record._fields[0].low,
        username: record._fields[1],
        isFriend: record._fields[2],
      })) || []
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeFriend = async (req, res) => {
  const { user_id, friend_id } = req.body;
  try {
    await db.executeQuery(
      `MATCH (u:User)-[f:FRIENDS_WITH]-(friend:User)
       WHERE id(u) = $user_id AND id(friend) = $friend_id
       DELETE f`,
      { user_id: parseInt(user_id), friend_id: parseInt(friend_id) }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addFriend = async (req, res) => {
  const { user_id, friend_id } = req.body;
  try {
    // Undirected MERGE: never creates a second edge if B already friended A
    await db.executeQuery(
      `MATCH (u:User), (friend:User)
       WHERE id(u) = $user_id AND id(friend) = $friend_id
       MERGE (u)-[f:FRIENDS_WITH]-(friend)
       ON CREATE SET f.since = datetime(), f.lastInteraction = datetime(),
                     f.strength = 0.5, f.interactions = 0`,
      { user_id: parseInt(user_id), friend_id: parseInt(friend_id) }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const HYBRID_QUERY = loadQuery("03_recommend_hybrid.cypher");
const COLD_START_QUERY = loadQuery("04_recommend_cold_start.cypher");

export const getSuggestedFriends = async (req, res) => {
  const { user_id } = req.query;
  try {
    // Resolve the session's internal id to the stable userId the queries use
    // (back-fills a userId for accounts created before it existed)
    const [me] = await db.executeQuery(
      `MATCH (u:User) WHERE id(u) = $user_id
       SET u.userId = coalesce(u.userId, randomUUID())
       RETURN u.userId AS userId, COUNT { (u)-[:FRIENDS_WITH]-() } AS friendCount`,
      { user_id: parseInt(user_id) }
    );
    if (!me) return res.status(404).json({ error: "User not found" });

    const isColdStart = me.get("friendCount").toNumber() === 0;
    const records = await db.executeQuery(
      isColdStart ? COLD_START_QUERY : HYBRID_QUERY,
      { userId: me.get("userId") }
    );

    // The frontend addresses users by internal id (see addFriend)
    const userIds = records.map((r) => r.get("userId"));
    const idRows = await db.executeQuery(
      `MATCH (u:User) WHERE u.userId IN $userIds RETURN u.userId AS userId, id(u) AS id`,
      { userIds }
    );
    const internalIds = new Map(
      idRows.map((r) => [r.get("userId"), r.get("id").toNumber()])
    );

    res.json(
      records.map((r) => ({
        id: internalIds.get(r.get("userId")),
        username: r.get("username"),
        name: r.get("name"),
        commonFriendsCount: neo4j.integer.toNumber(r.get("mutualFriendCount")),
        mutualFriends: r.get("mutualFriends"),
        sharedInterests: r.get("sharedInterests"),
        sharedContext: r.get("sharedContext"),
        distanceKm: r.get("distanceKm"),
        matchScore: r.get("matchScore"),
        breakdown: r.get("breakdown"),
        reason: r.get("reason"),
        strategy: isColdStart ? "cold-start" : "hybrid",
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
