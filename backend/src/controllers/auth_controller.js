import { db } from "../../lib/db.js";

export const login = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Find or create the user; every login refreshes lastActiveAt, which
    // feeds the recency factor of the recommender
    const records = await db.executeQuery(
      // user_id is a NODE KEY from the CSV import, so new accounts need it too.
      // The id is generated once: inside one SET, u.userId would still read null.
      `WITH randomUUID() AS newId
       MERGE (u:User {username: $username})
       ON CREATE SET u.userId = newId, u.user_id = newId, u.name = $username,
                     u.joinedAt = datetime(), u.isActive = true
       SET u.lastActiveAt = datetime()
       RETURN u`,
      { username }
    );

    const user = records[0].get("u").properties;
    const userId = records[0].get("u").identity.toString();

    res.json({
      username: user.username,
      id: userId,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
};
