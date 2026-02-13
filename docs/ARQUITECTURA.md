# NutriApp — Arquitectura y decisiones

## Base de datos (Postgres)

- **Esquema:** Definido en `src/db/schema.ts` (Drizzle ORM). Migración SQL inicial en `drizzle/0000_initial.sql`.
- **Creación de tablas:** Ejecutar una vez `npm run db:run-migrations` (o el SQL a mano). La app no crea tablas automáticamente al arrancar.
- **Tablas principales:**
  - `users` — email, password hash, rol (user | superadmin), email verificado
  - `verification_tokens` — tokens para verificación de email y “establecer contraseña”
  - `profiles` — por usuario: nombre, sexo, fecha nacimiento, altura, metas (calorías, proteína, grasas, hidratos), peso/fecha objetivo
  - `foods` — alimentos por usuario; macros por 100 g; `unit_type`: grams | units
  - `activities` — actividades por usuario; `met` para gasto = MET × peso × (min/60)
  - `days` — (user_id, date) PK; `closed_at` para día cerrado
  - `food_logs`, `activity_logs`, `weight_logs` — registros por día

## Autenticación

- **NextAuth** con proveedor Credentials (email + contraseña).
- **Superadmin:** Definido por `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`. No requiere verificación de email. Si no existe en BD, se crea en el primer login.
- **Usuarios normales:** Registro con email; se envía enlace de verificación; solo pueden iniciar sesión tras verificar. Usuarios creados por el superadmin reciben email “Establecer contraseña” (`/set-password?token=...`); al guardar la contraseña se marca email como verificado.

## Emails

- **Resend** si existe `RESEND_API_KEY`. Sin ella, los enlaces se loguean en consola (solo desarrollo).
- Flujos: verificación tras registro (`/api/auth/verify-email`), establecimiento de contraseña para usuarios creados por admin (`/set-password` + `POST /api/auth/set-password`).

## Alimentos

- Macros **por 100 g** (o por 1 unidad si `unit_type = 'units'`).
- Selector de cantidad: **gramos** con pasos +/- 5, 10, 100; **unidades** con +/- 1.
- Importación CSV: columnas nombre, kcal, protein, grasas, hidratos, tipo (grams/units).

## Actividades

- **MET:** Gasto (kcal) = MET × peso (kg) × (duración en minutos / 60).
- Opción de **calorías manuales** (p. ej. del reloj) con checkbox **Wahoo** para aplicar × 0.8 (−20%).

## Vista por día

- Selector de fecha; vista “Hoy” o día pasado.
- Días **cerrados** con tono distinto y botón **Editar** para desbloquear.
- Macros con opción de mostrar/ocultar números; balance = ingerido − actividad.

## Despliegue

- **Docker:** `Dockerfile` con build Next.js y `output: 'standalone'`. Un solo contenedor sirve la app.
- **Dokploy:** Build desde GitHub (Dockerfile) o despliegue desde imagen en Docker Hub. Variables de entorno documentadas en `README.md` y `docs/DESPLIEGUE.md`.
