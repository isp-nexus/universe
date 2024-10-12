/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Data archive path utilities.
 */

import { assertOptionalKeyPresent, smartSnakeCase, supressErrors } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { execSync } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import * as path from "node:path"
import { PathBuilder, PathBuilderLike, resolvePathBuilder, ResolvePathBuilderLike } from "path-ts"
import { $private } from "./main.entrypoint.js"

/**
 * Valid data source package names.
 *
 * @internal
 */
export enum DataSourceName {
	/**
	 * ISP Nexus primary data store repository.
	 */
	DataStore = "data-store",

	/**
	 * Directory for data source migrations.
	 */
	MigrationsDirectory = "migrations",

	MigrationsTableName = "nexus_migrations",
}

export enum SQLiteFileExtension {
	Database = ".sqlite3",
	Journal = ".sqlite3-journal",
	WAL = ".sqlite3-wal",
}

/**
 * Valid data source files.
 *
 * @internal
 */
export enum DataSourceFile {
	SQLite3 = "index.sqlite3",
	CSVSource = "source.csv",
	TSVSource = "source.tsv",
}

type DataSourceRootAlias = "~data-source"

/**
 * Path builder relative to the package root.
 *
 * @internal
 */
export function dataSourcePathBuilder<T extends PathBuilderLike, Pn extends string[]>(
	p1: T,
	...pathSegments: Pn
): PathBuilder<ResolvePathBuilderLike<T, DataSourceRootAlias, Pn>> {
	assertOptionalKeyPresent($private, "DATA_SOURCE_PATH")

	const resolved = resolvePathBuilder(
		$private.DATA_SOURCE_PATH,
		DataSourceName.DataStore,
		p1.toString(),
		...pathSegments
	)

	if (!resolved.startsWith($private.DATA_SOURCE_PATH)) {
		console.warn(`Resolved path ${resolved} is not within the data source root ${$private.DATA_SOURCE_PATH}`)
		throw ResourceError.from(400, "Path segments must be relative to the data source root.")
	}

	return resolved as any
}

/**
 * Result of inferring SQL paths from a source file or directory.
 *
 * @see {@linkcode inferSQLPaths}
 */
export interface SQLPathConfig {
	/**
	 * The path to the source file, i.e. a CSV file containing the data.
	 */
	sourceFilePath: string
	/**
	 * The path to the output directory where the SQL file will be written.
	 */
	outputDirectoryPath: string

	dataSourcePath: string

	/**
	 * The path to the migrations directory.
	 */
	migrationsDirectoryPath: string
	/**
	 * The name of the table to be created from the source file.
	 */
	tableName: string
}

/**
 * Infer common SQL paths from a single source.
 */
export function inferSQLPaths(csvSourceFilePath: string): SQLPathConfig
export function inferSQLPaths(sourceDirectoryPath: string): SQLPathConfig
export function inferSQLPaths(pathInput: string): SQLPathConfig {
	const sourceFileOrDirectory = path.resolve(pathInput)

	const stat = statSync(sourceFileOrDirectory)

	if (stat.isDirectory()) {
		return {
			sourceFilePath: path.join(sourceFileOrDirectory, DataSourceFile.CSVSource),
			outputDirectoryPath: sourceFileOrDirectory,
			dataSourcePath: path.join(sourceFileOrDirectory, DataSourceFile.SQLite3),
			migrationsDirectoryPath: path.join(sourceFileOrDirectory, DataSourceName.MigrationsDirectory),
			tableName: "csv",
		}
	}

	const outputDirectoryPath = path.dirname(sourceFileOrDirectory)
	const tableName = smartSnakeCase(path.parse(sourceFileOrDirectory).name)
	const migrationsDirectoryPath = path.join(outputDirectoryPath, DataSourceName.MigrationsDirectory)
	const dataSourcePath = path.join(outputDirectoryPath, DataSourceFile.SQLite3)

	return {
		sourceFilePath: sourceFileOrDirectory,
		outputDirectoryPath,
		dataSourcePath,
		migrationsDirectoryPath,
		tableName,
	}
}

/**
 * Default Spatialite extension file name.
 *
 * @internal
 */
export const DefaultSpatialiteExtensionFileName = "mod_spatialite.dylib"

let cachedSpatialiteExtensionPath: string | null = null

/**
 * Cached variant of {@link findSpatialiteExtensionPath}.
 *
 * @category SQL
 * @category Spatialite
 * @returns The path to the Spatialite extension.
 * @throws {@link ResourceError} If the extension is not found.
 * @internal
 */
export function findCachedSpatialiteExtensionPath(
	spatialiteExtensionFileName = DefaultSpatialiteExtensionFileName
): string {
	if (cachedSpatialiteExtensionPath) return cachedSpatialiteExtensionPath

	cachedSpatialiteExtensionPath = findSpatialiteExtensionPath(spatialiteExtensionFileName)

	return cachedSpatialiteExtensionPath
}
/**
 * @category SQL
 * @category Spatialite
 * @returns The path to the Spatialite extension.
 * @throws {@link ResourceError} If the extension is not found.
 * @internal
 */
export function findSpatialiteExtensionPath(spatialiteExtensionFileName = DefaultSpatialiteExtensionFileName) {
	const { SPATIALITE_EXTENSION_PATH } = $private

	if (SPATIALITE_EXTENSION_PATH) {
		if (existsSync(SPATIALITE_EXTENSION_PATH)) return SPATIALITE_EXTENSION_PATH

		throw ResourceError.from(
			417,
			`SPATIALITE_EXTENSION_PATH was set but not found at ${SPATIALITE_EXTENSION_PATH}`,
			"database-service",
			"invalid-spatialite-extension"
		)
	}

	const installationDirectories = [
		/**
		 * System-wide installation.
		 *
		 * Note that on macOS, this is the default location SQLite looks for extensions. However, system
		 * integrity protection may prevent files from being added here.
		 */
		"/usr/lib",
		/**
		 * Local installation. Likely something you would set up yourself.
		 */
		"/usr/local/lib",
	] as const

	for (const installationDirectory of installationDirectories) {
		const spatialitePath = PathBuilder.from(installationDirectory, spatialiteExtensionFileName).toString()

		if (!existsSync(spatialitePath)) continue

		return spatialitePath
	}

	// Last ditch effort to find the extension on macOS.

	const installationDirectoryViaBrew = supressErrors(() =>
		execSync("brew --prefix libspatialite", {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim()
	)

	if (installationDirectoryViaBrew) {
		const spatialitePath = PathBuilder.from(installationDirectoryViaBrew, spatialiteExtensionFileName).toString()

		if (existsSync(spatialitePath)) {
			return spatialitePath
		}
	}

	throw ResourceError.from(417, "Spatialite extension not found", "database-service", "missing-spatialite-extension")
}
