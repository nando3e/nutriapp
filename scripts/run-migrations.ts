/**
 * Run SQL migrations from drizzle/*.sql using DATABASE_URL.
 * Usage: npx tsx scripts/run-migrations.ts
 * Or: node --loader ts-node/esm scripts/run-migrations.ts
 */
import postgres from "postgres";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(connectionString);
const migrationsDir = join(process.cwd(), "drizzle");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

async function run() {
  for (const file of files) {
    const path = join(migrationsDir, file);
    const content = readFileSync(path, "utf-8");
    console.log("Running", file);
    await sql.unsafe(content);
  }
  console.log("Migrations done.");
  await sql.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
