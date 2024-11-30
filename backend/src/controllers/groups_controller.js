import { db } from "../../lib/db.js";

export const getGroups = async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await db.executeQuery(
      `MATCH (u:User)-[:MEMBER_OF]->(g:Group)
       WHERE id(u) = $user_id
       RETURN id(g) as id, g.name as name, g.description as description`,
      { user_id: parseInt(user_id) }
    );
    res.json(
      result?.map((record) => ({
        id: record._fields[0].low,
        name: record._fields[1],
        description: record._fields[2],
      })) || []
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinGroup = async (req, res) => {
  const { user_id, group_id } = req.body;
  try {
    const existingMembership = await db.executeQuery(
      `MATCH (u:User)-[r:MEMBER_OF]->(g:Group)
       WHERE id(u) = $user_id AND id(g) = $group_id
       RETURN r`,
      { user_id: parseInt(user_id), group_id: parseInt(group_id) }
    );

    if (existingMembership.length > 0) {
      return res.status(400).json({ error: "User is already a member of this group" });
    }

    await db.executeQuery(
      `MATCH (u:User), (g:Group)
       WHERE id(u) = $user_id AND id(g) = $group_id
       CREATE (u)-[:MEMBER_OF]->(g)`,
      { user_id: parseInt(user_id), group_id: parseInt(group_id) }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const quitGroup = async (req, res) => {
  const { user_id, group_id } = req.body;
  try {
    await db.executeQuery(
      `MATCH (u:User)-[r:MEMBER_OF]->(g:Group)
       WHERE id(u) = $user_id AND id(g) = $group_id
       DELETE r`,
      { user_id: parseInt(user_id), group_id: parseInt(group_id) }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const result = await db.executeQuery(
      `MATCH (g:Group)
       RETURN id(g) as id, g.name as name, g.description as description`
    );
    res.json(
      result?.map((record) => ({
        id: record._fields[0].low,
        name: record._fields[1],
        description: record._fields[2],
      })) || []
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
