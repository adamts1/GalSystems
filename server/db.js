import "dotenv/config";
import pg from "pg";

// Single shared connection pool for the whole server.
// Cloud Postgres (Supabase/Neon) requires SSL; rejectUnauthorized:false accepts
// their managed certificates without bundling a CA file.
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("⚠  DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Convenience wrapper for one-off queries.
export const query = (text, params) => pool.query(text, params);

// Run fn inside a transaction, passing it a dedicated client. Commits on success,
// rolls back on any error, and always releases the client back to the pool.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
