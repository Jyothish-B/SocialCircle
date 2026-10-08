import { readFileSync } from "fs";
import { db } from "../../lib/db.js";
import { loadStatements } from "./cypher_loader.js";

// Adapts the graph imported from ProjectNos/*.csv to the recommender's model.
// Additive only: it MATCHes the existing nodes/relationships by their CSV ids
// and SETs extra properties/labels. Nothing is created from scratch or deleted.
//
// Usage: npm run adapt

const CSV_DIR = new URL("../../../../ProjectNos/", import.meta.url);

// Minimal RFC-4180 parser (handles quoted fields containing commas)
function parseCsv(fileName) {
  const text = readFileSync(new URL(fileName, CSV_DIR), "utf8").replace(/\r\n/g, "\n").trim();
  const rows = [];
  let field = "", row = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  row.push(field);
  rows.push(row);
  const [header, ...data] = rows;
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const STEPS = [
  [
    "Users: userId, username, name, email, bio, joinedAt",
    "users.csv",
    `UNWIND $rows AS row
     MATCH (u:User {user_id: row.user_id})
     SET u.userId   = row.user_id,
         u.username = toLower(row.name),
         u.name     = row.name,
         u.email    = row.email,
         u.bio      = row.bio,
         u.joinedAt = datetime({date: date(row.joined_at)}),
         u.isActive = true`,
  ],
  [
    "Groups: add :Group label, groupId, name",
    "groups.csv",
    `UNWIND $rows AS row
     MATCH (g:groups {group_id: row.group_id})
     SET g:Group, g.groupId = row.group_id, g.name = row.name`,
  ],
  [
    "Interests: category from topic",
    "interests.csv",
    `UNWIND $rows AS row
     MATCH (i:Interest {name: row.name})
     SET i.category = row.topic`,
  ],
  [
    "FRIENDS_WITH: since, strength, lastInteraction",
    "friends_with.csv",
    `UNWIND $rows AS row
     MATCH (:User {user_id: row.from_user_id})-[f:FRIENDS_WITH]->(:User {user_id: row.to_user_id})
     SET f.since           = datetime({date: date(row.since)}),
         f.strength        = toFloat(row.strength),
         f.lastInteraction = coalesce(f.lastInteraction, datetime({date: date(row.since)})),
         f.interactions    = coalesce(f.interactions, 0)`,
  ],
  [
    "FOLLOWS: since",
    "follows.csv",
    `UNWIND $rows AS row
     MATCH (:User {user_id: row.follower_user_id})-[f:FOLLOWS]->(:User {user_id: row.followed_user_id})
     SET f.since = datetime({date: date(row.since)})`,
  ],
];

// No CSV has these, so derive them from what the CSVs do contain
const DERIVED = [
  [
    "INTERESTED_IN.weight = 1.0 (CSV has no weights, so weighted Jaccard = plain Jaccard)",
    `MATCH ()-[r:INTERESTED_IN]->() SET r.weight = coalesce(r.weight, 1.0)`,
  ],
  [
    "User.lastActiveAt = latest friendship/follow date, else joinedAt",
    `MATCH (u:User)
     WITH u, [(u)-[r:FRIENDS_WITH|FOLLOWS]-() | r.since] + [u.joinedAt] AS dates
     SET u.lastActiveAt = reduce(m = null, d IN dates |
                           CASE WHEN m IS NULL OR d > m THEN d ELSE m END)`,
  ],
];

async function adapt() {
  try {
    for (const [label, file, query] of STEPS) {
      const rows = parseCsv(file);
      await db.executeQuery(query, { rows });
      console.log(`✔ ${label} (${rows.length} rows)`);
    }
    for (const [label, query] of DERIVED) {
      await db.executeQuery(query);
      console.log(`✔ ${label}`);
    }
    console.log("Creating constraints & indexes...");
    // The Import tool already made NODE KEYs on the CSV ids (e.g. Interest.name),
    // which are stronger than our uniqueness constraints, so those are skipped
    for (const statement of loadStatements("01_schema.cypher")) {
      try {
        await db.executeQuery(statement);
      } catch (error) {
        if (error.code !== "Neo.ClientError.Schema.ConstraintAlreadyExists") throw error;
        console.log("  skipped (already covered):", statement.split("\n")[0]);
      }
    }
    console.log("\n✅ CSV data adapted. Nothing was deleted.");
  } catch (error) {
    console.error("\n❌ Error adapting data:", error);
  } finally {
    await db.close();
  }
}

adapt();
