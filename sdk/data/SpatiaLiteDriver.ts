/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger, IRuntimeLogger } from "@isp.nexus/core/logging"
import { Database as SQLiteDatabase } from "sqlite3"
import { DataSource, QueryRunner } from "typeorm"
import { SqliteDriver } from "typeorm/driver/sqlite/SqliteDriver.js"
import { SpatiaLiteQueryRunner } from "./SpatiaLiteQueryRunner.js"
import { findSpatialiteExtensionPath } from "./spatial.js"

/**
 * A pragma that can be set on a SQLite database.
 */
export type SQLitePragma = "auto_vacuum" | "synchronous" | "locking_mode" | "page_size" | "cache_size" | "journal_mode"

/**
 * The value of a pragma that can be set on a SQLite database.
 */
export type SQLitePragmaValue = string | number

/**
 * A record of SQLite pragmas and their respective values.
 */
export type SQLitePragmaRecord = {
	[pragma in SQLitePragma]?: SQLitePragmaValue | undefined
}

/**
 * Default SQLite pragmas for a more write-heavy database.
 */
export const StrictSQlitePragmas = {
	auto_vacuum: "FULL",
	synchronous: "FULL",
	locking_mode: "EXCLUSIVE",
	page_size: 4096,
	cache_size: 10000,
} as const satisfies SQLitePragmaRecord

/**
 * A TypeORM driver for working with SpatiaLite databases.
 */
export class SpatiaLiteDriver extends SqliteDriver {
	#logger: IRuntimeLogger
	declare databaseConnection: SQLiteDatabase
	declare queryRunner: SpatiaLiteQueryRunner

	constructor(dataSource: DataSource) {
		super(dataSource)

		this.#logger = ConsoleLogger.withPrefix(dataSource.name || "SpatiaLiteDriver")
		this.queryRunner = new SpatiaLiteQueryRunner(this)
	}

	public loadSpatialiteExtension = async (): Promise<void> => {
		const extensionPath = findSpatialiteExtensionPath()
		await this.loadExtension(extensionPath)
	}

	public async setPragma(pragmaName: string, value: string | number | null | boolean): Promise<void> {
		return this.queryRunner.query(`PRAGMA ${pragmaName} = ${value};`)
	}

	/**
	 * Load a SQLite extension.
	 */
	protected async loadExtension(extensionPath: string): Promise<void> {
		this.#logger.debug(`Loading extension: ${extensionPath}`)

		return new Promise<void>((resolve, reject) =>
			this.databaseConnection.loadExtension(extensionPath, (error) => {
				if (error) reject(error)
				else resolve()
			})
		)
	}

	/**
	 * Creates a query runner used to execute database queries.
	 */
	public override createQueryRunner(): QueryRunner {
		return this.queryRunner
	}
}
