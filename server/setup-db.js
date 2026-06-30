import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

// Applies server/schema.sql to the configured database. Idempotent (uses
// "create ... if not exists"), so it is safe to re-run. Invoke with `npm run db:setup`.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL is not set. Copy .env.example to .env and add your Supabase/Neon URL.");
    process.exit(1);
  }
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  console.log("Applying schema…");
  await pool.query(sql);
  console.log("✓ Schema applied successfully.");
  await pool.end();
}

main().catch((err) => {
  console.error("✗ Failed to apply schema:", err.message);
  process.exit(1);
});
