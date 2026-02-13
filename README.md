# NutriApp

App web de tracking nutricional y entrenamiento: alimentos por 100 g, actividades por MET, peso/cintura, macros y balance. Login por email con verificación; superadmin por variables de entorno; múltiples usuarios.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **Postgres** (Drizzle ORM)
- **NextAuth** (credenciales + JWT)
- **Resend** o SMTP para emails (verificación y usuarios creados por admin)

## Requisitos

- Node 20+
- Postgres 14+
- Cuenta Resend (o SMTP) para envío de emails

## Instalación local

1. Clonar y instalar dependencias:

```bash
cd nutriapp
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env
```

3. Rellenar `.env` (ver [Variables de entorno](#variables-de-entorno)).

4. Crear tablas en Postgres (migración inicial):

```bash
npm run db:run-migrations
```

(O bien ejecutar manualmente el SQL en `drizzle/0000_initial.sql` con un cliente que tenga permisos DDL.)

5. Arrancar en desarrollo:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El primer login con `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` crea el usuario superadmin.

## Variables de entorno

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | Sí | URL de conexión Postgres (ej. `postgresql://user:pass@host:5400/NutriApp`) |
| `NEXTAUTH_URL` | Sí (prod) | URL pública de la app (ej. `https://nutriapp.tudominio.com`) |
| `NEXTAUTH_SECRET` | Sí (prod) | Secreto para firmar sesiones (generar uno aleatorio) |
| `SUPERADMIN_EMAIL` | Sí | Email del superadmin |
| `SUPERADMIN_PASSWORD` | Sí | Contraseña del superadmin (no requiere verificación) |
| `RESEND_API_KEY` | Para emails | API key de Resend para verificación e invitaciones |
| `EMAIL_FROM` | Opcional | Remitente (ej. `NutriApp <noreply@tudominio.com>`) |

Sin `RESEND_API_KEY`, los enlaces de verificación se imprimen en la consola del servidor (solo desarrollo).

## Despliegue con Dokploy

### Opción A: Build desde GitHub

1. Sube el repositorio a GitHub.
2. En Dokploy, crea una nueva aplicación y conecta el repo.
3. Tipo de build: **Dockerfile** (ruta: raíz del repo, `Dockerfile`).
4. Añade las variables de entorno en la configuración del servicio (las mismas que en [Variables de entorno](#variables-de-entorno)).
5. **Importante:** `NEXTAUTH_URL` debe ser la URL pública que use Dokploy (ej. `https://nutriapp.xxx.com`).
6. Despliega. El primer despliegue construye la imagen y arranca el contenedor.

### Opción B: Imagen en Docker Hub

1. En tu máquina (o CI), construye y sube la imagen:

```bash
docker build -t tuusuario/nutriapp:latest .
docker push tuusuario/nutriapp:latest
```

2. En Dokploy, crea una aplicación desde **Docker Image**: `tuusuario/nutriapp:latest`.
3. Configura las variables de entorno y el puerto 3000.
4. Despliega.

### Base de datos

- La app espera que Postgres esté accesible desde el contenedor (misma red o IP permitida).
- Antes del primer arranque, ejecuta las migraciones contra esa base:
  - Desde tu PC (con `DATABASE_URL` apuntando a la BD de producción): `npm run db:run-migrations`
  - O ejecutando el contenido de `drizzle/0000_initial.sql` con un cliente SQL.

### Resend en producción

- Crea un dominio verificado en Resend y usa `EMAIL_FROM` con ese dominio.
- Sin `RESEND_API_KEY` en producción, los usuarios no recibirán emails de verificación ni de “establecer contraseña”.

## Scripts

- `npm run dev` — Desarrollo
- `npm run build` — Build de producción
- `npm run start` — Arrancar en producción (tras `build`)
- `npm run db:run-migrations` — Aplicar migraciones SQL en `drizzle/`
- `npm run db:push` — Sincronizar esquema Drizzle con la BD (desarrollo)
- `npm run db:studio` — Abrir Drizzle Studio (requiere `DATABASE_URL`)

## Estructura de la app

- **Auth:** Login por email + contraseña; registro con verificación por email; superadmin definido por env; superadmin puede crear usuarios (ellos reciben email para establecer contraseña).
- **Dashboard:** Vista por día (selector de fecha), macros (calorías, proteína, grasas, hidratos) con opción de mostrar/ocultar números, balance ingerido − actividad, lista de comidas y actividades, peso/cintura (inicio/fin de día), cerrar/reabrir día y editar día cerrado.
- **Alimentos:** Por usuario; macros por 100 g; unidad en gramos o unidades; CRUD e importación CSV (columnas: nombre, kcal, protein, grasas, hidratos, tipo).
- **Actividades:** Por usuario; MET; gasto = MET × peso × (minutos/60); opción de calorías manuales con corrección Wahoo −20%.
- **Perfil:** Metas (calorías, proteína, grasas, hidratos), datos para TMB (sexo, fecha nacimiento, altura), peso y fecha objetivo.

## Documentación adicional

- Esquema de BD: `src/db/schema.ts` y `drizzle/0000_initial.sql`.
- Variables de entorno: `.env.example`.
