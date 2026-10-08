import { db } from "../../lib/db.js";

// Grows the CSV graph into a realistic social network around the original users.
// Everything it writes is tagged {generated: true}, so --remove undoes it exactly.
//
// Usage:  npm run grow                     -> grow to 5,000 users
//         npm run grow -- --users 2000     -> grow to another size
//         npm run grow -- --remove         -> delete everything grow created
//
// Model: people belong to hidden "circles" (a college batch, a team, a
// neighbourhood) that share themed interests and groups. Friendships form
// mostly inside circles, then through groups, friends-of-friends (triadic
// closure) and a few long-range ties. A handful of influencers get hundreds of
// friends, so the recommender's hub cap has real hubs to deal with.

const args = process.argv.slice(2);
const TARGET_USERS = Number(args[args.indexOf("--users") + 1]) || 5000;
const REMOVE = args.includes("--remove");
const CIRCLES = Math.max(20, Math.round(TARGET_USERS / 30));
const INFLUENCERS = Math.max(4, Math.round(TARGET_USERS / 400));
const NEW_SIGNUPS = 25;
const BATCH = 2000;
const DAY = 86_400_000;
const NOW = Date.now();

// ---------- deterministic randomness ----------
let seed = 42;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + rand() * (hi - lo);
const int = (lo, hi) => Math.floor(between(lo, hi + 1));
const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const sample = (arr, n) => {
  const copy = [...arr], out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
};
const iso = (ms) => new Date(ms).toISOString();
const round2 = (x) => Math.round(x * 100) / 100;

const FIRST = ["Aarav", "Aditi", "Akash", "Ananya", "Anil", "Anjali", "Arjun", "Arun", "Bhavana", "Chandra", "Darshan", "Deepa", "Deepak", "Devi", "Dhruv", "Divya", "Farhan", "Gautam", "Gayathri", "Harini", "Harsha", "Ishaan", "Ishita", "Jai", "Janani", "Kabir", "Kavin", "Keerthi", "Kiran", "Lakshmi", "Madhav", "Manoj", "Meena", "Mohan", "Nandini", "Naveen", "Neha", "Nikhil", "Nithya", "Pooja", "Pradeep", "Pranav", "Preethi", "Rahul", "Rajesh", "Ramya", "Ravi", "Riya", "Rohit", "Sai", "Sanjana", "Santosh", "Saranya", "Shreya", "Siddharth", "Sneha", "Srinivas", "Suresh", "Swathi", "Tanvi", "Tarun", "Uma", "Varun", "Vidya", "Vignesh", "Vikram", "Vinay", "Yamini", "Yash", "Zara", "Abdul", "Fatima", "Imran", "Joseph", "Mary", "Thomas", "Ayesha", "Rehan", "Simran", "Gurpreet"];
const LAST = ["Iyer", "Reddy", "Nair", "Sharma", "Rao", "Menon", "Pillai", "Gupta", "Patel", "Kumar", "Singh", "Das", "Bose", "Joshi", "Kulkarni", "Naidu", "Chettiar", "Varma", "Shetty", "Mehta", "Khan", "Fernandes", "Thomas", "Mathew", "Krishnan", "Subramaniam", "Raman", "Bhat", "Hegde", "Agarwal"];
const BIO_OPENERS = ["Into", "Big fan of", "Spends weekends on", "Always up for", "Learning", "Obsessed with", "Can talk for hours about"];
const BIO_CLOSERS = ["Say hi!", "Coffee first.", "Building things on the side.", "Usually outdoors.", "Night owl.", "Open to collabs.", ""];

async function remove() {
  const [users] = await db.executeQuery("MATCH (u:User {generated: true}) RETURN count(u) AS n");
  await db.executeQuery(
    "MATCH (u:User {generated: true}) CALL (u) { DETACH DELETE u } IN TRANSACTIONS OF 1000 ROWS"
  );
  await db.executeQuery("MATCH ()-[r {generated: true}]->() DELETE r");
  await refreshActivity();
  console.log(`✅ Removed ${users.get("n").toNumber()} generated users and every generated relationship.`);
}

async function refreshActivity() {
  await db.executeQuery(
    `MATCH (u:User) WHERE u.generated IS NULL
     WITH u, [(u)-[r:FRIENDS_WITH|FOLLOWS]-() WHERE r.since IS NOT NULL | r.since] + [u.joinedAt] AS dates
     SET u.lastActiveAt = reduce(m = null, d IN dates | CASE WHEN m IS NULL OR d > m THEN d ELSE m END)`
  );
}

async function loadExisting() {
  const users = (
    await db.executeQuery(
      `MATCH (u:User)
       RETURN u.userId AS id, u.joinedAt.epochMillis AS joined,
              [(u)-[:INTERESTED_IN]->(i) | i.name] AS interests,
              [(u)-[:MEMBER_OF]->(g) | g.groupId] AS groups`
    )
  ).map((r) => ({
    id: r.get("id"),
    joined: Number(r.get("joined")),
    interests: r.get("interests"),
    groups: r.get("groups"),
    existing: true,
  }));
  const friendships = (
    await db.executeQuery("MATCH (a:User)-[:FRIENDS_WITH]->(b:User) RETURN a.userId AS a, b.userId AS b")
  ).map((r) => [r.get("a"), r.get("b")]);
  const interests = (
    await db.executeQuery("MATCH (i:Interest) RETURN i.name AS name, i.category AS category")
  ).map((r) => ({ name: r.get("name"), category: r.get("category") }));
  const groups = (await db.executeQuery("MATCH (g:Group) RETURN g.groupId AS id")).map((r) => r.get("id"));
  return { users, friendships, interests, groups };
}

function buildNetwork({ users: existing, friendships, interests, groups }) {
  // ---- circles with a theme: interests from one topic plus a wildcard, and 2-3 groups
  const byTopic = {};
  for (const i of interests) (byTopic[i.category || "Other"] ||= []).push(i.name);
  const topics = Object.keys(byTopic);
  const circles = Array.from({ length: CIRCLES }, () => {
    const topic = pick(topics);
    return {
      interests: [...sample(byTopic[topic], 3), pick(interests).name],
      groups: sample(groups, int(2, 3)),
      members: [],
    };
  });

  // ---- people
  const people = [];
  const usernames = new Set();
  for (const u of existing) {
    // join the circle that best matches what the CSV says about them
    let best = 0, bestScore = -1;
    circles.forEach((c, i) => {
      const s = c.interests.filter((x) => u.interests.includes(x)).length + 2 * c.groups.filter((g) => u.groups.includes(g)).length + rand() * 0.5;
      if (s > bestScore) { bestScore = s; best = i; }
    });
    people.push({ ...u, circle: best, target: int(18, 45) });
  }
  const toCreate = Math.max(0, TARGET_USERS - existing.length);
  for (let n = 0; n < toCreate; n++) {
    const first = pick(FIRST), last = pick(LAST);
    let username = `${first}.${last}`.toLowerCase(), k = 2;
    while (usernames.has(username)) username = `${first}.${last}${k++}`.toLowerCase();
    usernames.add(username);
    const isNew = n < NEW_SIGNUPS;
    const isInfluencer = !isNew && n < NEW_SIGNUPS + INFLUENCERS;
    const circle = Math.min(CIRCLES - 1, Math.floor(CIRCLES * rand() ** 1.6)); // a few big circles, many small
    const joined = isNew ? NOW - between(0, 3) * DAY : between(Date.UTC(2023, 0, 1), NOW - 7 * DAY);
    const target = isNew ? 0 : isInfluencer ? int(280, 520) : Math.max(3, Math.min(120, Math.round(Math.exp(Math.log(17) + 0.6 * normal()))));
    const theme = circles[circle];
    const interestSet = new Set(sample(theme.interests, int(2, 3)));
    while (interestSet.size < int(3, 6)) interestSet.add(pick(interests).name);
    const myInterests = [...interestSet].map((name) => ({
      name,
      weight: round2(theme.interests.includes(name) ? between(0.5, 1) : between(0.2, 0.7)),
    }));
    const groupSet = new Set(rand() < 0.75 ? sample(theme.groups, int(1, 2)) : []);
    if (rand() < 0.5 || groupSet.size === 0) groupSet.add(pick(groups));
    const top = myInterests.slice().sort((a, b) => b.weight - a.weight).slice(0, 2).map((x) => x.name.toLowerCase());
    people.push({
      id: `U${String(existing.length + n + 1).padStart(4, "0")}`,
      name: `${first} ${last}`,
      username,
      email: `${username}@example.com`,
      bio: isInfluencer
        ? `Creator sharing ${top.join(" and ")} with ${int(10, 90)}k followers.`
        : `${pick(BIO_OPENERS)} ${top.join(" and ")}. ${pick(BIO_CLOSERS)}`.trim(),
      joined,
      lastActive: isNew ? NOW - between(0, 1) * DAY
        : Math.max(joined, NOW - (rand() < 0.1 ? between(60, 400) : -Math.log(1 - rand()) * 15) * DAY),
      circle,
      target,
      influencer: isInfluencer,
      interests: myInterests,
      groups: [...groupSet],
      generated: true,
    });
  }
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  for (const p of people) circles[p.circle].members.push(p.id);
  const groupMembers = {};
  for (const p of people) for (const g of p.groups) (groupMembers[g] ||= []).push(p.id);
  const influencers = people.filter((p) => p.influencer).map((p) => p.id);
  const active = people.filter((p) => p.target > 0).map((p) => p.id);

  // ---- friendships
  const adj = Object.fromEntries(people.map((p) => [p.id, new Set()]));
  const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  for (const [a, b] of friendships) { adj[a].add(b); adj[b].add(a); }
  const edges = [];
  const connect = (a, b, mode) => {
    if (a === b || adj[a].has(b) || byId[b].target === 0) return false;
    adj[a].add(b); adj[b].add(a);
    const strength = round2(
      mode === "circle" ? between(0.5, 1) : mode === "group" ? between(0.3, 0.8) : mode === "fof" ? between(0.3, 0.7) : between(0.1, 0.4)
    );
    const start = Math.max(byId[a].joined, byId[b].joined);
    const since = between(start, NOW - DAY);
    const last = Math.max(since, NOW - Math.min((NOW - since) / DAY, -Math.log(1 - rand()) * 160 * (1.2 - strength)) * DAY);
    edges.push({ a, b, strength, since: iso(since), last: iso(last), interactions: Math.round(strength * between(20, 400)) });
    return true;
  };
  for (const id of sample(active, active.length)) {
    const me = byId[id];
    let tries = me.target * 6;
    while (adj[id].size < me.target && tries-- > 0) {
      const r = rand();
      let other;
      if (me.influencer) other = pick(active);
      else if (r < 0.6) other = pick(circles[me.circle].members);
      else if (r < 0.8 && me.groups.length) other = pick(groupMembers[pick(me.groups)]);
      else if (r < 0.93 && adj[id].size) other = pick([...adj[pick([...adj[id]])]]);
      else other = rand() < 0.3 ? pick(influencers) : pick(active);
      if (!other || (!byId[other].influencer && adj[other].size >= byId[other].target * 1.4)) continue;
      connect(id, other, me.influencer ? "global" : r < 0.6 ? "circle" : r < 0.8 ? "group" : r < 0.93 ? "fof" : "global");
    }
  }

  // ---- follows: mostly influencers, some circle-mates
  const follows = [];
  for (const p of people) {
    if (!p.generated || p.target === 0) continue;
    const seen = new Set();
    for (let i = int(2, 8); i > 0; i--) {
      const other = rand() < 0.5 ? pick(influencers) : pick(circles[p.circle].members);
      if (other === p.id || seen.has(other)) continue;
      seen.add(other);
      follows.push({ a: p.id, b: other, since: iso(between(Math.max(p.joined, byId[other].joined), NOW - DAY)) });
    }
  }
  return { people, edges, follows };
}

async function writeBatches(label, rows, query) {
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.executeQuery(query, { rows: rows.slice(i, i + BATCH) });
    process.stdout.write(`\r  ${label}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log();
}

async function grow() {
  const [already] = await db.executeQuery("MATCH (u:User {generated: true}) RETURN count(u) AS n");
  if (already.get("n").toNumber() > 0) {
    console.error("❌ The network has already been grown. Run `npm run grow -- --remove` first to regrow it.");
    return;
  }
  console.log(`Growing to ${TARGET_USERS} users (${CIRCLES} circles, ${INFLUENCERS} influencers, ${NEW_SIGNUPS} brand-new signups)...`);
  const existing = await loadExisting();
  const { people, edges, follows } = buildNetwork(existing);
  const fresh = people.filter((p) => p.generated);

  await writeBatches("users", fresh.map((p) => ({
    id: p.id, name: p.name, username: p.username, email: p.email, bio: p.bio,
    joined: iso(p.joined), lastActive: iso(p.lastActive),
  })), `UNWIND $rows AS row
        CREATE (:User {user_id: row.id, userId: row.id, name: row.name, username: row.username,
                       email: row.email, bio: row.bio, joinedAt: datetime(row.joined),
                       lastActiveAt: datetime(row.lastActive), isActive: true, generated: true})`);

  await writeBatches("interests", fresh.flatMap((p) => p.interests.map((i) => ({ u: p.id, name: i.name, weight: i.weight }))),
    `UNWIND $rows AS row
     MATCH (u:User {userId: row.u}), (i:Interest {name: row.name})
     CREATE (u)-[:INTERESTED_IN {weight: row.weight, generated: true}]->(i)`);

  await writeBatches("group memberships", fresh.flatMap((p) => p.groups.map((g) => ({
    u: p.id, g, role: rand() < 0.05 ? "admin" : "member", joined: iso(between(p.joined, NOW)),
  }))), `UNWIND $rows AS row
         MATCH (u:User {userId: row.u}), (g:Group {groupId: row.g})
         CREATE (u)-[:MEMBER_OF {role: row.role, joinedAt: datetime(row.joined), generated: true}]->(g)`);

  await writeBatches("friendships", edges,
    `UNWIND $rows AS row
     MATCH (a:User {userId: row.a}), (b:User {userId: row.b})
     CREATE (a)-[:FRIENDS_WITH {strength: row.strength, since: datetime(row.since),
                                lastInteraction: datetime(row.last), interactions: row.interactions,
                                generated: true}]->(b)`);

  await writeBatches("follows", follows,
    `UNWIND $rows AS row
     MATCH (a:User {userId: row.a}), (b:User {userId: row.b})
     MERGE (a)-[f:FOLLOWS]->(b)
     ON CREATE SET f.since = datetime(row.since), f.generated = true`);

  await refreshActivity();
  console.log(`\n✅ Network grown: ${people.length} users, ${edges.length} new friendships, ${follows.length} follows.`);
}

(REMOVE ? remove() : grow())
  .catch((error) => console.error("\n❌ Error growing network:", error))
  .finally(() => db.close());
