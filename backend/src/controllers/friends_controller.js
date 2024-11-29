import { db } from "../../lib/db.js";

export const getFriends = async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await db.executeQuery(
      `MATCH (u:User)-[:FRIENDS_WITH]-(friend:User)
       WHERE id(u) = $user_id
       RETURN id(friend) as id, friend.username as username`,
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
    await db.executeQuery(
      `MATCH (u:User), (friend:User)
       WHERE id(u) = $user_id AND id(friend) = $friend_id
       CREATE (u)-[:FRIENDS_WITH]->(friend)`,
      { user_id: parseInt(user_id), friend_id: parseInt(friend_id) }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
