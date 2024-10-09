/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ProviderID } from "@isp.nexus/fcc"
import { dataSourcePathBuilder, packagePathBuilder, PathBuilderLike } from "@isp.nexus/sdk/reflection"
import { AdminLevel1Code } from "@isp.nexus/tiger"
import { BDCFile } from "./common.js"

export type BDCFileCacheDirectoryBuilderParams = Pick<BDCFile, "stateCode" | "providerID" | "category" | "subcategory">

/**
 * Path builder for a specific state and broadband provider.
 */
export function BDCFileCacheDirectoryBuilder<P extends BDCFileCacheDirectoryBuilderParams>({
	stateCode,
	providerID,
	category,
	subcategory,
}: P) {
	return dataSourcePathBuilder(
		// ---
		"scratch",
		"fcc",
		"bdc",
		stateCode,
		"providers",
		providerID.toString() as `${ProviderID}`,
		category,
		subcategory
	)
}

/**
 * Build a weak map of file cache directory paths.
 *
 * This is useful for managing the cache of files downloaded from the BDC, while keeping memory
 * usage low.
 */
export function buildFileCacheDirectoryMap(fileParamCollection: Iterable<BDCFileCacheDirectoryBuilderParams>) {
	const fileCacheDirectoryMap = new WeakMap<BDCFileCacheDirectoryBuilderParams, PathBuilderLike>()

	for (const file of fileParamCollection) {
		const fileCacheDirectory = BDCFileCacheDirectoryBuilder(file)
		fileCacheDirectoryMap.set(file, fileCacheDirectory)
	}

	return fileCacheDirectoryMap
}

/**
 * Path builder to a FIPS state-level repository.
 *
 * @internal
 */
export function FIPSStateLevelPath<F extends AdminLevel1Code, S extends string[]>(
	stateLevelCode: F,
	...pathSegments: S
) {
	return packagePathBuilder("fcc", "scratch", stateLevelCode, ...pathSegments)
}
