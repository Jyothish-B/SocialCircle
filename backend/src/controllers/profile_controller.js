import { db } from "../../lib/db.js";

export const getProfile = async (req, res) => {
  try {
    const { user_id } = req.query;

    const result = await db.executeQuery(
      `
      MATCH (u:User)
      WHERE id(u) = $userId
      OPTIONAL MATCH (u)-[:WORKS_AT]->(c:Company)
      OPTIONAL MATCH (u)-[:LIVES_IN]->(p:Place)
      RETURN {
        id: id(u),
        username: u.username,
        company: CASE WHEN c IS NOT NULL THEN {id: id(c), name: c.name, description: c.description} END,
        place: CASE WHEN p IS NOT NULL THEN {id: id(p), name: p.name, description: p.description} END
      } as profile
    `,
      { userId: parseInt(user_id) }
    );
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = result[0]._fields[0];
    const formattedProfile = {
      id: profile.id.low,
      username: profile.username,
      company: profile.company
        ? {
            id: profile.company.id.low,
            name: profile.company.name,
            description: profile.company.description,
          }
        : null,
      place: profile.place
        ? {
            id: profile.place.id.low,
            name: profile.place.name,
            description: profile.place.description,
          }
        : null,
    };

    res.json(formattedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
