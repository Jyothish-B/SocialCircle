// =====================================================================
// 03_recommend_hybrid.cypher - QUERY 1: weighted multi-factor recommender
// Requires Neo4j >= 5.23 (scoped CALL subqueries, COUNT{} subqueries).
// Neo4j Browser:   :param userId => 'U01'
//
// Two-stage retrieval (the same shape as YouTube/LinkedIn recommenders):
//   Stage 1  CANDIDATE GENERATION - cheap, bounded, multi-source union
//   Stage 2  FEATURE SCORING      - expensive features computed only for candidates
//
// match_score = 100 * ( 0.40 * S_structural   tie-weighted Adamic-Adar, saturated
//                     + 0.25 * S_interest     weighted Jaccard over interest weights
//                     + 0.15 * S_community    groups, org, Louvain cluster, FastRP kNN
//                     + 0.10 * S_geo          exp(-km / 50)
//                     + 0.10 * S_recency )    half-life decay of ties + candidate activity
// Every S_x is in [0,1] and the weights sum to 1, so match_score is in [0,100].
// =====================================================================

// ---------- Tunables (one place to change them) ----------
WITH {structural: 0.40, interest: 0.25, community: 0.15, geo: 0.10, recency: 0.10} AS w,
     200       AS maxHubDegree,    // "celebrity" cut-off for intermediate nodes
     1.5       AS aaScale,         // Adamic-Adar saturation constant
     50.0      AS geoScaleKm,      // distance at which S_geo falls to 1/e
     90.0      AS tieHalfLifeDays,
     30.0      AS activityHalfLifeDays,
     datetime() AS now

// ---------- Anchor: unique-constraint index seek, O(log n) ----------
MATCH (me:User {userId: $userId})
OPTIONAL MATCH (me)-[:LIVES_IN]->(myPlace:Place)
WITH w, maxHubDegree, aaScale, geoScaleKm, tieHalfLifeDays, activityHalfLifeDays, now,
     me, myPlace,
     reduce(t = 0.0, x IN [(me)-[r:INTERESTED_IN]->() | r.weight] | t + x) AS myInterestMass

// =====================================================================
// STAGE 1 - candidate generation. Each branch is bounded so a single
// hub (celebrity, mega-group, "Music") can't explode the frontier.
// COUNT{(x)-[:T]-()} is answered from the node's degree store in O(1).
// =====================================================================
CALL (me, myPlace, maxHubDegree) {
  // (a) friends-of-friends (triadic closure), skipping hub intermediaries,
  //     keeping the 200 people reached by the most paths
  MATCH (me)-[:FRIENDS_WITH]-(m:User)-[:FRIENDS_WITH]-(c:User)
  WHERE COUNT { (m)-[:FRIENDS_WITH]-() } <= maxHubDegree
  WITH c, count(*) AS paths
  RETURN c ORDER BY paths DESC LIMIT 200
  UNION
  // (b) shared interests: popular interests have hundreds of fans, so rank
  //     by how many interests overlap and keep the top 100
  MATCH (me)-[:INTERESTED_IN]->(:Interest)<-[:INTERESTED_IN]-(c:User)
  WITH c, count(*) AS overlap
  RETURN c ORDER BY overlap DESC, c.lastActiveAt DESC LIMIT 100
  UNION
  // (c) shared groups / workplace / school, same top-100 bound
  MATCH (me)-[:MEMBER_OF|WORKS_AT|STUDIED_AT]->(ctx)<-[:MEMBER_OF|WORKS_AT|STUDIED_AT]-(c:User)
  WITH c, count(*) AS overlap
  RETURN c ORDER BY overlap DESC, c.lastActiveAt DESC LIMIT 100
  UNION
  // (d) GDS FastRP-kNN neighbours (present only after 05_gds.cypher has run)
  MATCH (me)-[:SIMILAR_TO]-(c:User)
  RETURN c
  UNION
  // (e) same city - bounded to the 50 most recently active residents
  MATCH (myPlace)<-[:LIVES_IN]-(c:User)
  RETURN c ORDER BY c.lastActiveAt DESC LIMIT 50
}
WITH DISTINCT w, maxHubDegree, aaScale, geoScaleKm, tieHalfLifeDays, activityHalfLifeDays, now,
     me, myPlace, myInterestMass, c
WHERE c <> me
  AND coalesce(c.isActive, true)
  AND NOT (me)-[:FRIENDS_WITH]-(c)
  AND NOT (me)-[:BLOCKED]-(c)
  AND NOT (me)-[:FRIEND_REQUEST]-(c)        // already asked, or waiting on my answer

// =====================================================================
// STAGE 2 - feature extraction (pattern comprehensions are anchored on
// both endpoints, so each is a tiny bounded expand, not a scan).
// =====================================================================
OPTIONAL MATCH (c)-[:LIVES_IN]->(theirPlace:Place)
WITH w, aaScale, geoScaleKm, tieHalfLifeDays, activityHalfLifeDays, now,
     me, myInterestMass, c,
     // --- structural: one entry per mutual friend ---
     [(me)-[r1:FRIENDS_WITH]-(m:User)-[r2:FRIENDS_WITH]-(c)
        WHERE COUNT { (m)-[:FRIENDS_WITH]-() } <= maxHubDegree |
        { name: m.name,
          // Adamic-Adar term, scaled by the geometric mean of both tie strengths
          aa:   sqrt(coalesce(r1.strength, 0.5) * coalesce(r2.strength, 0.5))
                / log(COUNT { (m)-[:FRIENDS_WITH]-() }),
          // a 2-hop path is only as fresh as its stalest edge
          days: duration.inDays(
                  CASE WHEN r1.lastInteraction < r2.lastInteraction
                       THEN r1.lastInteraction ELSE r2.lastInteraction END,
                  now).days }] AS mutuals,
     // --- interest overlap: min(w_me, w_them) for every shared interest ---
     [(me)-[r1:INTERESTED_IN]->(i:Interest)<-[r2:INTERESTED_IN]-(c) |
        { name: i.name,
          overlap: CASE WHEN r1.weight < r2.weight THEN r1.weight ELSE r2.weight END }] AS shared,
     reduce(t = 0.0, x IN [(c)-[r:INTERESTED_IN]->() | r.weight] | t + x) AS theirInterestMass,
     // --- community context ---
     [(me)-[:MEMBER_OF]->(g:Group)<-[:MEMBER_OF]-(c) | g.name]                               AS sharedGroups,
     [(me)-[:WORKS_AT|STUDIED_AT]->(o)<-[:WORKS_AT|STUDIED_AT]-(c) | o.name]                 AS sharedOrgs,
     (me.communityId IS NOT NULL AND me.communityId = c.communityId)                          AS sameCommunity,
     reduce(mx = 0.0, x IN [(me)-[sim:SIMILAR_TO]-(c) | sim.score] |
            CASE WHEN x > mx THEN x ELSE mx END)                                              AS embeddingSim,
     // --- geography (null-safe: missing location => no geo signal) ---
     CASE WHEN myPlace IS NULL OR theirPlace IS NULL THEN null
          ELSE point.distance(myPlace.location, theirPlace.location) / 1000.0 END            AS distanceKm,
     duration.inDays(coalesce(c.lastActiveAt, c.joinedAt, now), now).days                     AS inactiveDays

// ---------- Aggregate raw features ----------
WITH w, aaScale, geoScaleKm, tieHalfLifeDays, activityHalfLifeDays,
     c, mutuals, shared, sharedGroups, sharedOrgs, sameCommunity, embeddingSim, distanceKm, inactiveDays,
     reduce(s = 0.0, x IN mutuals | s + x.aa)                                       AS adamicAdar,
     reduce(s = 0.0, x IN shared  | s + x.overlap)                                  AS overlapMass,
     reduce(d = 100000, x IN mutuals | CASE WHEN x.days < d THEN x.days ELSE d END) AS freshestPathDays,
     myInterestMass + theirInterestMass                                             AS totalInterestMass

// ---------- Normalise every factor into [0,1] ----------
WITH w, c, mutuals, shared, sharedGroups, sharedOrgs, distanceKm, adamicAdar,
     // saturating transform: per-pair, doesn't depend on who else is in the candidate set
     1 - exp(-adamicAdar / aaScale) AS sStructural,
     // weighted Jaccard: sum(min) / sum(max)  where  sum(max) = sum(a) + sum(b) - sum(min)
     CASE WHEN totalInterestMass - overlapMass > 0
          THEN overlapMass / (totalInterestMass - overlapMass) ELSE 0.0 END AS sInterest,
     1 - exp(-( 0.6 * size(sharedGroups)
              + 0.6 * size(sharedOrgs)
              + CASE WHEN sameCommunity THEN 0.4 ELSE 0.0 END
              + 0.5 * embeddingSim )) AS sCommunity,
     CASE WHEN distanceKm IS NULL THEN 0.0 ELSE exp(-distanceKm / geoScaleKm) END AS sGeo,
     0.5 * CASE WHEN size(mutuals) = 0 THEN 0.0
                ELSE 0.5 ^ (freshestPathDays / tieHalfLifeDays) END
   + 0.5 * 0.5 ^ (inactiveDays / activityHalfLifeDays) AS sRecency

WITH c, mutuals, shared, sharedGroups, sharedOrgs, distanceKm,
     sStructural, sInterest, sCommunity, sGeo, sRecency,
     100 * ( w.structural * sStructural
           + w.interest   * sInterest
           + w.community  * sCommunity
           + w.geo        * sGeo
           + w.recency    * sRecency ) AS matchScore
ORDER BY matchScore DESC, size(mutuals) DESC, c.userId
LIMIT 10   // top-K (LIMIT must be a literal or $param)

RETURN c.userId                       AS userId,
       c.username                     AS username,
       c.name                         AS name,
       size(mutuals)                  AS mutualFriendCount,
       [x IN mutuals | x.name][..3]   AS mutualFriends,
       [x IN shared  | x.name]        AS sharedInterests,
       sharedGroups + sharedOrgs      AS sharedContext,
       round(distanceKm, 1)           AS distanceKm,
       round(matchScore, 1)           AS matchScore,
       { structural: round(sStructural, 3), interest: round(sInterest, 3),
         community:  round(sCommunity, 3),  geo:      round(sGeo, 3),
         recency:    round(sRecency, 3) } AS breakdown,
       // human-readable explanation for the UI badge (strongest signal first)
       CASE
         WHEN size(mutuals) > 1  THEN toString(size(mutuals)) + ' mutual friends'
         WHEN size(mutuals) = 1  THEN 'Friends with ' + mutuals[0].name
         WHEN size(shared) > 0   THEN 'Also into ' + shared[0].name
         WHEN size(sharedGroups) > 0 THEN 'Both in ' + sharedGroups[0]
         WHEN size(sharedOrgs) > 0   THEN 'Both at ' + sharedOrgs[0]
         WHEN distanceKm IS NOT NULL AND distanceKm < 1 THEN 'Lives in your city'
         ELSE 'Similar network'
       END AS reason;
