/**
 * Añade la columna category a la tabla foods (migración 0101).
 * Uso: npx tsx scripts/add-foods-category.ts
 * Requiere DATABASE_URL en .env
 */
import postgres from "postgres";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf-8").replace(/\r\n/g, "\n").replace(/^\uFEFF/, "");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key) process.env[key] = value;
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL no está definido. Carga el .env o exporta DATABASE_URL.");
  process.exit(1);
}

const sql = postgres(connectionString);
const migrationPath = join(process.cwd(), "drizzle", "0101_add_foods_category.sql");

async function run() {
  const content = readFileSync(migrationPath, "utf-8");
  console.log("Ejecutando 0101_add_foods_category.sql ...");
  await sql.unsafe(content);
  console.log("Columna 'category' añadida a foods.");
  await sql.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
