---
name: db-migration
description: Create a TypeORM migration whenever a *.entity.ts file is created or modified in a way that changes the DB schema (new entity, new/removed/renamed column, type change, default change, nullability, unique/index, FK, enum value). Skip if the change is purely TypeScript-side (typings, getters, computed props without DDL impact). Uses the TypeORM CLI (migration:generate / migration:create) + raw SQL on PostgreSQL.
---

# DB Migration

Cada vez que se **crea o modifica** un `*.entity.ts` y el cambio impacta el esquema de la base, hay que generar una migración de TypeORM. Esto incluye también ediciones a `*.enum.ts` u otros types usados como columnas `enum` de una entidad.

> **Antes de tocar una entidad, recordá pedir confirmación al usuario.** La skill se aplica una vez ya hay luz verde para cambiar el esquema.
>
> En este proyecto `synchronize` está **siempre en `false`** fuera de dev: las migraciones son la única vía de cambiar el esquema (ver `CONTEXT.md`).

## Cuándo aplicar

| Cambio en `*.entity.ts`                                                                | ¿Migración? |
| -------------------------------------------------------------------------------------- | ----------- |
| Entidad nueva (`@Entity()`)                                                            | Sí          |
| Columna nueva / borrada / renombrada (`@Column`)                                       | Sí          |
| Cambio de tipo, longitud, `default`, `nullable`, `unique`, `@PrimaryColumn`            | Sí          |
| Nuevo índice (`@Index`), índice compuesto, relación (`@ManyToOne`/`@OneToMany`) con FK | Sí          |
| Valor agregado/quitado a un `enum` usado en una columna (incluye archivos `*.enum.ts`) | Sí          |
| Rename de la tabla (cambia el `name` del `@Entity`)                                    | Sí          |
| Solo tipado TS, getters/setters/props computadas en memoria, hooks sin DDL             | No          |
| Refactor de imports, mover archivos sin cambiar el shape                               | No          |

Si dudás, generala: una migración sin diff efectivo es barata; un drift entre entidad y DB no.

## Stack

- ORM: **TypeORM 0.3.x** (última versión) + driver `pg`
- Dialecto: **PostgreSQL**
- Config: un `DataSource` (ej: `src/database/data-source.ts`) que expone `migrations` y `entities`
- Carpeta de migraciones: `src/database/migrations/`
- Formato de archivo: **TypeScript**, clase que implementa `MigrationInterface` (`up`/`down`)
- Tabla de control: la default de TypeORM (`migrations`)
- Naming de tablas/columnas: **snake_case** (tablas en plural), como el esquema de `CONTEXT.md`
  (`users`, `debt_entries`, `owner_user_id`, `created_at`, …)

> Si los scripts npm todavía no existen (proyecto recién arrancado), la skill los asume
> y hay que definirlos al montar TypeORM en la fase correspondiente (ver `TODO.md`):
>
> ```jsonc
> // package.json → scripts (typeorm corre vía ts-node con el DataSource)
> "typeorm": "typeorm-ts-node-commonjs -d src/database/data-source.ts",
> "migration:generate": "npm run typeorm -- migration:generate",
> "migration:create": "typeorm-ts-node-commonjs migration:create",
> "migration:run": "npm run typeorm -- migration:run",
> "migration:revert": "npm run typeorm -- migration:revert"
> ```

## Cómo crear la migración

Hay dos caminos. **Preferí `migration:generate`**: TypeORM compara las entidades contra la
base y escribe el DDL por vos.

1. **Generar desde el diff de entidades** (lo habitual tras editar un `*.entity.ts`):

    ```bash
    npm run migration:generate -- src/database/migrations/AddIsSharedToTransactions
    ```

    Produce `src/database/migrations/<timestamp>-AddIsSharedToTransactions.ts` con el `up`/`down` ya poblados.

2. **Crear vacía** (para *data migrations*, backfills o DDL que el generador no infiere bien —
   ej: valores de enum, constraints complejos):

    ```bash
    npm run migration:create -- src/database/migrations/BackfillContactEmails
    ```

3. **Revisar el archivo generado.** El generador a veces produce `DROP`/`ADD` en vez de un
   `RENAME`, o pierde defaults. Ajustá el SQL a mano si hace falta.

4. **No corras `migration:run` automáticamente.** Avisá al usuario que la migración está lista
   y dejá que él la aplique.

## Naming

- **Archivo**: `<timestamp>-<NombreEnPascalCase>.ts` (el timestamp lo pone la CLI).
- **Clase**: `<NombreEnPascalCase><timestamp>` (así lo genera TypeORM; no lo cambies).
- Nombre en verbo + sujeto, PascalCase:
    - `CreateStatementsTable`
    - `AddIsSharedToTransactions`
    - `ChangeAmountToBigintOnDebtEntries`
    - `AddPaidStatusValueToStatementsStatusEnum`

## Granularidad: una migración por unidad lógica, no por columna

Agrupar todos los cambios de DB de **la misma feature** en una sola migración. No fragmentar
por columna ni por sentencia.

**Sí agrupar** cuando: pertenecen a la misma feature/PR; son sobre la misma tabla o tablas
relacionadas que se aplican juntas (columna + su índice + su FK); revertir uno sin los otros
dejaría la app inconsistente.

**No agrupar** cuando: son features distintas deployables por separado; tocan dominios sin
relación (ej: `users` + `webhook_endpoints` no vinculados); una es DDL pesado y la otra trivial.

Naming agrupado: un sujeto que cubra la feature, no una lista.
`AddSharedExpenseFieldsToTransactions` mejor que `AddSharedAndSplitTypeAndSplitValueToTransactions`.

## Template

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStatementsTable1735660000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- DDL forward acá
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Reverso exacto del up
    `);
  }
}
```

## Reglas de DDL (Postgres)

- **snake_case sin comillas**: con naming snake_case los identificadores no necesitan comillas
  dobles (`created_at`, `owner_user_id`). Usá comillas solo si un identificador choca con una
  palabra reservada.
- **Tablas en plural snake_case**, igual que el esquema de `CONTEXT.md`.
- **TypeORM corre cada migración una sola vez** (las registra en la tabla `migrations`), así que
  el DDL **no necesita** ser idempotente como en Sequelize. Aun así, para migraciones escritas a
  mano sobre entornos ya poblados, `IF NOT EXISTS` / `IF EXISTS` es una red de seguridad válida.
- **Montos en CLP**: enteros sin decimales → `bigint` (ver `CONTEXT.md`).
- **UUID como PK**: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` (requiere la extensión
  `pgcrypto`; crearla en la primera migración con `CREATE EXTENSION IF NOT EXISTS pgcrypto;`).
- **Timestamps**: `created_at`/`updated_at` como `TIMESTAMPTZ NOT NULL DEFAULT now()`.
- **FKs**: `REFERENCES otra_tabla(id) ON DELETE CASCADE|SET NULL` según el modelo. Nombrar la
  constraint cuando importe el orden de borrado.
- **Enums**: en Postgres el tipo se crea con `CREATE TYPE`. Para agregar un valor:
  `ALTER TYPE <tipo> ADD VALUE IF NOT EXISTS 'nuevo';` (no se puede quitar un valor sin recrear
  el tipo).

## Ejemplos por tipo de cambio

### Agregar columna

```ts
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE transactions
    ADD COLUMN is_shared boolean NOT NULL DEFAULT false;
  `);
}
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE transactions DROP COLUMN is_shared;`);
}
```

### Crear tabla

```ts
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE statements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
      total bigint NOT NULL DEFAULT 0,
      status varchar(20) NOT NULL DEFAULT 'draft',
      sent_at timestamptz,
      paid_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX statements_contact_id_idx ON statements(contact_id);
  `);
}
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP TABLE statements;`);
}
```

### Agregar valor a enum

```ts
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TYPE statements_status_enum ADD VALUE IF NOT EXISTS 'paid';
  `);
}
public async down(): Promise<void> {
  // Postgres no soporta quitar un valor de enum sin recrear el tipo.
  // Dejar el down vacío y documentar el riesgo en el commit.
}
```

### Cambio de tipo

```ts
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE debt_entries ALTER COLUMN amount TYPE bigint;`);
}
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE debt_entries ALTER COLUMN amount TYPE integer;`);
}
```

### Índice único compuesto

```ts
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    CREATE UNIQUE INDEX periods_user_year_month_uidx
    ON periods(user_id, year, month);
  `);
}
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP INDEX periods_user_year_month_uidx;`);
}
```

## Down obligatorio (con una excepción)

El `down` debe revertir el `up`. Excepción: agregar valores a un enum no se deshace fácil en
Postgres — en ese caso dejar `async down() {}` y mencionarlo en el mensaje de commit.

## Commit

Mensaje conventional, single-line (ver skill `commit`):

- `feat(db): add shared expense fields to transactions` (cuando viene con feature)
- `chore(db): rename column X to Y on debt_entries`
- `fix(db): backfill default status on statements`

Si la migración acompaña un cambio de entidad + lógica, puede ir en el mismo commit que la
feature; si es solo esquema, va sola.

## Antes de cerrar el cambio

1. La entidad `*.entity.ts` ya refleja el cambio (columna, relación, decorador) antes de generar.
2. Revisar el archivo generado: que el `up` sea el cambio real y no un `DROP`+`ADD` accidental.
3. `up` y `down` presentes; `down` revierte exactamente el `up`.
4. Naming snake_case y tablas en plural, coherente con `CONTEXT.md`.
5. Avisar al usuario: "migración lista en `src/database/migrations/<file>.ts`, corré
   `npm run migration:run` cuando quieras aplicarla". **No correrla yo.**
