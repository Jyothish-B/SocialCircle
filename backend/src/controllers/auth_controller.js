import { db } from "../../lib/db.js";

export const login = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Try to find existing user
    let records = await db.executeQuery(
      "MATCH (u:User {username: $username}) RETURN u",
      { username }
    );

    if (records.length === 0) {
      // Create new user if not found
      records = await db.executeQuery(
        "CREATE (u:User {username: $username}) RETURN u",
        { username }
      );
    }

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
