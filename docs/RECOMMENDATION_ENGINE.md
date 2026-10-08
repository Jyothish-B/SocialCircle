# Multi-Dimensional Friend Recommendation Engine (Neo4j)

Upgrade of the original friend-of-friend recommender (`MATCH (u)-[:FRIENDS_WITH]->()-[:FRIENDS_WITH]->(s)`, unranked)
into a two-stage, multi-factor, explainable recommender with a GDS batch layer and a cold-start fallback.

| File | Purpose |
|---|---|
| `cypher/01_schema.cypher` | Constraints & indexes |
| `cypher/02_seed.cypher` | Self-contained demo network (16 users, 10 interests, 5 cities, 4 groups, 2 companies, 2 schools) |
| `cypher/03_recommend_hybrid.cypher` | **Query 1**: weighted multi-factor recommender |
| `cypher/04_recommend_cold_start.cypher` | **Query 2**: cold-start fallback with diversity re-rank |
| `cypher/05_gds.cypher` | Offline GDS job: Louvain → `communityId`, FastRP → `embedding`, kNN → `SIMILAR_TO` |
| `backend/src/utils/cypher_loader.js` | Backend executes the `.cypher` files directly (single source of truth) |

**Requirements:** Neo4j ≥ 5.23 (scoped `CALL (x) {}` subqueries, `COUNT {}`), and the GDS plugin for `05_gds.cypher` only.

### How to run

```bash
cd backend
npm run seed              # wipe -> 01_schema -> 02_seed
npm run seed -- --gds     # ...and the GDS pipeline
```

In Neo4j Browser, run the files in order (01 → 02 → 05), then try these parameters:

```
:param userId => 'U01'    // run 03  — Jyothish, 4 friends
:param userId => 'U16'    // run 04  — Meera, brand-new account, 0 friends
```

`GET /api/friends/suggested?user_id=<id>` picks Query 1 or Query 2 based on the user's friend count. It returns
`matchScore`, `reason`, `commonFriendsCount`, `mutualFriends`, `sharedInterests`, a per-factor `breakdown` and `strategy`.

---

## 1. Graph data model

```
                                 (:Interest {name, category})
                                            ▲
                                            │ INTERESTED_IN {weight 0..1}
                                            │
 (:Company {name})  ◄── WORKS_AT {since} ──┐│┌── MEMBER_OF {role, joinedAt} ──►  (:Group {groupId, name})
                                           │││
 (:School {name})   ◄── STUDIED_AT ───────┐│││
                                     ┌────┴┴┴┴──────────────┐
                                     │        :User         │── LIVES_IN {since} ──►  (:Place {placeId, name,
                                     │ userId (unique)      │                                 location: Point})
                                     │ username (unique)    │
                                     │ name, isActive       │
                                     │ joinedAt             │
                                     │ lastActiveAt         │
                                     │ communityId   [GDS]  │
                                     │ embedding     [GDS]  │
                                     └──┬────────────────▲──┘
                                        │                │
        FRIENDS_WITH {strength 0..1,    │                │  SIMILAR_TO {score}   [GDS kNN]
          interactions, since,          ▼                │
          lastInteraction}           (:User) ────────────┘
```

Design decisions:

- **`FRIENDS_WITH` is stored once and queried undirected (`-[:FRIENDS_WITH]-`).** Storing both directions doubles
  storage and double-counts mutual friends. The backend uses an undirected `MERGE`, so A→B and B→A can never coexist.
- **Edge properties carry the signal.** `strength` (tie strength) weights Adamic-Adar. `lastInteraction` drives the
  recency decay. `INTERESTED_IN.weight` turns plain Jaccard into weighted Jaccard.
- **Interests, places, schools and companies are nodes, not string properties.** "Who else likes Hiking" becomes an
  O(degree) traversal instead of a full scan, and it lets FastRP embed attributes (§2b).
- **`Place.location` is a native `Point`.** `point.distance()` gives geodesic metres, backed by a POINT index.
- **`[GDS]` properties are optional.** The online queries read them with `coalesce`/null checks, so the system works
  before the batch job has ever run. It just uses fewer signals.

Constraints and indexes are in `cypher/01_schema.cypher`:

| Index | Type | Used by |
|---|---|---|
| `User.userId`, `User.username`, `Interest.name`, `Group.groupId`, `Place.placeId`, `Company.name`, `School.name` | UNIQUE (range) | Anchor lookup, `MERGE` in seed/login |
| `User.lastActiveAt` | RANGE | Cold-start "recently active" branch (`NodeIndexScan` confirmed in PROFILE) |
| `User.communityId` | RANGE | Community browsing / diversity |
| `Interest.category` | RANGE | Category browsing |
| `Place.location` | POINT | Radius / bounding-box geo search |
| `FRIENDS_WITH.lastInteraction` | RANGE (relationship) | "Recently active ties" queries |
| `user_search` on `name`, `username` | FULLTEXT | Search box |
| `user_embedding` | VECTOR (64-d, cosine) | Online ANN lookup over FastRP embeddings |

---

## 2. Algorithms

### 2a. Two-stage retrieval (both queries)

1. **Candidate generation** (`CALL (me) { … UNION … }`) collects candidates from five bounded sources:
   friends-of-friends, shared interests, shared group/school/workplace, `SIMILAR_TO` (GDS kNN), and the same city
   (top 50 by activity).
2. **Feature scoring** computes the expensive features only for those candidates. Each pattern comprehension is
   anchored on *both* endpoints, e.g. `(me)-[]-(m)-[]-(c)`, so it is a small `Expand(Into)`-style probe rather than
   a traversal.

### 2b. GDS (offline, `05_gds.cypher`)

| Algorithm | Projection | Output | Used for |
|---|---|---|---|
| **Louvain** (weighted by `strength`) | User + `FRIENDS_WITH` (undirected) | `User.communityId` | `S_community` bonus; diversity cap in cold start |
| **FastRP** (64-d, `iterationWeights [0,1,1,0.5]`) | **Heterogeneous**: User + Interest + Group + Place | `User.embedding` | Similarity even for users with **no friends** |
| **kNN** (cosine, topK 5, cutoff 0.9) | Embeddings | `(:User)-[:SIMILAR_TO {score}]->(:User)` | Extra candidate source and `S_community` term |
| **Vector index** | `User.embedding` | `db.index.vector.queryNodes` | Online ANN when SIMILAR_TO is stale |

Results on the seed data: 5 communities, modularity 0.442. Those are {VIT circle}, {Chennai/Zoho circle},
{Bengaluru circle}, {Hyderabad pair} and {Meera alone}. kNN puts Meera (0 friends) next to Ananya and Vikram, the
other Machine Learning users, purely through the interest nodes.

> Tuning note: FastRP cosines on small, dense graphs are compressed (p10–p90 = 0.85–0.97 here). The kNN cutoff was
> set from the observed distribution (≈ median), not from a textbook 0.5, which would keep every pair.

### 2c. Cold start (`04_recommend_cold_start.cypher`)

Degradation ladder. Each source fires only if the data exists:
**onboarding interests → group/school/workplace → same city → globally active, non-celebrity users.**
After scoring, a **diversity re-rank** keeps at most 2 people per Louvain community, so a newcomer isn't shown one
clique. In the demo, Karthik and Sneha are held back so that other clusters get a slot. Once the user adds their
first friend, the endpoint switches to the hybrid query automatically. This was verified end-to-end through the API.

---

## 3. Scoring formula

### Query 1: hybrid (`match_score ∈ [0, 100]`)

```
match_score = 100 · ( 0.40 · S_structural
                    + 0.25 · S_interest
                    + 0.15 · S_community
                    + 0.10 · S_geo
                    + 0.10 · S_recency )
```

| Factor | Definition | Why |
|---|---|---|
| `S_structural` | `1 − exp(−AA / 1.5)` where `AA = Σ_m √(s_um · s_mc) / ln(deg m)` over mutual friends *m* | Adamic-Adar: a mutual friend with 3 friends is far stronger evidence than one with 3,000. √(strengths) means a weak tie on either side weakens the path |
| `S_interest` | Weighted Jaccard `Σ min(w_u,w_c) / Σ max(w_u,w_c)` | Rewards overlap *and* penalises large non-overlapping profiles. Uses `Σmax = Σw_u + Σw_c − Σmin`, so only shared interests are traversed |
| `S_community` | `1 − exp(−(0.6·groups + 0.6·orgs + 0.4·sameLouvain + 0.5·kNNsim))` | Context (same group, school, employer) plus the GDS signals |
| `S_geo` | `exp(−km / 50)` | 0 km → 1.0, Vellore↔Chennai (125 km) → 0.08, Bengaluru (290 km) → 0.003 |
| `S_recency` | `½ · 0.5^(freshestPathDays/90) + ½ · 0.5^(inactiveDays/30)` | Half-life decay. A 2-hop path is as fresh as its *stalest* edge, and inactive candidates sink |

Each factor is in [0, 1] and the weights sum to 1, so the score is in [0, 100] by construction.

**Why saturating `1 − e^(−x)` instead of min-max normalisation:** min-max depends on who else is in the candidate
list, so the same pair would get different scores on different requests. A saturating transform is per-pair, stable
and comparable across users, and it has diminishing returns (the 10th mutual friend adds less than the 2nd).

**Worked example (verified against the query output).** Jyothish → Kavya scores **58.5**. After `--gds`, a
`SIMILAR_TO` edge between them can add a few points to the community term.

| Factor | Computation | Value | × weight |
|---|---|---|---|
| Structural | Priya: √(0.8·0.9)/ln 3 = 0.772; Karthik: √(0.5·0.5)/ln 3 = 0.455; AA = 1.228 → 1 − e^(−0.818) | 0.559 | 22.4 |
| Interest | shared min = Photography 0.8 + Hiking 0.6 = 1.4; masses 2.5 + 2.5 → 1.4 / 3.6 | 0.389 | 9.7 |
| Community | 1 shared group (Chennai Hikers) → 1 − e^(−0.6) | 0.451 | 6.8 |
| Geo | both in Chennai, 0 km | 1.000 | 10.0 |
| Recency | path fresh 5 d → 0.962; Kavya active 1 d ago → 0.977; average | 0.970 | 9.7 |
| **Total** | | | **58.5** |

Siddharth, reached through a single weak (0.3), 200-day-stale tie in another city, scores 10.1. That separation is
what the weighting is meant to produce.

### Query 2: cold start

```
match_score = 100 · ( 0.45 · S_interest + 0.20 · S_context + 0.20 · S_geo + 0.15 · S_social )
S_social    = deg/(deg+5) · 0.5^(inactiveDays/30)   // "good first friend": connected and active; saturates, so celebrities get no extra boost
```

The weights are hand-set priors. The next step is to learn them with logistic regression on accepted/ignored
recommendations, or a GDS link-prediction pipeline using these five factors as features. You can evaluate offline by
hiding 10% of `FRIENDS_WITH` edges and measuring precision@10 / recall@10.

---

## 4. Performance and production

### Measured (Neo4j 2026.09, laptop, seed data, warm plan cache)

| Query | Total db hits | Server time p50 / p95 |
|---|---|---|
| Hybrid (U01) | 945 | 16 ms / 22 ms |
| Cold start (U16) | 921 | 17 ms / 23 ms |

The anchor `MATCH (me:User {userId: $userId})` compiles to `NodeUniqueIndexSeek` with **2 db hits**. That lookup is
the sub-millisecond part. The whole recommendation is milliseconds, and its cost scales with the size of the user's
2-hop neighbourhood, **not** the size of the database.

### Reading the plan (`PROFILE`)

Condensed from the real `PROFILE` of Query 1:

```
NodeUniqueIndexSeek  UNIQUE me:User(userId)            rows=1   hits=2    <- index, not NodeByLabelScan
Expand(All)          (me)-[:FRIENDS_WITH]-(m)          rows=4   hits=5
Filter               getDegree((m)-[:FRIENDS_WITH]-()) <= maxHubDegree    <- COUNT{} compiled to O(1) degree lookup
Expand(All)          (m)-[:FRIENDS_WITH]-(c)           rows=12  hits=16
Union x5 -> Distinct                                   rows=49 -> 14 candidates
Anti / Expand(Into)  NOT (me)-[:FRIENDS_WITH]-(c)      <- Expand(Into): checks the edge between two known nodes
Top                  matchScore DESC LIMIT 10          <- top-k heap, not a full sort
```

Checklist when reading any plan:

- `EXPLAIN` gives the plan without running it. `PROFILE` runs it and reports **rows** and **db hits** per operator.
  Optimise the operator with the most db hits.
- The query should start from an **index seek**. `NodeByLabelScan` / `AllNodesScan` at the leaf means a missing
  index or an unparameterised anchor.
- Look for `Expand(Into)` on existence checks, and **`Top`** rather than `Sort` + `Limit`.
- Watch for `CartesianProduct` (disconnected patterns) and `Eager` (read/write conflicts that buffer every row).
- Always pass **parameters** (`$userId`), so the plan is cached and reused. Neo4j also auto-parameterises the
  literal tunables (visible as `$autodouble_*` in the plan).

### The celebrity (supernode) problem

A user with 1M friends turns a 2-hop expansion into 1M × avg-degree rows. Mitigations, in order of use here:

1. **Degree-capped expansion (implemented).** `WHERE COUNT { (m)-[:FRIENDS_WITH]-() } <= maxHubDegree` on every hub
   in candidate generation. Neo4j stores per-type degree counts for dense nodes (relationship groups), so this
   check is O(1) and never iterates the celebrity's edges (`getDegree` in the plan).
2. **Adamic-Adar down-weights hubs anyway.** 1/ln(deg) means a celebrity mutual contributes almost nothing, so
   skipping them costs little accuracy.
3. **Bounded branches.** City and "active users" branches use `ORDER BY … LIMIT 50`. A metro of 10M people can't
   flood the candidate set.
4. **Separate relationship types for asymmetric ties.** Model follower edges to celebrities as `:FOLLOWS`, not
   `:FRIENDS_WITH` (`ProjectNos/follows.csv` already has this). Friendship traversals then never touch the fan-out.
5. **Precompute offline.** For extreme hubs, move the work to GDS (`SIMILAR_TO`) and serve the result in O(k).

---

## 5. Project defense guide: 4 innovations and their trade-offs

1. **Two-stage retrieval on index-free adjacency.**
   *What:* bounded multi-source candidate generation, then feature scoring on a small set (14 candidates here).
   *Why a graph DB:* each hop follows stored pointers, so cost is O(edges touched), independent of total users.
   A SQL equivalent self-joins a `friendships` table per hop, and each join goes through a B-tree index.
   *Trade-off:* the hub cap trades **recall for predictable latency**. Two people whose *only* link is a celebrity
   won't be suggested, which is usually the right call because that link is weak evidence.

2. **Weighted Adamic-Adar with saturating normalisation instead of mutual-friend counting.**
   *What:* each mutual friend's vote is scaled by 1/ln(degree) and by tie strength, then mapped through 1 − e^(−x).
   *Why:* common-neighbour counts reward people who know everyone. Jaccard penalises active users. AA is one of the
   strongest classic link predictors (Liben-Nowell & Kleinberg, 2007).
   *Trade-off:* cost is O(Σ deg(m)) over the user's friends, i.e. 2-hop neighbourhood size. The saturation constant
   (1.5) is a hyperparameter, but it makes scores **stable per pair** rather than relative to each result list.

3. **Hybrid online/offline architecture with graceful degradation.**
   *What:* GDS runs as a batch job (Louvain ≈ near-linear in edges per pass, FastRP O(edges × dims × iterations),
   kNN via approximate NN-Descent rather than O(n²)). It writes plain properties that the online query reads with
   `coalesce`. FastRP runs on a **heterogeneous** graph, so a user with zero friends still gets an embedding from
   their interests and city.
   *Trade-off:* **freshness vs latency.** Batch outputs are hours old. A new user isn't in `SIMILAR_TO` until the
   next run, which is exactly why the cold-start query computes attribute similarity live. The vector index gives an
   ANN path that avoids rerunning kNN.

4. **Cold-start ladder plus diversity-aware re-ranking, with explainability.**
   *What:* the scoring model switches by data availability (interests → context → city → active users). It caps 2 per
   Louvain community, and every result carries a human-readable `reason` and a per-factor `breakdown`.
   *Trade-off:* the diversity cap gives up a little precision@k for **coverage and less filter-bubbling**, which
   matters most when you know nothing about the user. Explanations cost nothing extra because they come from the
   same features that were scored.

### Likely examiner questions

- *"Why not just count mutual friends?"* See the worked example. Kavya and Rahul both have 2 mutuals, but tie
  strength, freshness, interests and distance separate them (58.5 vs 53.4).
- *"How do you know the weights are right?"* They are priors, not learned. The holdout evaluation in §3 is how you
  would tune them, and the per-factor `breakdown` makes that tuning inspectable.
- *"What if GDS isn't installed?"* Everything except `05_gds.cypher` still runs. The GDS terms evaluate to 0.
- *"Undirected vs directed?"* Stored directed, because Neo4j relationships always have a direction. They are
  semantically undirected and matched with `-[]-`, with an undirected projection in GDS.

### Known limitations

- Other controllers still address users by internal `id()`, which is deprecated in Neo4j 5 and
  not stable across deletes. The recommender uses `userId` and bridges the two in `getSuggestedFriends`. Migrating
  the remaining endpoints to `userId` is a mechanical follow-up.
- `FRIENDS_WITH.strength` is set to 0.5 when a friendship is created in the app. In production it would be
  recomputed periodically from `interactions` (e.g. `1 − e^(−interactions/100)`).

---

## 6. Scaled platform (5,000 users)

### Data commands (run from `backend/`)

| Command | What it does | Destructive? |
|---|---|---|
| `npm run adapt` | Fills in the properties the CSV import skipped (names, dates, strengths, topics) from `ProjectNos/*.csv` | No, only adds properties |
| `npm run grow` | Grows the network to 5,000 users around the 50 CSV users (`--users N` for another size) | No, everything it writes is tagged `generated: true` |
| `npm run grow -- --remove` | Deletes exactly what `grow` created | Only generated data |
| `npm run seed` | Loads the 16-person demo network | Refuses on a non-empty database unless `--force` |

The generator is seeded, so it produces the same network every time. People belong to hidden circles (a college batch, a team) that share themed interests and groups. Friendships form inside circles, through groups, by triadic closure and through a few long-range ties. 13 influencers have more than 200 friends, so the hub cap has real hubs to handle.

| Metric | Value |
|---|---|
| Users / friendships / follows | 5,000 / 68,359 / 22,592 |
| Friends per person | median 22, p90 46, max 771 |
| CSV users' friends | 20 to 58 each |
| Brand-new signups (cold start) | 25 |
| Hybrid query, normal user | ~42 to 54 ms p50 |
| Hybrid query, top influencer | ~81 ms p50 |

At this size every interest has hundreds of fans, so the interest and group candidate branches rank by overlap and keep the top 100 instead of skipping hubs.

### New API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/friends/request` | Send a request (accepts automatically if they already asked you) |
| GET | `/api/friends/requests?user_id=` | Incoming and outgoing requests with mutual counts |
| POST | `/api/friends/requests/accept` / `decline` / `cancel` | Respond to or withdraw a request |
| GET | `/api/people/search?viewer_id=&q=` | Full-text search (`people_search` index over name, username, bio); empty `q` returns people you may know |
| GET | `/api/people/:id?viewer_id=` | Profile: stats, interests, groups, mutual friends, closest friends, relationship status |

Pending requests are excluded from recommendations. Accepting creates the friendship with `strength 0.5` and fresh timestamps, which feed the strength and recency factors.
