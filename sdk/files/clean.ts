/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file ISP Nexus SDK clean script
 */

import { ISPNexusPackageFn, ISPNexusPackages } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import {
	packageDistPathBuilder,
	packageOutPathBuilder,
	packagePathBuilder,
	PathBuilderLike,
	repoRootPathBuilder,
} from "@isp.nexus/sdk/reflection"
import * as fs from "node:fs/promises"

/**
 * Cleans the compiled TypeScript artifacts for the given package.
 */
export const cleanCompiledArtifacts: ISPNexusPackageFn = async (packageName) => {
	const path = packageOutPathBuilder(packageName)
	const logger = ConsoleLogger.withPrefix("clean", packageName)

	logger.info(`Cleaning TypeScript artifacts...`)

	await fs.rm(path, { recursive: true, force: true })
	await fs.mkdir(path, { recursive: true })

	logger.info(`Done!`)
}

export const cleanDistributionArtifacts: ISPNexusPackageFn = async (packageName) => {
	const path = packageDistPathBuilder(packageName)
	const logger = ConsoleLogger.withPrefix("clean", packageName)

	logger.info(`Cleaning distribution artifacts...`)

	await fs.rm(path, { recursive: true, force: true })
	await fs.mkdir(path, { recursive: true })

	logger.info(`Done!`)
}

export const cleanGeneratedArtifacts: ISPNexusPackageFn = async (packageName) => {
	const path = packageDistPathBuilder(packageName, "generated")

	await fs.rm(path, { recursive: true, force: true })
	await fs.mkdir(path, { recursive: true })
}

/**
 * Cleans the given directory, creating it if it does not exist.
 *
 * @throws {ResourceError} If the directory intersects with monorepo source code.
 */
export async function cleanDirectory(directoryPath: PathBuilderLike): Promise<void> {
	directoryPath = directoryPath.toString()
	const stats = await fs.stat(directoryPath).catch(() => null)

	if (!stats) {
		await fs.mkdir(directoryPath, { recursive: true })

		return
	}

	if (!stats.isDirectory()) {
		if (stats.isFile()) {
			throw ResourceError.from(400, `Path appears to be a file, not a directory: ${directoryPath}`)
		}

		if (stats.isSymbolicLink()) {
			throw ResourceError.from(400, `Path appears to be a symbolic link, not a directory: ${directoryPath}`)
		}

		throw ResourceError.from(400, `Path is not a directory: ${directoryPath}`)
	}

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

	await fs.rm(directoryPath, { recursive: true, force: true })
	await fs.mkdir(directoryPath, { recursive: true })
}
