/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Provides utilities for reading files from the local repository.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { PathBuilderLike, repoRootPathBuilder } from "@isp.nexus/sdk/reflection"
import * as fs from "node:fs/promises"
import * as path from "node:path"

const logger = ConsoleLogger.withPrefix("Files")

/**
 * Read a local text file from the repository.
 *
 * @category Node
 * @category Files
 */
export function readLocalTextFile<S extends string[]>(...pathSegments: S) {
	if (pathSegments.length === 0) {
		throw new Error("No file path segments provided.")
	}

	const filePath = repoRootPathBuilder(...pathSegments)

	logger.debug(`Reading from file: ${filePath}`)
	return fs.readFile(filePath, "utf-8")
}

/**
 * Read a local JSON file from the repository.
 *
 * @category Node
 * @category Files
 */
export function readLocalJSONFile<T = Record<string, unknown>, S extends string[] = string[]>(
	...pathSegments: S
): Promise<T> {
	return readLocalTextFile(...pathSegments).then(JSON.parse)
}

/**
 * Write a local text file to the repository.
 *
 * @category Node
 * @category Files
 */
export function writeLocalTextFile<S extends PathBuilderLike[]>(content: string, ...pathSegments: S): Promise<void>
export function writeLocalTextFile<S extends PathBuilderLike>(content: string, filePath: S): Promise<void>
export async function writeLocalTextFile<S extends PathBuilderLike[]>(
	content: string,
	...pathSegments: S
): Promise<void> {
	if (pathSegments.length === 0) {
		throw new Error("No file path segments provided.")
	}

	if (content === "") {
		logger.warn("Attempted to write an empty file.")
	}

	const filePath = repoRootPathBuilder(pathSegments.toString()).toString()
	const dirName = path.dirname(filePath)

	await fs.mkdir(dirName, { recursive: true })

	logger.debug(`Writing to file: ${filePath}`)
	return fs.writeFile(filePath, content, "utf-8")
}

/**
 * Write a local JSON file to the repository.
 *
 * @category Node
 * @category Files
 */
export function writeLocalJSONFile<T = Record<string, unknown>, S extends string[] = string[]>(
	content: T,
	...pathSegments: S
): Promise<void>
export function writeLocalJSONFile<T = Record<string, unknown>, S extends string = string>(
	content: T,
	filePath: S
): Promise<void>
export function writeLocalJSONFile<T = Record<string, unknown>, S extends string[] = string[]>(
	content: T,
	...pathSegments: S
): Promise<void> {
	return writeLocalTextFile(JSON.stringify(content, null, "\t"), ...pathSegments)
}

/**
 * A buffer-like object that can be written to a file.
 *
 * @internal
 */
export type BufferLike =
	| NodeJS.ArrayBufferView
	| Iterable<string | NodeJS.ArrayBufferView>
	| AsyncIterable<string | NodeJS.ArrayBufferView>
/**
 * Write a local text file to the repository.
 *
 * @category Node
 * @category Files
 */
export function writeLocalBuffer<S extends string[]>(content: BufferLike, ...pathSegments: S): Promise<void>
export function writeLocalBuffer<S extends string>(content: BufferLike, filePath: S): Promise<void>
export async function writeLocalBuffer<S extends string[]>(content: BufferLike, ...pathSegments: S): Promise<void> {
	if (pathSegments.length === 0) {
		throw new Error("No file path segments provided.")
	}

	const filePath = repoRootPathBuilder(...pathSegments)
	const dirName = path.dirname(filePath)

	await fs.mkdir(dirName, { recursive: true })

	logger.debug(`Writing to file: ${filePath}`)
	return fs.writeFile(filePath, content)
}
