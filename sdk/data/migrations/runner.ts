/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   SQL migration task runners.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { formatSQLite } from "@isp.nexus/sdk/files/sql"
import { DataSourceName, SQLPathConfig } from "@isp.nexus/sdk/runtime"
import FastGlob from "fast-glob"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { $, ProcessPromise } from "zx"
import { migrationIDToFileName, MigrationOptions, parseMigrationFileName } from "./templating.js"

export type WriteMigrationOptions = {
	sql: string
} & MigrationOptions &
	Pick<SQLPathConfig, "migrationsDirectoryPath">

/**
 * Writes a migration file to disk.
 *
 * @category SQL
 * @returns `filePath` The path to the migration file.
 * @internal
 */
export async function writeMigrationFile({
	sql,
	migrationsDirectoryPath,
	...options
}: WriteMigrationOptions): Promise<string> {
	await fs.mkdir(migrationsDirectoryPath, { recursive: true })

	const fileName = migrationIDToFileName(options)
	const filePath = path.resolve(migrationsDirectoryPath, fileName)

	await fs.writeFile(filePath, formatSQLite(sql))

	return filePath
}

/**
 * Runs a SQL command in a child shell.
 *
 * @category SQL
 */
export async function runSQLInShell(dataSourcePath: string, sql: string): Promise<ProcessPromise> {
	$.cwd = path.dirname(dataSourcePath)

	const cmd = $`echo ${sql} | sqlite3 -batch -noheader ${dataSourcePath}`
	cmd.stdout.on("data", (data) => ConsoleLogger.info(data.toString()))

	return cmd
}

export async function collectPendingMigrationFiles({
	dataSourcePath,
	migrationsDirectoryPath,
	direction = "up",
}: Pick<SQLPathConfig, "migrationsDirectoryPath" | "dataSourcePath"> & Pick<MigrationOptions, "direction">): Promise<
	string[]
> {
	const currentMigrations = await readCurrentMigrations(dataSourcePath)
	const migrationFilePaths = await FastGlob(path.join(migrationsDirectoryPath, `*.${direction}.sql`))
	const mostRecentMigration = currentMigrations.slice(-1)[0]!

	const pendingMigrationPaths: string[] = []

	for (const migration of migrationFilePaths) {
		const { timestamp: migrationTimestamp } = parseMigrationFileName(migration)

		if (migrationTimestamp > mostRecentMigration.timestamp) {
			pendingMigrationPaths.push(migration)
		}
	}

	return pendingMigrationPaths
}

/**
 * Prepares the migrations table in the database.
 *
 * @returns Most recent migration timestamp
 */
export async function prepareMigrationsTable(dataSourcePath: string): Promise<void> {
	await runSQLInShell(
		dataSourcePath,
		/* sql */ `
		DROP TABLE IF EXISTS "${DataSourceName.MigrationsTableName}";

		CREATE TABLE "${DataSourceName.MigrationsTableName}" (
			"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			"timestamp" bigint NOT NULL,
			"name" varchar NOT NULL
		);

		INSERT INTO "${DataSourceName.MigrationsTableName}" ("timestamp", "name") VALUES (
			-1,
			'init'
		);

		CREATE INDEX IF NOT EXISTS "idx_${DataSourceName.MigrationsTableName}_timestamp" ON "${DataSourceName.MigrationsTableName}" ("timestamp");`
	)
}

export interface MigrationMetadata {
	id: number
	timestamp: number
	name: string
}

export async function readCurrentMigrations(dataSourcePath: string): Promise<MigrationMetadata[]> {
	const output = await runSQLInShell(
		dataSourcePath,
		/* sql */ `
		SELECT json_group_array(
			json_object(
				'id', id,
				'timestamp', timestamp,
				'name', name
			)
		)	FROM ${DataSourceName.MigrationsTableName};`
	)

	const results = JSON.parse(output.text())

	return results
}

/**
 * Reads a migration file from disk.
 */
export async function runMigration(dataSourcePath: string, migrationFilePath: string): Promise<void> {
	const { direction, name } = parseMigrationFileName(migrationFilePath)

	ConsoleLogger.info(`Running migration ${name} (${direction})...`)

	const content = await fs.readFile(migrationFilePath, "utf-8")

	const sql = /* sql */ `
		PRAGMA foreign_keys=OFF;
		${content}

		PRAGMA foreign_keys=ON;

		INSERT INTO "${DataSourceName.MigrationsTableName}" ("timestamp", "name") VALUES (
			${Date.now()},
			'${name}'
		);
	`

	await runSQLInShell(dataSourcePath, sql)
}
