import { Pool } from "pg";
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

if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
  throw new Error("Missing required Postgres environment variables.");
}

const pool = new Pool({
  host: PGHOST,
  port: PGPORT ? parseInt(PGPORT, 10) : 5432,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  max: PGPOOLSIZE ? parseInt(PGPOOLSIZE, 10) : undefined,
});

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
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
