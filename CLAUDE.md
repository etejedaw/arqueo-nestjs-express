# Arqueo

App de finanzas personales (NestJS + TypeORM + PostgreSQL) que reemplaza una planilla Excel de control mensual. Proyecto privado en su uso, AGPLv3, desarrollo iterativo.

## Fuente de verdad

Los documentos del proyecto viven en AFFiNE, workspace `b48542ca-7422-4505-a933-3640ba923c2d`:

| Doc     | docId                   | Qué contiene                                           |
| ------- | ----------------------- | ------------------------------------------------------ |
| CONTEXT | `Xu9AhNbcnQM5exzJqi-_p` | Modelo de dominio, decisiones, arquitectura, supuestos |
| TODO    | `AeJlURWlaP-Qg4pg9CSM5` | Plan por fases (0–10) con el estado real de cada ítem  |

Léelos con `mcp__affine__export_doc_markdown` antes de empezar una fase nueva, al diseñar entidades, o cuando la tarea toque decisiones de producto. Para un fix puntual basta con las decisiones de más abajo.

**Si cambia una decisión de producto o arquitectura, actualiza el doc en AFFiNE** — con `mcp__affine__update_block` sobre el bloque puntual, no reescribiendo el documento.

Al completar ítems del TODO, márcalos ahí (`update_block` con `checked`).

## Migraciones

Configuración que usa `typeorm-migration`:

- Pedir confirmación antes de cambiar una entidad o el esquema.
- DataSource del CLI: `src/database/data-source.ts`. Carpeta de migraciones: `src/database/migrations/`.
- Comandos: `npm run migration:generate -- src/database/migrations/<Nombre>` y `npm run migration:create -- src/database/migrations/<Nombre>`.
- Cada migración se registra en el arreglo de `src/database/migrations/index.ts`, importada sin extensión. Si no está ahí, la API no la corre.
- `synchronize` está siempre en `false`: las migraciones son la única vía de cambiar el esquema.
- `SnakeNamingStrategy`: tablas en plural y columnas en snake_case, sin comillas en el SQL. Constraints con prefijo `pk_`, `uq_`, `fk_` e `idx_` (por ejemplo `uq_users_email`).
- Estilo de las migraciones existentes: tabs, comillas dobles, `name = "<Clase>"` en la clase y cada sentencia en su propio template literal.
- Fechas `timestamptz` con default `now()`. UUID como `uuid DEFAULT gen_random_uuid()`. Montos en CLP: enteros sin decimales, `bigint`.
- No correr `npm run migration:run`: avisar que la migración está lista y dejar que el usuario la aplique. La API aplica las pendientes al arrancar (`migrationsRun: true`).
