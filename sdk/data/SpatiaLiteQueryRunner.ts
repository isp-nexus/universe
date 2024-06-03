/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { GeometryType } from "@isp.nexus/spatial"
import { Table, TableColumn } from "typeorm"
import { SqliteQueryRunner } from "typeorm/driver/sqlite/SqliteQueryRunner.js"

function categorize(columns: TableColumn[]) {
	const sqliteColumns: TableColumn[] = []
	const spatialColumns: TableColumn[] = []

	for (const column of columns) {
		if (column.spatialFeatureType) {
			spatialColumns.push(column)
		} else {
			sqliteColumns.push(column)
		}
	}

	return { sqliteColumns, spatialColumns }
}

export class SpatiaLiteQueryRunner extends SqliteQueryRunner {
	/**
	 * Check if a table has a spatial column.
	 */
	public async isSpatialColumnPresent(tableName: string, columnName: string): Promise<boolean> {
		// Note that Spatialite stores column names in lowercase.
		const rows = await this.query(
			/* sql */
			`SELECT * FROM geometry_columns
			WHERE f_table_name = '${tableName}'
			AND f_geometry_column = '${columnName.toLowerCase()}';`
		)

		return rows.length > 0
	}

	/**
	 * Adds a spatial column to a table using Spatialite.
	 *
	 * @see {@linkcode isSpatialColumnPresent} to check if a column already exists.
	 */
	public async addSpatialColumn(
		tableName: string,
		columnName: string,
		geometryType: GeometryType,
		allowNull = false
	): Promise<void> {
		const spatialColumnPresent = await this.isSpatialColumnPresent(tableName, columnName)
		if (spatialColumnPresent) return

		await this.query(/* sql */ `SELECT AddGeometryColumn(
				'${tableName}',
				'${columnName}',
				4326,
				'${geometryType.toUpperCase()}',
				2,
				${allowNull ? 0 : 1}
			);`)

		await this.query(/* sql */ `SELECT CreateSpatialIndex('${tableName}', '${columnName}');`)
	}

	/**
	 * Remove patial column from a table using Spatialite.
	 *
	 * @see {@linkcode isSpatialColumnPresent} to check if a column already exists.
	 */
	public async removeSpatialColumn(tableName: string, columnName: string): Promise<void> {
		const spatialColumnPresent = await this.isSpatialColumnPresent(tableName, columnName)
		if (!spatialColumnPresent) return

		await this.query(/* sql */ `SELECT DiscardGeometryColumn(
				'${tableName}',
				'${columnName}'
			);`)

		await this.query(/* sql */ `SELECT DisableSpatialIndex('${tableName}', '${columnName}');`)
	}

	override async recreateTable(initialNewTable: Table, initialOldTable: Table, migrateData?: boolean): Promise<void> {
		const newTable = initialNewTable.clone()
		const oldTable = initialOldTable.clone()

		const newColumnsCategorized = categorize(newTable.columns)
		const oldColumnsCategorized = categorize(oldTable.columns)

		newTable.columns = newColumnsCategorized.sqliteColumns
		oldTable.columns = oldColumnsCategorized.sqliteColumns

		for (const column of oldColumnsCategorized.spatialColumns) {
			await this.removeSpatialColumn(oldTable.name, column.name)
		}

		for (const column of newColumnsCategorized.spatialColumns) {
			await this.removeSpatialColumn(oldTable.name, column.name)
		}

		await super.recreateTable(newTable, oldTable, migrateData)

		for (const column of newColumnsCategorized.spatialColumns) {
			await this.addSpatialColumn(
				newTable.name,
				column.name,
				column.spatialFeatureType as GeometryType,
				column.isNullable
			)
		}
	}

	public override async createTable(initialTable: Table): Promise<void> {
		const columnsCategorized = categorize(initialTable.columns)
		const table = initialTable.clone()

		table.columns = columnsCategorized.sqliteColumns

		await super.createTable(table)

		for (const column of columnsCategorized.spatialColumns) {
			await this.addSpatialColumn(table.name, column.name, column.spatialFeatureType as GeometryType, column.isNullable)
		}
	}
}
