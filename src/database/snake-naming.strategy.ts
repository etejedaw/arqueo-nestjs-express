import { DefaultNamingStrategy, NamingStrategyInterface, Table } from "typeorm";
import { snakeCase } from "typeorm/util/StringUtils";

const POSTGRES_MAX_IDENTIFIER_LENGTH = 63;

export class SnakeNamingStrategy
	extends DefaultNamingStrategy
	implements NamingStrategyInterface
{
	tableName(
		targetName: string,
		userSpecifiedName: string | undefined
	): string {
		return userSpecifiedName ?? snakeCase(targetName);
	}

	columnName(
		propertyName: string,
		customName: string,
		embeddedPrefixes: string[]
	): string {
		return snakeCase(
			embeddedPrefixes.concat(customName || propertyName).join("_")
		);
	}

	relationName(propertyName: string): string {
		return snakeCase(propertyName);
	}

	joinColumnName(relationName: string, referencedColumnName: string): string {
		return snakeCase(`${relationName}_${referencedColumnName}`);
	}

	joinTableName(
		firstTableName: string,
		secondTableName: string,
		firstPropertyName: string
	): string {
		return snakeCase(
			`${firstTableName}_${firstPropertyName.replace(/\./g, "_")}_${secondTableName}`
		);
	}

	joinTableColumnName(
		tableName: string,
		propertyName: string,
		columnName?: string
	): string {
		return snakeCase(`${tableName}_${columnName || propertyName}`);
	}

	primaryKeyName(tableOrName: Table | string): string {
		return this.constraintName("pk", tableOrName, []);
	}

	uniqueConstraintName(
		tableOrName: Table | string,
		columnNames: string[]
	): string {
		return this.constraintName("uq", tableOrName, columnNames);
	}

	relationConstraintName(
		tableOrName: Table | string,
		columnNames: string[]
	): string {
		return this.constraintName("uq", tableOrName, columnNames);
	}

	foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
		return this.constraintName("fk", tableOrName, columnNames);
	}

	indexName(tableOrName: Table | string, columnNames: string[]): string {
		return this.constraintName("idx", tableOrName, columnNames);
	}

	private constraintName(
		prefix: string,
		tableOrName: Table | string,
		columnNames: string[]
	): string {
		const tableName = this.getTableName(tableOrName);
		const name = [prefix, tableName, ...columnNames].join("_");
		if (name.length > POSTGRES_MAX_IDENTIFIER_LENGTH)
			throw new Error(
				`Constraint name "${name}" exceeds ${POSTGRES_MAX_IDENTIFIER_LENGTH} characters; give it an explicit name`
			);

		return name;
	}
}
