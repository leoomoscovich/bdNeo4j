import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "password"
  )
);

async function seedDatabase() {
  const session = driver.session();

  try {
    console.log("🌱 Seeding Neo4j database...");

    // Create Skin nodes
    await session.run(
      `CREATE (s:Skin {
        id: 'ak47-bloodsport',
        name: 'AK-47 Bloodsport',
        rarity: 'Covert',
        pattern: 'Bloodsport',
        float: 0.05,
        price: 2150
      })`
    );

    console.log("✅ Database seeding complete!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();
