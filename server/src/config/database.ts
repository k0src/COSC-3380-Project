import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";

dotenv.config();

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPOOLSIZE,
  PGSSLMODE,
} = process.env;

console.log("Database config:", {
  PGHOST,
  PGDATABASE,
  PGUSER,
  PGPORT,
});

if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
  throw new Error("Missing required Postgres environment variables.");
}

// ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false }, not working idek fix later
const pool = new Pool({
  host: PGHOST,
  port: PGPORT ? parseInt(PGPORT, 10) : 5432,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  max: PGPOOLSIZE ? parseInt(PGPOOLSIZE, 10) : undefined,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function testConnection() {
  try {
    console.log("Testing database connection...");
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    console.log("Database connection successful.");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}

export { pool };