// =====================================================================
// 02_seed.cypher - self-contained demo network
//   16 Users · 10 Interests · 5 Places · 4 Groups · 2 Companies · 2 Schools
// All timestamps are RELATIVE to datetime(), so recency scoring behaves
// the same no matter when you run the script.
//
// Story baked into the data (so the demo has something to show):
//   * U01 Jyothish  : main demo user (4 friends)
//   * U13 Kavya     : 2 strong mutuals + shared hobbies + same city -> should rank #1 for U01
//   * U14 Siddharth : reachable via 1 weak, stale tie -> should rank low
//   * U16 Meera     : brand-new account, 0 friends -> exercises the cold-start query
// =====================================================================

// ---------- 0. Wipe previous demo data ----------
MATCH (n)
WHERE n:User OR n:Interest OR n:Group OR n:Place OR n:Company OR n:School
DETACH DELETE n;

// ---------- 1. Places (WGS-84 points -> geographic proximity) ----------
UNWIND [
  {id: 'P01', name: 'Chennai',    description: 'Tamil Nadu', lat: 13.0827, lon: 80.2707},
  {id: 'P02', name: 'Vellore',    description: 'Tamil Nadu', lat: 12.9165, lon: 79.1325},
  {id: 'P03', name: 'Bengaluru',  description: 'Karnataka',  lat: 12.9716, lon: 77.5946},
  {id: 'P04', name: 'Hyderabad',  description: 'Telangana',  lat: 17.3850, lon: 78.4867},
  {id: 'P05', name: 'Coimbatore', description: 'Tamil Nadu', lat: 11.0168, lon: 76.9558}
] AS row
MERGE (p:Place {placeId: row.id})
SET p.name = row.name,
    p.description = row.description,
    p.location = point({latitude: row.lat, longitude: row.lon});

// ---------- 2. Interests ----------
UNWIND [
  ['Photography', 'Arts'], ['Painting', 'Arts'], ['Music', 'Arts'],
  ['Programming', 'Tech'], ['Machine Learning', 'Tech'],
  ['Gaming', 'Entertainment'], ['Anime', 'Entertainment'],
  ['Hiking', 'Outdoors'], ['Travel', 'Outdoors'], ['Cricket', 'Sports']
] AS row
MERGE (i:Interest {name: row[0]})
SET i.category = row[1];

// ---------- 3. Groups, Companies, Schools ----------
UNWIND [
  {id: 'G01', name: 'Chennai Hikers',         description: 'Weekend treks around the Eastern Ghats'},
  {id: 'G02', name: 'VIT Coders Club',        description: 'Hackathons, CP and side projects'},
  {id: 'G03', name: 'Shutterbugs Collective', description: 'Street & landscape photography walks'},
  {id: 'G04', name: 'Anime Guild',            description: 'Seasonal watch-alongs and cosplay'}
] AS row
MERGE (g:Group {groupId: row.id})
SET g.name = row.name, g.description = row.description;

UNWIND [
  {name: 'Zoho',    description: 'SaaS, Chennai'},
  {name: 'Infosys', description: 'IT services, Bengaluru'}
] AS row
MERGE (c:Company {name: row.name})
SET c.description = row.description;

UNWIND ['VIT Vellore', 'Anna University'] AS name
MERGE (:School {name: name});

// ---------- 4. Users (+ LIVES_IN, WORKS_AT, STUDIED_AT) ----------
// joined / active = days ago
UNWIND [
  {id: 'U01', u: 'jyothish',  n: 'Jyothish',  place: 'P01', joined: 300, active: 0,  school: 'VIT Vellore',     company: null},
  {id: 'U02', u: 'abhinav',   n: 'Abhinav',   place: 'P02', joined: 250, active: 1,  school: 'VIT Vellore',     company: null},
  {id: 'U03', u: 'priya',     n: 'Priya',     place: 'P01', joined: 400, active: 2,  school: null,              company: 'Zoho'},
  {id: 'U04', u: 'karthik',   n: 'Karthik',   place: 'P01', joined: 380, active: 9,  school: null,              company: 'Zoho'},
  {id: 'U05', u: 'divya',     n: 'Divya',     place: 'P03', joined: 500, active: 3,  school: null,              company: 'Infosys'},
  {id: 'U06', u: 'rahul',     n: 'Rahul',     place: 'P02', joined: 220, active: 1,  school: 'VIT Vellore',     company: null},
  {id: 'U07', u: 'sneha',     n: 'Sneha',     place: 'P01', joined: 310, active: 14, school: 'Anna University', company: null},
  {id: 'U08', u: 'arjun',     n: 'Arjun',     place: 'P03', joined: 450, active: 5,  school: null,              company: 'Infosys'},
  {id: 'U09', u: 'lakshmi',   n: 'Lakshmi',   place: 'P05', joined: 290, active: 30, school: 'Anna University', company: null},
  {id: 'U10', u: 'vikram',    n: 'Vikram',    place: 'P04', joined: 360, active: 60, school: null,              company: 'Infosys'},
  {id: 'U11', u: 'ananya',    n: 'Ananya',    place: 'P01', joined: 200, active: 0,  school: 'VIT Vellore',     company: null},
  {id: 'U12', u: 'rohan',     n: 'Rohan',     place: 'P02', joined: 180, active: 2,  school: 'VIT Vellore',     company: null},
  {id: 'U13', u: 'kavya',     n: 'Kavya',     place: 'P01', joined: 330, active: 1,  school: null,              company: 'Zoho'},
  {id: 'U14', u: 'siddharth', n: 'Siddharth', place: 'P03', joined: 600, active: 90, school: null,              company: null},
  {id: 'U15', u: 'nisha',     n: 'Nisha',     place: 'P04', joined: 150, active: 45, school: null,              company: null},
  {id: 'U16', u: 'meera',     n: 'Meera',     place: 'P01', joined: 1,   active: 0,  school: 'VIT Vellore',     company: null}
] AS row
MERGE (u:User {userId: row.id})
SET u.username     = row.u,
    u.name         = row.n,
    u.joinedAt     = datetime() - duration({days: row.joined}),
    u.lastActiveAt = datetime() - duration({days: row.active}),
    u.isActive     = true
WITH u, row
MATCH (p:Place {placeId: row.place})
MERGE (u)-[l:LIVES_IN]->(p)
SET l.since = u.joinedAt
WITH u, row
// FOREACH(CASE) = conditional write without breaking the row stream
FOREACH (_ IN CASE WHEN row.school IS NULL THEN [] ELSE [1] END |
  MERGE (s:School {name: row.school})
  MERGE (u)-[:STUDIED_AT]->(s))
FOREACH (_ IN CASE WHEN row.company IS NULL THEN [] ELSE [1] END |
  MERGE (c:Company {name: row.company})
  MERGE (u)-[w:WORKS_AT]->(c)
  SET w.since = u.joinedAt);

// ---------- 5. INTERESTED_IN {weight 0..1 = how much they care} ----------
UNWIND [
  ['U01', 'Programming', 1.0], ['U01', 'Photography', 0.9], ['U01', 'Hiking', 0.6],
  ['U02', 'Gaming', 1.0], ['U02', 'Anime', 0.9], ['U02', 'Programming', 0.7],
  ['U03', 'Hiking', 0.9], ['U03', 'Photography', 0.8], ['U03', 'Travel', 0.7],
  ['U04', 'Programming', 0.9], ['U04', 'Cricket', 0.8],
  ['U05', 'Painting', 0.9], ['U05', 'Photography', 0.7], ['U05', 'Music', 0.6],
  ['U06', 'Programming', 1.0], ['U06', 'Gaming', 0.6], ['U06', 'Cricket', 0.5],
  ['U07', 'Music', 0.9], ['U07', 'Travel', 0.8], ['U07', 'Photography', 0.5],
  ['U08', 'Hiking', 0.9], ['U08', 'Cricket', 0.7], ['U08', 'Travel', 0.6],
  ['U09', 'Painting', 0.8], ['U09', 'Music', 0.7],
  ['U10', 'Programming', 0.9], ['U10', 'Machine Learning', 0.8], ['U10', 'Gaming', 0.5],
  ['U11', 'Machine Learning', 1.0], ['U11', 'Programming', 0.8], ['U11', 'Photography', 0.4],
  ['U12', 'Anime', 1.0], ['U12', 'Gaming', 0.9],
  ['U13', 'Hiking', 1.0], ['U13', 'Photography', 0.8], ['U13', 'Travel', 0.7],
  ['U14', 'Cricket', 0.9], ['U14', 'Music', 0.6],
  ['U15', 'Painting', 0.8], ['U15', 'Travel', 0.7],
  ['U16', 'Machine Learning', 0.9], ['U16', 'Photography', 0.8]
] AS row
MATCH (u:User {userId: row[0]}), (i:Interest {name: row[1]})
MERGE (u)-[r:INTERESTED_IN]->(i)
SET r.weight = row[2];

// ---------- 6. MEMBER_OF {joinedAt, role} ----------
UNWIND [
  ['U01', 'G01', 'member', 120], ['U03', 'G01', 'admin', 380], ['U13', 'G01', 'member', 200], ['U08', 'G01', 'member', 90],
  ['U01', 'G02', 'member', 280], ['U02', 'G02', 'member', 240], ['U06', 'G02', 'admin', 210], ['U11', 'G02', 'member', 150], ['U12', 'G02', 'member', 100],
  ['U03', 'G03', 'member', 300], ['U05', 'G03', 'admin', 480], ['U07', 'G03', 'member', 260], ['U13', 'G03', 'member', 180],
  ['U02', 'G04', 'member', 230], ['U12', 'G04', 'admin', 170]
] AS row
MATCH (u:User {userId: row[0]}), (g:Group {groupId: row[1]})
MERGE (u)-[m:MEMBER_OF]->(g)
SET m.role = row[2], m.joinedAt = datetime() - duration({days: row[3]});

// ---------- 7. FRIENDS_WITH - stored ONCE, queried undirected ----------
// strength 0..1 (tie strength), interactions = message/like/comment count,
// since / lastInteraction = days ago
UNWIND [
  ['U01', 'U02', 0.9, 340, 200, 2],
  ['U01', 'U03', 0.8, 210, 280, 5],
  ['U01', 'U04', 0.5,  60, 250, 40],
  ['U01', 'U11', 0.7, 150, 150, 10],
  ['U02', 'U06', 0.8, 260, 210, 3],
  ['U02', 'U12', 0.9, 300, 170, 1],
  ['U06', 'U12', 0.6, 110, 160, 20],
  ['U11', 'U06', 0.6,  90, 140, 15],
  ['U11', 'U10', 0.4,  25, 190, 120],
  ['U03', 'U13', 0.9, 280, 300, 4],
  ['U03', 'U07', 0.6,  80, 250, 30],
  ['U04', 'U13', 0.5,  45, 300, 60],
  ['U04', 'U14', 0.3,  10, 360, 200],
  ['U05', 'U08', 0.8, 190, 420, 7],
  ['U05', 'U09', 0.6,  70, 280, 25],
  ['U05', 'U14', 0.5,  40, 450, 100],
  ['U08', 'U14', 0.7, 120, 400, 12],
  ['U08', 'U13', 0.4,  30, 200, 80],
  ['U07', 'U09', 0.5,  50, 270, 50],
  ['U10', 'U15', 0.4,  20, 140, 90]
] AS row
MATCH (a:User {userId: row[0]}), (b:User {userId: row[1]})
MERGE (a)-[f:FRIENDS_WITH]->(b)
SET f.strength        = row[2],
    f.interactions    = row[3],
    f.since           = datetime() - duration({days: row[4]}),
    f.lastInteraction = datetime() - duration({days: row[5]});
