/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { AsyncInitializable, ServiceSymbol } from "@isp.nexus/core/lifecycle"
import { IRuntimeLogger, pluckOrCreatePrefixedLogger } from "@isp.nexus/core/logging"
import { DataSourceName } from "@isp.nexus/sdk/runtime"
import FastGlob from "fast-glob"
import { PathBuilder, PathBuilderLike } from "path-ts"
import { DataSource, Driver, EntitySchema, LogLevel, MigrationInterface, MixedList } from "typeorm"
import { DriverFactory } from "typeorm/driver/DriverFactory.js"
import { checkIfExists } from "../files/local.js"
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

export type MigrationInterfaceConstructor = new () => MigrationInterface

/**
 * Virtual path for an in-memory SQLite database.
 */
export const MemoryDBStoragePath = ":memory:"
export type MemoryDBStoragePath = typeof MemoryDBStoragePath

export interface NexusDataSourceConfig {
	displayName: IRuntimeLogger | string
	storagePath: PathBuilderLike | MemoryDBStoragePath
	synchronize?: boolean
	migrations?: PathBuilderLike
	entities?: MixedList<EntitySchema>
	logLevels?: LogLevel[]
	pragmas?: SQLitePragmaRecord
	wal?: boolean
}

/**
 * Information about a column in a table.
 */
export interface ColumnInfo<ColumnName extends string = string> {
	/**
	 * Column ID
	 */
	cid: number
	/**
	 * Column name
	 */
	name: ColumnName
	/**
	 * Column type
	 */
	type: "TEXT" | "INTEGER" | "REAL" | "BLOB"
	/**
	 * Whether the column may contain NULL values 0 = false, 1 = true
	 */
	notnull: number
	/**
	 * Default value for the column
	 */
	dflt_value: string | null
	/**
	 * Whether the column is part of the primary key
	 */
	pk: number
}

/**
 * A TypeORM data source for ISP Nexus modules.
 */
export class NexusDataSource extends DataSource implements AsyncDisposable, AsyncInitializable {
	declare driver: SpatiaLiteDriver
	declare logger: TypeORMLogger

	public readonly pragmas: SQLitePragmaRecord
	public readonly storagePath: PathBuilder | MemoryDBStoragePath
	static kInit = Symbol.for("nexus.data-source.init")

	constructor(options: NexusDataSourceConfig) {
		const { storagePath, entities, migrations = [], logLevels } = options
		const logger = pluckOrCreatePrefixedLogger(options.displayName)

		super({
			type: "sqlite",
			database: storagePath.toString(),
			logger: new TypeORMLogger(logger, logLevels),
			entities,
			migrations: Array.isArray(migrations)
				? migrations
				: FastGlob.sync(PathBuilder.from(migrations, "*.js").toString()),
			migrationsTableName: DataSourceName.MigrationsTableName,
			namingStrategy: new SnakeNamingStrategy(),
			enableWAL: options.wal,
			name: logger.prefixes.join(":"),
		})

		this.pragmas = options.pragmas || StrictSQlitePragmas
		this.storagePath = PathBuilder.from(storagePath)
	}

	/**
	 * @deprecated Use `ready` or `Symbol.asyncInit` instead.
	 */
	public override initialize(ignitionKey?: symbol): Promise<this> {
		if (ignitionKey !== NexusDataSource.kInit) {
			throw ResourceError.from(400, `Use \`NexusDataSource.ready\` instead of \`NexusDataSource.initialize\``)
		}

		return super.initialize()
	}

	public async ready(): Promise<this> {
		this.logger.debug("Initializing...")

		if (this.storagePath !== MemoryDBStoragePath) {
			const storagePathDirectory = this.storagePath.dirname()
			const storageDirectoryExists = await checkIfExists(storagePathDirectory)

			if (!storageDirectoryExists) {
				throw ResourceError.from(
					417,
					`Data Source (${this.logger.prefixes.join(":")}) Storage directory does not exist: ${storagePathDirectory}`
				)
			}
		}

		await this.initialize(NexusDataSource.kInit)
		await this.driver.loadSpatialiteExtension()

		for (const [pragma, value] of Object.entries(this.pragmas)) {
			await this.driver.setPragma(pragma, value)
		}

		return this
	}

	/**
	 * Query the column information for a table.
	 */
	public async tableInfo<T extends string = string>(tableName: string): Promise<ColumnInfo<T>[]> {
		const introspectionTableName = `${tableName}_introspection`

		// We create a temporary view of the table to include virtual columns in the introspection.
		await this.query(/* sql */ `
			CREATE TEMP VIEW IF NOT EXISTS '${introspectionTableName}' AS
			SELECT * FROM '${tableName}' LIMIT 0;
		`)

		const columnInfoRows = await this.query<ColumnInfo<T>[]>(/* sql*/ `
			PRAGMA table_info(${introspectionTableName});
		`)

		await this.query(/* sql */ `DROP VIEW '${introspectionTableName}';`)

		return columnInfoRows
	}

	/**
	 * Attach a database to the current connection.
	 */
	public async attach(
		databasePath: PathBuilderLike,
		schemaName: PathBuilderLike,
		mode: "ro" | "rw" | "rwc" = "ro"
	): Promise<void> {
		this.logger.info(`Attaching database: ${databasePath} as ${schemaName}...`)
		await this.query(/* sql */ `
			ATTACH DATABASE 'file:${databasePath}?mode=${mode}' AS ${schemaName};
		`)
	}

	public async dispose(): Promise<void> {
		this.logger.debug("Disconnecting...")
		await this.query(/* sql */ `
			BEGIN EXCLUSIVE;
			SELECT NULL;
			END;
			`)

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
		return this.logger.prefixes.join(":")
	}
}
