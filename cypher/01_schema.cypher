// =====================================================================
// 01_schema.cypher - constraints & indexes (idempotent, Neo4j 5.x)
// Run BEFORE the seed: MERGE relies on the uniqueness constraints
// to do an index lookup instead of a label scan.
// =====================================================================

// ---------- Uniqueness constraints (each one also creates a RANGE index) ----------
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.userId IS UNIQUE;

CREATE CONSTRAINT user_username_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.username IS UNIQUE;

CREATE CONSTRAINT interest_name_unique IF NOT EXISTS
FOR (i:Interest) REQUIRE i.name IS UNIQUE;

CREATE CONSTRAINT group_id_unique IF NOT EXISTS
FOR (g:Group) REQUIRE g.groupId IS UNIQUE;

CREATE CONSTRAINT place_id_unique IF NOT EXISTS
FOR (p:Place) REQUIRE p.placeId IS UNIQUE;

CREATE CONSTRAINT company_name_unique IF NOT EXISTS
FOR (c:Company) REQUIRE c.name IS UNIQUE;

CREATE CONSTRAINT school_name_unique IF NOT EXISTS
FOR (s:School) REQUIRE s.name IS UNIQUE;

// ---------- Secondary indexes ----------
// Cold-start fallback orders candidates by recent activity -> index-backed ORDER BY
CREATE INDEX user_last_active IF NOT EXISTS
FOR (u:User) ON (u.lastActiveAt);

// Written by Louvain (05_gds.cypher); used for "same community" + diversity re-ranking
CREATE INDEX user_community IF NOT EXISTS
FOR (u:User) ON (u.communityId);

// Interest browsing by category ("show me Outdoors people")
CREATE INDEX interest_category IF NOT EXISTS
FOR (i:Interest) ON (i.category);

// Geospatial: point index enables point.distance() radius / bounding-box seeks
CREATE POINT INDEX place_location IF NOT EXISTS
FOR (p:Place) ON (p.location);

// Relationship-property index: "friends I talked to in the last N days"
CREATE INDEX friends_last_interaction IF NOT EXISTS
FOR ()-[r:FRIENDS_WITH]-() ON (r.lastInteraction);

// Full-text (Lucene) index for people search: names, usernames and bios
DROP INDEX user_search IF EXISTS;
CREATE FULLTEXT INDEX people_search IF NOT EXISTS
FOR (u:User) ON EACH [u.name, u.username, u.bio];
