/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { NexusDataSource } from "@isp.nexus/sdk/data"
import { DataSourceFile, dataSourcePathBuilder } from "@isp.nexus/sdk/runtime"
import { packageOutPathBuilder } from "@isp.nexus/sdk/runtime/repo-paths"
import { PostalAddressSchema } from "./PostalAddressSchema.js"

/**
 * Postal data source.
 *
 * @singleton
 */
export const $PostalDataSource = ServiceRepository.register(
	() =>
		new NexusDataSource({
			displayName: "Postal",
			storagePath: dataSourcePathBuilder("postal", DataSourceFile.SQLite3),
			migrations: packageOutPathBuilder("mailwoman", "sdk", "postal", "migrations"),

			entities: [
				// ---
				PostalAddressSchema,
			],
		})
)
