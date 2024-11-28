import neo4j from "neo4j-driver";
import "dotenv/config";

class Neo4jDB {
  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
    );
  }

  async executeQuery(query, params = {}) {
    const session = this.driver.session({
      database: process.env.NEO4J_DATABASE,
    });
    try {
      const result = await session.run(query, params);
      return result.records;
    } catch (error) {
      throw error;
    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }
}

export const db = new Neo4jDB();
export default Neo4jDB;
