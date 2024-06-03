/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Data archive path utilities.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { PathBuilder } from "@isp.nexus/sdk/reflection"
import { $private, assertOptionalKeyPresent } from "@isp.nexus/sdk/runtime"

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
}

/**
 * Valid data source files.
 *
 * @internal
 */
export enum DataSourceFile {
	SQLite3 = "index.sqlite3",
}

/**
 * Path builder relative to the package root.
 *
 * @internal
 */
export function dataSourcePathBuilder<S extends string[]>(...pathSegments: S) {
	assertOptionalKeyPresent($private, "DATA_SOURCE_PATH")

	if (pathSegments[0]?.startsWith("/")) {
		throw ResourceError.from(400, "Path segments must be relative to the data source root.")
	}

	return PathBuilder.from(
		// ---
		$private.DATA_SOURCE_PATH as "$DATA_SOURCE_PATH",
		DataSourceName.DataStore,
		...pathSegments
	)
}
