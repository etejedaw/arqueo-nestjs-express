---
name: typeorm-migration
description: Create a TypeORM migration whenever an @Entity() class is created or modified in a way that changes the DB schema (new entity, new/removed/renamed column, type change, default change, nullability, unique/index, relation with FK, enum value). Skip if the change is purely TypeScript-side (methods, getters, validation decorators without DDL impact). Prefers migration:generate from the project's DataSource and always reviews the generated SQL.
license: Apache-2.0. Complete terms in LICENSE
---

# TypeORM Migration

Cada vez que se **crea o modifica** una entidad de TypeORM y el cambio impacta el esquema de la base, hay que generar una migración. Esto incluye los archivos de tipos usados como `enum` en un `@Column`.

> **Antes de tocar una entidad, pide confirmación al usuario.** La skill se aplica una vez que hay luz verde para cambiar la entidad.

## Configuración del proyecto

Antes de crear la migración, averigua cómo trabaja el proyecto. Lo que defina el `CLAUDE.md` del proyecto (o la sección de migraciones del `README.md`) manda sobre todo lo demás.

| Ajuste | Dónde mirarlo | Por defecto |
| --- | --- | --- |
| DataSource del CLI | Archivo con `new DataSource(...)` (típicamente `src/database/data-source.ts` o `src/data-source.ts`) | — |
| Carpeta de migraciones | Opción `migrations` del DataSource, o la carpeta de las migraciones existentes | `src/database/migrations/` |
| Comandos | Scripts `migration:*` o `typeorm` de `package.json` | `npx typeorm-ts-node-commonjs migration:generate -d <data-source> <ruta>/<Nombre>` |
| Naming strategy | Opción `namingStrategy` del DataSource | La default de TypeORM |
| Registro de migraciones | Si `migrations` es un array importado (ej: `migrations/index.ts`) en vez de un glob | Glob |

Si ya hay migraciones en la carpeta, **la más reciente es la referencia de estilo**: indentación, comillas, forma de escribir el SQL y nombres de constraints.

## Cuándo aplicar

| Cambio en la entidad | ¿Migración? |
| --- | --- |
| Entidad nueva (`@Entity()`) | Sí |
| Columna nueva / borrada / renombrada | Sí |
| Cambio de `type`, `length`, `default`, `nullable`, `unique`, `primary` | Sí |
| `@Index`, `@Unique`, o relación (`@ManyToOne`, `@OneToOne` con `@JoinColumn`, `@ManyToMany` con `@JoinTable`) | Sí |
| Valor agregado/quitado a un `enum` | Sí |
| Cambio del nombre de la tabla (`@Entity("nombre")`) | Sí |
| `onDelete` / `onUpdate` de una relación | Sí (cambia la FK) |
| Métodos, getters, decoradores de validación (`class-validator`, `class-transformer`) | No |
| Relación inversa sin columna (`@OneToMany`) | No |
| Refactor de imports, mover archivos sin cambiar shape | No |

## Cómo crear la migración

### Opción A: generar a partir de las entidades (preferida)

`migration:generate` compara las entidades con el esquema actual de la base y escribe el SQL de la diferencia. Requisitos:

- La base de desarrollo está levantada y accesible con la config del DataSource.
- Todas las migraciones existentes ya están aplicadas en esa base (`migration:show`). Si falta alguna, el diff sale con cambios que no son tuyos: avisa al usuario en vez de generar.

Ejemplo con los scripts típicos:

```bash
npm run migration:generate -- src/database/migrations/AddPhoneToUsers
```

`migration:generate` solo lee la base, no la modifica.

### Opción B: crear vacía y escribirla a mano

Cuando la base no está disponible, cuando el cambio no sale de las entidades (backfill de datos, extensiones, cambios de enum que TypeORM no detecta bien) o cuando el generado no sirve:

```bash
npm run migration:create -- src/database/migrations/BackfillUserRoles
```

Escribe el SQL siguiendo la naming strategy del proyecto.

### Revisar siempre el resultado

El generado **no se entrega sin revisar**:

- **Renombres**: TypeORM no detecta renombres. Un cambio de nombre de columna sale como `DROP COLUMN` + `ADD COLUMN` y **borra los datos**. Reemplázalo por `ALTER TABLE ... RENAME COLUMN ...`. Lo mismo con tablas.
- **Enums**: cambiar los valores de un enum suele generar `DROP TYPE` + `CREATE TYPE` con conversiones. Si solo se agrega un valor, basta con `ALTER TYPE ... ADD VALUE IF NOT EXISTS`.
- **Ruido**: si aparecen cambios que no corresponden a tu entidad, la base no está al día o hay un drift previo. No los dejes en tu migración; avisa al usuario.
- **Columnas NOT NULL en tablas con datos**: agregar una columna `NOT NULL` sin `DEFAULT` falla si la tabla ya tiene filas. Agrega un default o un backfill.
- **Nombres de constraints**: si el proyecto tiene naming strategy propia, los nombres de PK, FK, índices y uniques deben seguirla.

### Registrar la migración

Si el DataSource recibe un array de clases importado (por ejemplo desde `migrations/index.ts`), **agrega la clase nueva al array**. Si no, ni la app ni el CLI la ven.

## Naming

El nombre que se pasa al CLI va en **PascalCase**: `<Verbo><Sujeto>`. TypeORM antepone el timestamp al archivo (`1791167844939-AddPhoneToUsers.ts`) y lo agrega al nombre de la clase (`AddPhoneToUsers1791167844939`).

- Verbos canónicos: `Create`, `Add`, `Remove`, `Rename`, `Change`, `Drop`, `AddIndex`, `AddFk`, `Backfill`.
- Ejemplos: `CreateInvoicesTable`, `AddPhoneToUsers`, `RenameLastNameOnUsers`, `AddAccountantValueToUsersRoleEnum`.

## Granularidad: una migración por unidad lógica, no por columna

Agrupar todos los cambios de base que pertenecen a **la misma feature / unidad de cambio** en una sola migración. `migration:generate` ya lo hace si cambias todas las entidades de la feature antes de generar.

**No agrupar** cuando son features distintas que podrían deployarse por separado, cuando tocan dominios sin relación, o cuando una es DDL pesado (rebuild de índice, cambio de tipo en tabla grande) y la otra trivial.

Naming en migraciones agrupadas: un sujeto que cubra la feature, no una lista. `AddContactFieldsToClients` mejor que `AddPhoneEmailAddressToClients`.

## Template

```ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneToUsers1791167844939 implements MigrationInterface {
	name = "AddPhoneToUsers1791167844939";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "users" ADD "phone" text
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "users" DROP COLUMN "phone"
		`);
	}
}
```

## Fechas en PostgreSQL

En PostgreSQL, TypeORM mapea las fechas a `timestamp` (sin zona horaria) si no se le indica el tipo. Eso aplica a `@CreateDateColumn`, `@UpdateDateColumn`, `@DeleteDateColumn` y a un `@Column()` sobre una propiedad `Date`. Postgres guarda entonces la hora sin zona y, al leerla, queda corrida según la zona horaria del servidor o del driver.

Por eso, **toda columna de fecha con hora en una entidad declara `type: "timestamptz"`**:

```ts
@CreateDateColumn({ type: "timestamptz" })
createdAt: Date;

@UpdateDateColumn({ type: "timestamptz" })
updatedAt: Date;

@DeleteDateColumn({ type: "timestamptz" })
deletedAt: Date | null;

@Column({ type: "timestamptz", nullable: true })
lastLoginAt: Date | null;
```

Si al crear o modificar una entidad encuentras una columna de fecha sin `type: "timestamptz"`, agrégalo antes de generar la migración. Si es una columna que ya existe en la base, la migración necesita un `ALTER COLUMN ... TYPE timestamptz`: avísale al usuario antes, porque convertir datos existentes interpreta la hora guardada según la zona horaria de la sesión.

Las fechas sin hora (solo día) van como `type: "date"`.

## Reglas de DDL (PostgreSQL)

- **Nombres de tablas y columnas** según la naming strategy del proyecto. La default de TypeORM usa el nombre de la propiedad tal cual (camelCase) para las columnas; con una strategy snake_case, `lastName` queda `last_name`. Revisa una migración existente si dudas.
- **Identificadores entre comillas dobles**, como los escribe TypeORM: `"users"`, `"last_name"`.
- **Enums**: TypeORM nombra el tipo `<tabla>_<columna>_enum` (ej: `users_role_enum`), salvo que el `@Column` defina `enumName`.
- **Defaults con UUID**: `gen_random_uuid()` (nativo desde PostgreSQL 13).
- **FKs**: el `ON DELETE` de la migración debe coincidir con el `onDelete` de la relación en la entidad.

## Down obligatorio (con una excepción)

El `down` debe revertir el `up`, en orden inverso. Excepción: agregar valores a un enum no se puede deshacer fácil en PostgreSQL. En ese caso deja el `down` vacío y avísale al usuario del riesgo.

## Antes de cerrar el cambio

1. El SQL generado fue revisado: sin renombres convertidos en `DROP` + `ADD` ni cambios ajenos.
2. En PostgreSQL, toda columna de fecha con hora de la entidad tiene `type: "timestamptz"` y la migración la crea como `timestamptz`.
3. `down` revierte el `up` en orden inverso.
4. La migración está registrada si el proyecto usa un array de migraciones.
5. La entidad ya tiene el cambio antes de pedirle al usuario correr la migración.
6. Avisar al usuario: "migración lista en `<carpeta>/<archivo>.ts`, aplícala con `<comando del proyecto>` cuando quieras". **No correrla tú**: nunca `migration:run` ni `migration:revert`, ni en desarrollo ni en producción.
