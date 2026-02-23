/**
 * Next.js instrumentation hook: se ejecuta UNA VEZ al arrancar el servidor.
 * Aplica migraciones pendientes de forma segura (idempotentes).
 */
export async function register() {
  // Solo en el runtime de Node (no en Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: postgres } = await import("postgres");
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.warn("[instrumentation] DATABASE_URL no definido, se omiten migraciones.");
      return;
    }
    const sql = postgres(url, { max: 1 });
    try {
      // Migración 0101: columna category en foods
      await sql`ALTER TABLE foods ADD COLUMN IF NOT EXISTS category varchar(64)`;
      console.log("[instrumentation] Migraciones aplicadas.");
    } catch (e) {
      console.error("[instrumentation] Error aplicando migraciones:", e);
    } finally {
      await sql.end();
    }
  }
}
