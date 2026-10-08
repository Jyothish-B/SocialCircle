import { db } from "../../lib/db.js";
import { runCypherFile } from "./cypher_loader.js";

// Usage:  npm run seed            -> schema + demo network (empty database only)
//         npm run seed -- --force -> wipe a non-empty database first
//         npm run seed -- --gds   -> also run Louvain / FastRP / kNN (needs GDS plugin)
const withGds = process.argv.includes("--gds");

async function seed() {
  try {
    const [existing] = await db.executeQuery("MATCH (n) RETURN count(n) AS n");
    const nodeCount = existing.get("n").toNumber();
    if (nodeCount > 0 && !process.argv.includes("--force")) {
      console.error(
        `❌ The database already has ${nodeCount} nodes and seeding deletes ALL of them.\n` +
          `   To keep your CSV data, use "npm run adapt" instead.\n` +
          `   To wipe it and load the demo network anyway: npm run seed -- --force`
      );
      return;
    }

    console.log("Clearing existing data...");
    await db.executeQuery("MATCH (n) DETACH DELETE n");

    console.log("Creating constraints & indexes...");
    await runCypherFile(db, "01_schema.cypher");

    console.log("Loading demo network...");
    await runCypherFile(db, "02_seed.cypher");

    if (withGds) {
      console.log("Running GDS pipeline (Louvain, FastRP, kNN)...");
      await runCypherFile(db, "05_gds.cypher");
    }

    console.log("\n✅ Database seeded successfully!");
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
  } finally {
    await db.close();
  }
}

seed();
