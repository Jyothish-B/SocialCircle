import neo4j from "neo4j-driver";

// Converts driver values (Integer, DateTime, nested maps/lists) into plain JSON
export const plain = (value) => {
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(plain);
  if (neo4j.isDateTime(value) || neo4j.isDate(value)) return value.toString();
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  }
  return value;
};

export const rows = (records) => records.map((r) => plain(r.toObject()));

// How the viewer `me` relates to person `p` (both must be bound in the query)
export const RELATIONSHIP_STATUS = `
  CASE
    WHEN p = me THEN 'self'
    WHEN (me)-[:FRIENDS_WITH]-(p) THEN 'friends'
    WHEN (me)-[:FRIEND_REQUEST]->(p) THEN 'requested'
    WHEN (p)-[:FRIEND_REQUEST]->(me) THEN 'incoming'
    ELSE 'none'
  END`;
