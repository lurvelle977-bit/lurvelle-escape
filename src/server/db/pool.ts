import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { env } from "../env";

// One shared pool per server process. Cached on globalThis so dev hot-reloads do not leak connections.
const globalForPool = globalThis as unknown as { __pgPool?: Pool };

function getPool(): Pool {
  if (!globalForPool.__pgPool) {
    globalForPool.__pgPool = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? true : undefined,
      max: 10,
    });
    globalForPool.__pgPool.on("error", (error) => console.error("[db] idle client error", error));
  }
  return globalForPool.__pgPool;
}

// Anything that can run a parameterized query: the pool itself or a transaction client
export type Queryable = {
  query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
};

export const db: Queryable = {
  query: (text, values) => getPool().query(text, values),
};

// Runs fn inside a transaction; commits on success and rolls back on any throw
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
