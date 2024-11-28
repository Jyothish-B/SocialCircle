import { faker } from "@faker-js/faker";
import { db } from "../../lib/db.js";

// Configuration constants
const SEED_COUNTS = {
  USERS: 20,
  COMPANIES: 5,
  PLACES: 8,
  GROUPS: 3,
  // Relationship probabilities (0-1)
  FRIENDSHIP_PROBABILITY: 0.2,
  GROUP_MEMBERSHIP_PROBABILITY: 0.2,
};

async function seed() {
  try {
    console.log("Starting database seeding...");
    console.log("Clearing existing data...");
    await db.executeQuery("MATCH (n) DETACH DELETE n");

    // Create users
    console.log("Creating users...");
    for (let i = 0; i < SEED_COUNTS.USERS; i++) {
      await db.executeQuery(
        "CREATE (u:User {username: $username, created_at: datetime()}) RETURN u",
        { username: faker.internet.userName() }
      );
      if ((i + 1) % 10 === 0)
        console.log(`Created ${i + 1}/${SEED_COUNTS.USERS} users`);
    }

    // Create companies
    console.log("\nCreating companies...");
    for (let i = 0; i < SEED_COUNTS.COMPANIES; i++) {
      await db.executeQuery(
        "CREATE (c:Company {name: $name, description: $description, created_at: datetime()}) RETURN c",
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
        }
      );
      if ((i + 1) % 2 === 0)
        console.log(`Created ${i + 1}/${SEED_COUNTS.COMPANIES} companies`);
    }

    // Create places
    console.log("\nCreating places...");
    for (let i = 0; i < SEED_COUNTS.PLACES; i++) {
      await db.executeQuery(
        "CREATE (p:Place {name: $name, description: $description, created_at: datetime()}) RETURN p",
        {
          name: faker.location.city(),
          description: faker.location.county(),
        }
      );
      if ((i + 1) % 5 === 0)
        console.log(`Created ${i + 1}/${SEED_COUNTS.PLACES} places`);
    }

    // Create groups
    console.log("\nCreating groups...");
    for (let i = 0; i < SEED_COUNTS.GROUPS; i++) {
      await db.executeQuery(
        "CREATE (g:Group {name: $name, description: $description, created_at: datetime()}) RETURN g",
        {
          name: faker.word.noun(),
          description: faker.lorem.sentence(),
        }
      );
      console.log(`Created ${i + 1}/${SEED_COUNTS.GROUPS} groups`);
    }

    // Create relationships
    console.log("\nCreating friend relationships...");
    await db.executeQuery(`
            MATCH (u1:User)
            MATCH (u2:User)
            WHERE u1 <> u2
            WITH u1, u2, rand() as r
            WHERE r < ${SEED_COUNTS.FRIENDSHIP_PROBABILITY}
            CREATE (u1)-[:FRIENDS_WITH {created_at: datetime()}]->(u2)
        `);
    console.log("Friend relationships created");

    console.log("\nAssigning workplaces...");
    await db.executeQuery(`
            MATCH (u:User), (c:Company)
            WITH u, c, rand() as r
            ORDER BY r
            WITH u, collect(c)[0] as company
            CREATE (u)-[:WORKS_AT {created_at: datetime()}]->(company)
        `);
    console.log("Work relationships created");

    console.log("\nAssigning living places...");
    await db.executeQuery(`
            MATCH (u:User), (p:Place)
            WITH u, p, rand() as r
            ORDER BY r
            WITH u, collect(p)[0] as place
            CREATE (u)-[:LIVES_IN {created_at: datetime()}]->(place)
        `);
    console.log("Living place relationships created");

    console.log("\nCreating group memberships...");
    await db.executeQuery(`
            MATCH (u:User), (g:Group)
            WHERE rand() < ${SEED_COUNTS.GROUP_MEMBERSHIP_PROBABILITY}
            CREATE (u)-[:MEMBER_OF {created_at: datetime()}]->(g)
        `);
    console.log("Group memberships created");

    console.log("\n✅ Database seeded successfully!");
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
  } finally {
    await db.close();
  }
}

seed();
