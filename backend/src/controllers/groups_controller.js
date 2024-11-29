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
