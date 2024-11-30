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

export const updateProfile = async (req, res) => {
  try {
    const { user_id, company_id, place_id } = req.body;
    const userId = parseInt(user_id);

    // Remove existing WORKS_AT relationship
    await db.executeQuery(
      `
      MATCH (u:User)-[r:WORKS_AT]->()
      WHERE id(u) = $userId
      DELETE r
      `,
      { userId }
    );

    // Create new WORKS_AT relationship if company_id is provided
    if (company_id) {
      await db.executeQuery(
        `
        MATCH (u:User), (c:Company)
        WHERE id(u) = $userId AND id(c) = $companyId
        CREATE (u)-[:WORKS_AT {created_at: datetime()}]->(c)
        `,
        { userId, companyId: parseInt(company_id) }
      );
    }

    // Remove existing LIVES_IN relationship
    await db.executeQuery(
      `
      MATCH (u:User)-[r:LIVES_IN]->()
      WHERE id(u) = $userId
      DELETE r
      `,
      { userId }
    );

    // Create new LIVES_IN relationship if place_id is provided
    if (place_id) {
      await db.executeQuery(
        `
        MATCH (u:User), (p:Place)
        WHERE id(u) = $userId AND id(p) = $placeId
        CREATE (u)-[:LIVES_IN {created_at: datetime()}]->(p)
        `,
        { userId, placeId: parseInt(place_id) }
      );
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCompaniesAndPlaces = async (req, res) => {
  try {
    const companies = await db.executeQuery(
      `
      MATCH (c:Company)
      RETURN { id: id(c), name: c.name, description: c.description } AS company
      `
    );

    const places = await db.executeQuery(
      `
      MATCH (p:Place)
      RETURN { id: id(p), name: p.name, description: p.description } AS place
      `
    );

    res.json({
      companies: companies.map((r) => ({
        id: r._fields[0].id.low,
        name: r._fields[0].name,
        description: r._fields[0].description,
      })),
      places: places.map((r) => ({
        id: r._fields[0].id.low,
        name: r._fields[0].name,
        description: r._fields[0].description,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEntity = async (req, res) => {
  try {
    const { type, name, description } = req.body;
    const result = await db.executeQuery(
      `
      CREATE (n:${type} { name: $name, description: $description, created_at: datetime() })
      RETURN { id: id(n), name: n.name, description: n.description } AS entity
      `,
      { name, description }
    );

    const entity = result[0]._fields[0];
    res.json({
      id: entity.id.low,
      name: entity.name,
      description: entity.description,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
