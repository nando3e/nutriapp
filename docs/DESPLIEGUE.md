# Despliegue NutriApp (Dokploy)

## Resumen

- La app se **dockeriza** con el `Dockerfile` en la raíz.
- En **Dokploy** puedes desplegar de dos formas:
  1. **Desde GitHub:** Dokploy hace build con el Dockerfile y despliega.
  2. **Desde Docker Hub:** Tú subes la imagen; Dokploy solo la ejecuta.

No hace falta elegir ambas: una es suficiente.

## Qué necesitas en Dokploy

1. **Una base Postgres** accesible desde el contenedor (misma red o IP en allowlist).
2. **Variables de entorno** configuradas en el servicio (ver abajo).
3. **Migraciones ejecutadas** una vez sobre esa base (ver abajo).

## Variables de entorno en Dokploy

Añádelas en la ficha de tu aplicación (Variables / Environment):

| Variable | Ejemplo | Notas |
|----------|---------|--------|
| `DATABASE_URL` | `postgresql://user:pass@host:5400/NutriApp` | URL de tu Postgres |
| `NEXTAUTH_URL` | `https://nutriapp.tudominio.com` | URL pública de la app |
| `NEXTAUTH_SECRET` | `una-cadena-larga-aleatoria` | Generar con `openssl rand -base64 32` |
| `SUPERADMIN_EMAIL` | `admin@tudominio.com` | Login superadmin |
| `SUPERADMIN_PASSWORD` | `***` | Contraseña superadmin |
| `RESEND_API_KEY` | `re_xxxx` | Para enviar emails |
| `EMAIL_FROM` | `NutriApp <noreply@tudominio.com>` | Remitente (dominio verificado en Resend) |

## Migraciones de base de datos

Las tablas se crean con el SQL en `drizzle/0000_initial.sql`. Opciones:

1. **Desde tu PC** (recomendado la primera vez):  
   - Pon en `.env` local un `DATABASE_URL` que apunte a la misma base que usará producción.  
   - Ejecuta: `npm run db:run-migrations`.

2. **Desde un cliente SQL:**  
   - Conéctate a la base y ejecuta el contenido de `drizzle/0000_initial.sql`.

Solo hay que hacerlo **una vez** por base de datos (o al añadir nuevas migraciones).

## Opción 1: Deploy desde GitHub (recomendado)

1. Sube el código a un repo en GitHub.
2. En Dokploy: **Nueva aplicación** → Conectar repositorio (GitHub).
3. Selecciona el repo y la rama (ej. `main`).
4. **Build:**
   - Tipo: **Dockerfile**.
   - Dockerfile path: `Dockerfile` (raíz del repo).
5. **Variables:** Añade todas las de la tabla anterior.
6. **Puerto:** 3000 (si Dokploy lo pide).
7. Guarda y **Despliega**. Dokploy hará `docker build` y `docker run`.

Cada push a la rama configurada puede volver a construir y desplegar si tienes auto-deploy activado.

## Opción 2: Deploy desde Docker Hub

1. En tu máquina o CI:
   ```bash
   docker build -t tuusuario/nutriapp:latest .
   docker push tuusuario/nutriapp:latest
   ```
2. En Dokploy: **Nueva aplicación** → **Deploy from Docker Image**.
3. Imagen: `tuusuario/nutriapp:latest`.
4. Añade las mismas variables de entorno.
5. Puerto 3000.
6. Despliega.

## Comprobar que funciona

1. Abre `NEXTAUTH_URL` en el navegador.
2. Inicia sesión con `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`.
3. Deberías entrar al dashboard. Si no, revisa logs del contenedor y que `DATABASE_URL` y `NEXTAUTH_URL` sean correctos.

## Emails en producción

- Para verificación de nuevos registros y para el enlace “Establecer contraseña” de usuarios creados por el admin, la app usa **Resend** si está definido `RESEND_API_KEY`.
- Configura en Resend un dominio y usa ese dominio en `EMAIL_FROM`.
- Sin `RESEND_API_KEY`, los enlaces solo se loguean en el servidor (no se envían correos).
