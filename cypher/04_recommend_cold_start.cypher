// =====================================================================
// 04_recommend_cold_start.cypher - QUERY 2: fallback for users with 0 friends
// Requires Neo4j >= 5.23.   Neo4j Browser:  :param userId => 'U16'
//
// A new user has no edges, so Adamic-Adar / triadic closure are all 0.
// We switch from "who do your friends know" to "who looks like you":
//
// match_score = 100 * ( 0.45 * S_interest   weighted Jaccard (onboarding interests)
//                     + 0.20 * S_context    shared group / school / workplace
//                     + 0.20 * S_geo        exp(-km / 50)
//                     + 0.15 * S_social )   "good first friend" prior:
//                                           connectedness x recent activity
//
// Degradation ladder - each candidate branch fires only if data exists:
//   interests -> groups/org -> same city -> (nothing at all) active users globally
// Final step: DIVERSITY RE-RANK - at most 2 people per Louvain community,
// so a newcomer isn't shown 10 people from the same clique.
// =====================================================================

WITH {interest: 0.45, context: 0.20, geo: 0.20, social: 0.15} AS w,
     200         AS maxHubDegree,
     2           AS perCommunityCap,
     50.0        AS geoScaleKm,
     30.0        AS activityHalfLifeDays,
     datetime()  AS now

MATCH (me:User {userId: $userId})
OPTIONAL MATCH (me)-[:LIVES_IN]->(myPlace:Place)
WITH w, maxHubDegree, perCommunityCap, geoScaleKm, activityHalfLifeDays, now,
     me, myPlace,
     reduce(t = 0.0, x IN [(me)-[r:INTERESTED_IN]->() | r.weight] | t + x) AS myInterestMass

// ---------- Stage 1: candidates from profile signals only ----------
CALL (me, myPlace, maxHubDegree) {
  MATCH (me)-[:INTERESTED_IN]->(:Interest)<-[:INTERESTED_IN]-(c:User)
  WITH c, count(*) AS overlap
  RETURN c ORDER BY overlap DESC, c.lastActiveAt DESC LIMIT 100
  UNION
  MATCH (me)-[:MEMBER_OF|WORKS_AT|STUDIED_AT]->(ctx)<-[:MEMBER_OF|WORKS_AT|STUDIED_AT]-(c:User)
  WITH c, count(*) AS overlap
  RETURN c ORDER BY overlap DESC, c.lastActiveAt DESC LIMIT 100
  UNION
  MATCH (myPlace)<-[:LIVES_IN]-(c:User)
  RETURN c ORDER BY c.lastActiveAt DESC LIMIT 50
  UNION
  // last resort for a completely empty profile: recently active, non-celebrity users.
  // ORDER BY + LIMIT is served by the user_last_active range index (no full sort).
  MATCH (c:User)
  WHERE c.lastActiveAt IS NOT NULL
    AND 1 <= COUNT { (c)-[:FRIENDS_WITH]-() } <= maxHubDegree
  RETURN c ORDER BY c.lastActiveAt DESC LIMIT 50
}
WITH DISTINCT w, perCommunityCap, geoScaleKm, activityHalfLifeDays, now,
     me, myPlace, myInterestMass, c
WHERE c <> me
  AND coalesce(c.isActive, true)
  AND NOT (me)-[:FRIENDS_WITH]-(c)
  AND NOT (me)-[:BLOCKED]-(c)
  AND NOT (me)-[:FRIEND_REQUEST]-(c)        // already asked, or waiting on my answer

// ---------- Stage 2: features ----------
OPTIONAL MATCH (c)-[:LIVES_IN]->(theirPlace:Place)
WITH w, perCommunityCap, geoScaleKm, activityHalfLifeDays, now, myInterestMass, c,
     [(me)-[r1:INTERESTED_IN]->(i:Interest)<-[r2:INTERESTED_IN]-(c) |
        { name: i.name,
          overlap: CASE WHEN r1.weight < r2.weight THEN r1.weight ELSE r2.weight END }] AS shared,
     reduce(t = 0.0, x IN [(c)-[r:INTERESTED_IN]->() | r.weight] | t + x)          AS theirInterestMass,
     [(me)-[:MEMBER_OF|WORKS_AT|STUDIED_AT]->(ctx)<-[:MEMBER_OF|WORKS_AT|STUDIED_AT]-(c) | ctx.name] AS sharedContext,
     CASE WHEN myPlace IS NULL OR theirPlace IS NULL THEN null
          ELSE point.distance(myPlace.location, theirPlace.location) / 1000.0 END AS distanceKm,
     COUNT { (c)-[:FRIENDS_WITH]-() }                                              AS degree,
     duration.inDays(coalesce(c.lastActiveAt, c.joinedAt, now), now).days          AS inactiveDays

WITH w, perCommunityCap, c, shared, sharedContext, distanceKm, degree,
     reduce(s = 0.0, x IN shared | s + x.overlap) AS overlapMass,
     myInterestMass + theirInterestMass           AS totalInterestMass,
     geoScaleKm, activityHalfLifeDays, inactiveDays

WITH w, perCommunityCap, c, shared, sharedContext, distanceKm, degree,
     CASE WHEN totalInterestMass - overlapMass > 0
          THEN overlapMass / (totalInterestMass - overlapMass) ELSE 0.0 END AS sInterest,
     1 - exp(-0.6 * size(sharedContext))                                   AS sContext,
     CASE WHEN distanceKm IS NULL THEN 0.0 ELSE exp(-distanceKm / geoScaleKm) END AS sGeo,
     // connectedness saturates at ~5 friends (d/(d+5)) so celebrities get no extra boost
     (toFloat(degree) / (degree + 5)) * 0.5 ^ (inactiveDays / activityHalfLifeDays) AS sSocial

WITH perCommunityCap, c, shared, sharedContext, distanceKm, degree,
     sInterest, sContext, sGeo, sSocial,
     100 * ( w.interest * sInterest + w.context * sContext
           + w.geo      * sGeo      + w.social  * sSocial ) AS matchScore

// ---------- Diversity re-rank: cap per community ----------
// (falls back to the user's own id when Louvain hasn't run => no capping)
ORDER BY matchScore DESC, c.userId
WITH perCommunityCap, coalesce(toString(c.communityId), c.userId) AS bucket,
     collect({ c: c, shared: shared, sharedContext: sharedContext, distanceKm: distanceKm,
               degree: degree, matchScore: matchScore,
               breakdown: { interest: round(sInterest, 3), context: round(sContext, 3),
                            geo: round(sGeo, 3), social: round(sSocial, 3) } }) AS ranked
UNWIND ranked[..perCommunityCap] AS rec
WITH rec
ORDER BY rec.matchScore DESC, rec.c.userId
LIMIT 10   // top-K (LIMIT must be a literal or $param)

RETURN rec.c.userId                      AS userId,
       rec.c.username                    AS username,
       rec.c.name                        AS name,
       0                                 AS mutualFriendCount,
       []                                AS mutualFriends,
       [x IN rec.shared | x.name]        AS sharedInterests,
       rec.sharedContext                 AS sharedContext,
       round(rec.distanceKm, 1)          AS distanceKm,
       round(rec.matchScore, 1)          AS matchScore,
       rec.breakdown                     AS breakdown,
       CASE
         WHEN size(rec.shared) > 1        THEN 'Also into ' + rec.shared[0].name + ' & ' + rec.shared[1].name
         WHEN size(rec.shared) = 1        THEN 'Also into ' + rec.shared[0].name
         WHEN size(rec.sharedContext) > 0 THEN 'Both at ' + rec.sharedContext[0]
         WHEN rec.distanceKm IS NOT NULL AND rec.distanceKm < 1 THEN 'Lives in your city'
         ELSE 'Active in the community'
       END                               AS reason;
