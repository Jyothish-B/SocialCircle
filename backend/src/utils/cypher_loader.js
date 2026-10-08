import { readFileSync } from "fs";

// The .cypher files in /cypher are the single source of truth: the backend
// executes exactly what you demo in Neo4j Browser.
const CYPHER_DIR = new URL("../../../cypher/", import.meta.url);

// Drop full-line // comments, then split on ";" at end of line (the scripts
// never put ";" at a line end inside a string literal or trailing comment).
export const loadStatements = (fileName) =>
  readFileSync(new URL(fileName, CYPHER_DIR), "utf8")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((stmt) => stmt.trim())
    .filter(Boolean);

// For files that contain exactly one query
export const loadQuery = (fileName) => {
  const statements = loadStatements(fileName);
  if (statements.length !== 1) {
    throw new Error(`${fileName} should contain exactly one statement`);
  }
  return statements[0];
};

export const runCypherFile = async (db, fileName) => {
  for (const statement of loadStatements(fileName)) {
    await db.executeQuery(statement);
  }
};
