/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Cleaning utilities for ISP Nexus.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import {
	packageDistPathBuilder,
	packageOutPathBuilder,
	packagePathBuilder,
	repoRootPathBuilder,
} from "@isp.nexus/sdk/monorepo"
import { ISPNexusPackageFn, ISPNexusPackages } from "@isp.nexus/sdk/runtime/packages"
import { Stats } from "node:fs"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { PathBuilderLike } from "path-ts"

/**
 * Cleans the compiled TypeScript artifacts for the given package.
 */
export const cleanCompiledArtifacts: ISPNexusPackageFn = async (packageName) => {
	const artifactPath = packageOutPathBuilder(packageName).toString()
	const logger = ConsoleLogger.withPrefix("clean", packageName)

	logger.info(`Cleaning TypeScript artifacts...`)

	await fs.rm(artifactPath, { recursive: true, force: true })
	await fs.mkdir(artifactPath, { recursive: true })

	logger.info(`Done!`)
}

export const cleanDistributionArtifacts: ISPNexusPackageFn = async (packageName) => {
	const artifactPath = packageDistPathBuilder(packageName).toString()
	const logger = ConsoleLogger.withPrefix("clean", packageName)

	logger.info(`Cleaning distribution artifacts...`)

	await fs.rm(artifactPath, { recursive: true, force: true })
	await fs.mkdir(artifactPath, { recursive: true })

	logger.info(`Done!`)
}

export const cleanGeneratedArtifacts: ISPNexusPackageFn = async (packageName) => {
	const artifactPath = packageDistPathBuilder(packageName, "generated")

	await fs.rm(artifactPath, { recursive: true, force: true })
	await fs.mkdir(artifactPath, { recursive: true })
}

/**
 * Asserts that the given path is a directory.
 *
 * @throws {ResourceError} If the path is not a directory.
 * @internal
 */
export function assertIsDirectory(directoryPath: PathBuilderLike, stats: Stats): void {
	if (!stats.isDirectory()) {
		if (stats.isFile()) {
			throw ResourceError.from(400, `Path appears to be a file, not a directory: ${directoryPath}`)
		}

		if (stats.isSymbolicLink()) {
			throw ResourceError.from(400, `Path appears to be a symbolic link, not a directory: ${directoryPath}`)
		}

		throw ResourceError.from(400, `Path is not a directory: ${directoryPath}`)
	}
}

/**
 * Asserts that the given directory is ephemeral, i.e. not a source code directory and capable of
 * being cleaned.
 *
 * @internal
 */
export function assertDirectoryIsUntracked(directoryPath: PathBuilderLike): void {
	directoryPath = path.resolve(directoryPath.toString())

	if (directoryPath === repoRootPathBuilder().pathname) {
		throw ResourceError.from(400, `Path intersects with monorepo source code: ${directoryPath}`)
	}

	for (const packageName of ISPNexusPackages) {
		const intersectsDistDirectory = directoryPath.startsWith(packageDistPathBuilder(packageName).pathname)
		const intersectsOutDirectory = directoryPath.startsWith(packageOutPathBuilder(packageName).pathname)
		const intersectsScratchDirectory = directoryPath.startsWith(packagePathBuilder(packageName, "scratch").pathname)

		if (intersectsDistDirectory || intersectsOutDirectory || intersectsScratchDirectory) {
			continue
		}

		if (directoryPath === packagePathBuilder(packageName)) {
			throw ResourceError.from(400, `Path intersects with package \`${packageName}\` source code: ${directoryPath}`)
		}
	}
}

/**
 * Cleans the given directory, creating it if it does not exist.
 *
 * @throws {ResourceError} If the directory intersects with monorepo source code.
 */
export async function cleanDirectory(directoryPath: PathBuilderLike): Promise<void> {
	directoryPath = path.resolve(directoryPath.toString())

	const stats = await fs.stat(directoryPath).catch(() => null)

	if (!stats) {
		await fs.mkdir(directoryPath, { recursive: true })

		return
	}

	assertIsDirectory(directoryPath, stats)
	assertDirectoryIsUntracked(directoryPath)

	await fs.rm(directoryPath, { recursive: true, force: true })
	await fs.mkdir(directoryPath, { recursive: true })
}

/**
 * Cleans the given file path.
 *
 * @throws {ResourceError} If the file intersects with monorepo source code.
 */
export async function cleanFile(filePath: PathBuilderLike): Promise<void> {
	filePath = path.resolve(filePath.toString())

	const stats = await fs.stat(filePath).catch(() => null)

	if (!stats) return

	if (stats.isDirectory()) {
		throw ResourceError.from(400, `Path is a directory, not a file: ${filePath}`)
	}

	assertDirectoryIsUntracked(path.dirname(filePath))

	return fs.rm(filePath, { force: true })
}
