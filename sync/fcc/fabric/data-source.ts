/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { DataSourceFile, dataSourcePathBuilder, NexusDataSource } from "@isp.nexus/sdk"
import { packageOutPathBuilder } from "@isp.nexus/sdk/reflection"

export const FabricDataSourcePath = dataSourcePathBuilder("fabric", DataSourceFile.SQLite3)

/**
 * FCC Fabric data source.
 *
 * @singleton
 */
export const $FabricDataSource = ServiceRepository.register(
	() =>
		new NexusDataSource({
			displayName: "BDC",
			storagePath: dataSourcePathBuilder("fabric", DataSourceFile.SQLite3),
			migrations: packageOutPathBuilder("sync", "fcc", "fabric", "migrations"),

			wal: true,
			pragmas: {
				// auto_vacuum: "INCREMENTAL",
				synchronous: "OFF",
				page_size: 4096,
				cache_size: 10000,
			},
			// entities: [
			// 	// ---
			// 	PostalAddressSchema,
			// ],
		})
)
