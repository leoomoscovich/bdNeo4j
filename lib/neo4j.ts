import neo4j, { type Driver, type QueryResult, type RecordShape } from "neo4j-driver";

let driver: Driver | null = null;

const localDefaults: Record<string, string> = {
  NEO4J_URI: "bolt://localhost:7687",
  NEO4J_USERNAME: "neo4j",
  NEO4J_PASSWORD: "password",
};

function getEnv(name: string) {
  const value = process.env[name];

  return value || localDefaults[name];
}

export function getDriver() {
  if (driver) {
    return driver;
  }

  const uri = getEnv("NEO4J_URI");
  const username = getEnv("NEO4J_USERNAME");
  const password = getEnv("NEO4J_PASSWORD");

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  return driver;
}

export async function runQuery<T extends RecordShape = RecordShape>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<QueryResult<T>> {
  const session = getDriver().session();

  try {
    return await session.run<T>(query, params);
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  if (!driver) {
    return;
  }

  await driver.close();
  driver = null;
}
