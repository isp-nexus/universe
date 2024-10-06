/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { AsyncInitializable, ServiceSymbol } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger, IRuntimeLogger, pluckOrCreatePrefixedLogger } from "@isp.nexus/core/logging"
import FastGlob from "fast-glob"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { DataSource, Driver, EntitySchema, LogLevel, MixedList } from "typeorm"
import { DriverFactory } from "typeorm/driver/DriverFactory.js"
import { SnakeNamingStrategy } from "./naming.js"
import {
	SpatiaLiteDriver,
	SQLitePragma,
	SQLitePragmaRecord,
	SQLitePragmaValue,
	StrictSQlitePragmas,
} from "./SpatiaLiteDriver.js"
import { SpatiaLiteQueryRunner } from "./SpatiaLiteQueryRunner.js"
import { TypeORMLogger } from "./TypeORMLogger.js"

export {
	type SpatiaLiteDriver,
	type SpatiaLiteQueryRunner,
	type SQLitePragma,
	type SQLitePragmaRecord,
	type SQLitePragmaValue,
}

const DriverFactoryCreateSuper = DriverFactory.prototype.create
DriverFactory.prototype.create = function (connection: DataSource): Driver {
	if (connection.options.type === "sqlite") {
		return new SpatiaLiteDriver(connection)
	}

	return DriverFactoryCreateSuper.call(this, connection)
}

export interface NexusDataSourceConfig {
	displayName: IRuntimeLogger | string
	storagePath: string
	migrationsPath?: string
	entities?: MixedList<EntitySchema>
	logLevels?: LogLevel[]
	pragmas?: SQLitePragmaRecord
	wal?: boolean
}

/**
 * A TypeORM data source for ISP Nexus modules.
 */
export class NexusDataSource extends DataSource implements AsyncDisposable, AsyncInitializable {
	declare driver: SpatiaLiteDriver
	#logger: IRuntimeLogger
	public readonly pragmas: SQLitePragmaRecord
	public readonly storagePath: string

	constructor(options: NexusDataSourceConfig) {
		const { storagePath, entities, migrationsPath, logLevels } = options
		const migrations = migrationsPath ? FastGlob.sync(path.join(migrationsPath, "*.js")) : []
		const logger = pluckOrCreatePrefixedLogger(options.displayName)

		super({
			type: "sqlite",
			synchronize: false,
			database: storagePath,
			logger: new TypeORMLogger(logger, logLevels),
			entities,
			migrations,
			namingStrategy: new SnakeNamingStrategy(),
			enableWAL: options.wal,
			name: logger.prefixes.join(":"),
		})

		this.#logger = logger

		this.pragmas = options.pragmas || StrictSQlitePragmas
		this.storagePath = storagePath
	}

	public async ready(): Promise<this> {
		this.#logger.debug("Initializing...")

		await this.initialize()
		await this.driver.loadSpatialiteExtension()

		for (const [pragma, value] of Object.entries(this.pragmas)) {
			await this.driver.setPragma(pragma, value)
		}

		return this
	}

	public async dispose(): Promise<void> {
		this.#logger.debug("Disconnecting...")
		// await this.query(/* sql */ `
		// 	BEGIN EXCLUSIVE;
		// 	SELECT NULL;
		// 	END;
		// 	`)
		await this.driver.queryRunner.release()
		await this.driver.disconnect()
	}

	/**
	 * Perform a VACUUM operation on the database.
	 */
	public vacuum(): Promise<void> {
		return this.query(/* sql */ `VACUUM;`)
	}

	public [Symbol.asyncDispose]() {
		return this.dispose()
	}

	public [ServiceSymbol.asyncInit](): Promise<this> {
		return this.ready()
	}

	public override toString(): string {
		return this.#logger.prefixes.join(":")
	}
}

/**
 * Reset the data source by removing the storage path and journal file.
 *
 * This cannot be undone, unless of course the data is persisted by Git.
 */
export async function destructivelyResetDataSource(storagePath: string) {
	if (!process.env.CLEAN_DATA_SOURCE) {
		throw new Error("Cannot reset data source without CLEAN_DATA_SOURCE environment variable.")
	}

	ConsoleLogger.info(`⛔️ Removing existing data at ${storagePath}`)
	await fs.rm(storagePath, { force: true })
	await fs.rm(storagePath + "-journal", { force: true })
	await fs.mkdir(path.basename(storagePath), { recursive: true })
}
