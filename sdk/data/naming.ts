/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file TypeORM naming strategy and utilities.
 */

import { smartSnakeCase } from "@isp.nexus/core"
import { DefaultNamingStrategy, EntitySchemaIndexOptions, NamingStrategyInterface, Table } from "typeorm"

/**
 * Given a column name, infers a reasonable index name.
 */
export function inferIndexName<T>(column: Extract<keyof T, string>) {
	return `idx_${smartSnakeCase(column)}` as const
}

export function inferColumnIndexConfig<T>(column: Extract<keyof T, string>) {
	return {
		columns: [column],
	} satisfies EntitySchemaIndexOptions
}

/**
 * A TypeORM naming strategy that converts names to snake_case.
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
	override tableName(className: string, customName: string): string {
		return customName ? customName : smartSnakeCase(className)
	}

	override columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
		return (
			smartSnakeCase(embeddedPrefixes.concat("").join("_")) + (customName ? customName : smartSnakeCase(propertyName))
		)
	}

	override relationName(propertyName: string): string {
		return smartSnakeCase(propertyName)
	}

	override joinColumnName(relationName: string, referencedColumnName: string): string {
		return smartSnakeCase(relationName + "_" + referencedColumnName)
	}

	override joinTableName(
		firstTableName: string,
		secondTableName: string,
		firstPropertyName: string,
		_secondPropertyName: string
	): string {
		return smartSnakeCase(firstTableName + "_" + firstPropertyName.replace(/\./gi, "_") + "_" + secondTableName)
	}

	override joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
		return smartSnakeCase(tableName + "_" + (columnName ? columnName : propertyName))
	}

	classTableInheritanceParentColumnName(parentTableName: any, parentTableIdPropertyName: any): string {
		return smartSnakeCase(parentTableName + "_" + parentTableIdPropertyName)
	}

	eagerJoinRelationAlias(alias: string, propertyPath: string): string {
		return alias + "__" + propertyPath.replace(".", "_")
	}

	override indexName(tableName: string, columnNames: string[], _where: string): string {
		return `idx_${tableName}_${columnNames.map(smartSnakeCase).join("_")}`
	}

	override foreignKeyName(
		tableOrName: Table | string,
		columnNames: string[],
		referencedTablePath?: string,
		referencedColumnNames?: string[]
	): string {
		const tableName = typeof tableOrName === "string" ? tableOrName : tableOrName.name
		const referencedTableName = referencedTablePath ?? tableName
		const referencedColumn = referencedColumnNames?.[0] ?? "id"
		const column = columnNames[0]

		return `fk_${tableName}_${column}_${referencedTableName}_${referencedColumn}`
	}
	override uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
		const tableName = typeof tableOrName === "string" ? tableOrName : tableOrName.name

		return `uq_${tableName}_${columnNames.map(smartSnakeCase).join("_")}`
	}

	override relationConstraintName(tableOrName: Table | string, columnNames: string[], where?: string): string {
		const tableName = typeof tableOrName === "string" ? tableOrName : tableOrName.name

		return `fk_${tableName}_${columnNames.map(smartSnakeCase).join("_")}${where ? `_${where}` : ""}`
	}
	/**
	 * Gets the table's default constraint name from the given table name and column name.
	 */
	override defaultConstraintName(tableOrName: Table | string, columnName: string): string {
		const tableName = typeof tableOrName === "string" ? tableOrName : tableOrName.name

		return `df_${tableName}_${smartSnakeCase(columnName)}`
	}
}
