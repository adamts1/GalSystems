import "dotenv/config";
import readline from "readline";
import { pool } from "./db.js";

// Deletes ALL rows from every campaign table. The data is gone for good — there
// is no undo. TRUNCATE ... CASCADE empties the parent and every table that
// references it, and RESTART IDENTITY resets any sequences.
//
// Run with:  npm run db:wipe          (asks for confirmation)
//            npm run db:wipe -- --yes  (skips the prompt, e.g. in scripts)

const TABLES = ["campaigns", "campaign_customers", "campaign_debts", "campaign_messages"];

async function confirm() {
  if (process.argv.includes("--yes") || process.argv.includes("-y")) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) =>
    rl.question(`This will permanently delete ALL data from: ${TABLES.join(", ")}.\nType "yes" to continue: `, resolve)
  );
  rl.close();
  return answer.trim().toLowerCase() === "yes";
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL is not set. Copy .env.example to .env and add your Supabase/Neon URL.");
    process.exit(1);
  }

  if (!(await confirm())) {
    console.log("Aborted. Nothing was deleted.");
    await pool.end();
    return;
  }

  console.log("Wiping all tables…");
  // CASCADE handles the foreign-key order for us; one statement empties everything.
  await pool.query(`truncate table ${TABLES.join(", ")} restart identity cascade`);
  console.log("✓ All data deleted.");
  await pool.end();
}

main().catch((err) => {
  console.error("✗ Failed to wipe database:", err.message);
  process.exit(1);
});
