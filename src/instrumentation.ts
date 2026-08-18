/**
 * Next.js instrumentation hook: se ejecuta UNA VEZ al arrancar el servidor.
 *
 * Aplica las migraciones de drizzle/*.sql que aun no esten registradas en la
 * tabla de control _migrations. Sin esto, un despliegue contra una base de
 * datos vacia arranca sin esquema: la tabla users no existe, authorize()
 * falla y el login es imposible.
 *
 * IMPORTANTE: todo el cuerpo va dentro del if de NEXT_RUNTIME. Next compila
 * este fichero tambien para el runtime Edge, donde no existen net/tls/fs; al
 * sustituir NEXT_RUNTIME por una constante, webpack elimina el bloque entero
 * en ese bundle. Con un early return los imports quedan fuera del if y el
 * build falla con "Module not found: Can't resolve 'net'".
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error("[migraciones] DATABASE_URL no definido. La app no puede arrancar.");
      throw new Error("DATABASE_URL es obligatorio");
    }

    const { default: postgres } = await import("postgres");
    const { readFileSync, readdirSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");

    const dir = join(process.cwd(), "drizzle");
    if (!existsSync(dir)) {
      console.error(`[migraciones] No existe el directorio ${dir}. Revisa el COPY del Dockerfile.`);
      throw new Error("Directorio de migraciones no encontrado");
    }

    const sql = postgres(url, { max: 1 });
    try {
      // Lock para que dos instancias no migren a la vez
      await sql`SELECT pg_advisory_lock(727364)`;

      await sql`
        CREATE TABLE IF NOT EXISTS _migrations (
          name text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      const applied = new Set(
        (await sql<{ name: string }[]>`SELECT name FROM _migrations`).map((r) => r.name)
      );
      const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
      const pending = files.filter((f) => !applied.has(f));

      if (pending.length === 0) {
        console.log(`[migraciones] Sin cambios (${files.length} ya aplicadas).`);
        return;
      }

      for (const file of pending) {
        const contenido = readFileSync(join(dir, file), "utf-8");
        console.log(`[migraciones] Aplicando ${file}...`);
        await sql.begin(async (tx) => {
          await tx.unsafe(contenido);
          await tx.unsafe("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        });
      }
      console.log(`[migraciones] ${pending.length} aplicadas correctamente.`);
    } catch (e) {
      console.error("[migraciones] Error aplicando migraciones:", e);
      throw e;
    } finally {
      try {
        await sql`SELECT pg_advisory_unlock(727364)`;
      } catch {}
      await sql.end();
    }
  }
}
