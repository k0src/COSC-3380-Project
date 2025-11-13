import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";
import path from "path";

// Load env from server/.env, then fallback to project root .env if needed
const loaded = dotenv.config();
if (loaded.error) {
  const fallbackPath = path.resolve(process.cwd(), "../.env");
  dotenv.config({ path: fallbackPath });
}

function clean(value?: string): string | undefined {
  if (value == null) return value;
  const trimmed = value.trim();
  const m = trimmed.match(/^(['"])(.*)\1$/);
  return m ? m[2] : trimmed;
}

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPOOLSIZE,
  PGSSLMODE,
  NODE_ENV,
} = process.env;

// Provide development fallbacks to avoid hard-crashing local server
const isProduction = clean(NODE_ENV) === "production";
const host = clean(PGHOST) || (isProduction ? undefined : "localhost");
const port = clean(PGPORT) ? parseInt(clean(PGPORT) as string, 10) : 5432;
const user = clean(PGUSER) || (isProduction ? undefined : "postgres");
const password = clean(PGPASSWORD) || (isProduction ? undefined : "postgres");
const database = clean(PGDATABASE) || (isProduction ? undefined : "postgres");

if (isProduction && (!host || !user || !password || !database)) {
  throw new Error("Missing required Postgres environment variables.");
}

// SSL handling: disable locally by default unless explicitly requested
const sslSetting =
  isProduction || (clean(PGSSLMODE) && clean(PGSSLMODE)!.toLowerCase() !== "disable")
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  max: clean(PGPOOLSIZE) ? parseInt(clean(PGPOOLSIZE) as string, 10) : undefined,
  ssl: sslSetting as any,
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
