# Arqueo

App de finanzas personales que reemplaza una planilla Excel de control mensual: ingresos, egresos por categoría, cuotas `(n/total)`, gastos compartidos, envío de correos y resumen del mes.

> En desarrollo, todavía sin release.

## Stack

- NestJS 11 + TypeORM + PostgreSQL
- Rutas versionadas bajo `/api/v1`

## Desarrollo local

Requisitos: Node (versión en `.nvmrc`) y Docker.

```bash
nvm use
docker compose up -d
cp .env.example .env
npm install
npm run start:dev
```

Si una variable no está definida, se usa su valor por defecto de desarrollo, que coincide con `docker-compose.yml`. Una variable definida pero vacía (`DB_HOST=`) no toma el valor por
defecto y hace fallar la validación al arrancar.

## Auth

`POST /api/v1/auth/login` valida email y contraseña y devuelve un access token JWT, y nada más: el perfil se pide aparte a `GET /api/v1/auth/me`. El token se firma con `JWT_ACCESS_SECRET` y dura lo que diga `JWT_ACCESS_EXPIRES_IN` (por defecto un día, admite `900`, `15m`, `2h`).

En producción hay que definir el secreto: el valor por defecto es de desarrollo y está en el repo, así que una instancia que no lo cambie acepta tokens firmados por cualquiera.

Los endpoints protegidos llevan `@Auth()` y esperan el token en el header `Authorization: Bearer <token>`; `GET /api/v1/auth/me` devuelve el perfil del usuario del token. Todavía no hay refresh token.

## Migraciones

La API corre las migraciones pendientes al arrancar (`migrationsRun: true`), así que una imagen nueva actualiza el esquema sola. Cada migración generada:

1. Se revisa a mano antes de commitear: un renombre de columna sale como `DROP` + `ADD` y pierde datos.
2. Se agrega al arreglo de `src/database/migrations/index.ts`. Si no está ahí, la API no la corre.

## Docker

```bash
docker build -t arqueo .
docker run -p 3000:3000 --env-file .env arqueo
```

La imagen necesita un PostgreSQL accesible con las variables `DB_*`.

## Licencia

[AGPL-3.0](LICENSE)
