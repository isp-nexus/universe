/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { $private } from "@isp.nexus/sdk/runtime"
import { existsSync } from "fs"

/**
 * Typical locations for the Spatialite extension.
 */
enum SpatialiteLocation {
	UserLocal = "/usr/local/lib/mod_spatialite.dylib",
	Brew = "/opt/homebrew/opt/libspatialite/lib/mod_spatialite.dylib",
}

let cachedSpatialiteExtensionPath: string | null = null

/**
 * @returns The path to the Spatialite extension.
 * @throws {@link ResourceError} If the extension is not found.
 * @internal
 */
export function findSpatialiteExtensionPath(): string {
	if (cachedSpatialiteExtensionPath) return cachedSpatialiteExtensionPath

	const { SPATIALITE_EXTENSION_PATH } = $private

	if (SPATIALITE_EXTENSION_PATH && existsSync(SPATIALITE_EXTENSION_PATH)) {
		cachedSpatialiteExtensionPath = SPATIALITE_EXTENSION_PATH

		return SPATIALITE_EXTENSION_PATH
	}

	for (const spatialitePath of Object.values(SpatialiteLocation)) {
		if (!existsSync(spatialitePath)) continue
		cachedSpatialiteExtensionPath = spatialitePath

		return spatialitePath
	}

	if (SPATIALITE_EXTENSION_PATH) {
		throw ResourceError.from(
			417,
			`SPATIALITE_EXTENSION_PATH was set but not found at ${SPATIALITE_EXTENSION_PATH}`,
			"database-service",
			"invalid-spatialite-extension"
		)
	}

	throw ResourceError.from(417, "Spatialite extension not found", "database-service", "missing-spatialite-extension")
}
