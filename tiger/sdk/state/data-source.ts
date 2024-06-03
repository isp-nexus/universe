/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { DataSourceFile, dataSourcePathBuilder, NexusDataSource } from "@isp.nexus/sdk"
import { TIGERTabulatedBlockSchema } from "./TIGERTabulatedBlockEntity.js"

export const TIGERDataSourcePath = dataSourcePathBuilder("tiger", DataSourceFile.SQLite3)

export const $TIGERStateDataSource = ServiceRepository.register(
	() =>
		new NexusDataSource({
			displayName: "TIGER",
			storagePath: TIGERDataSourcePath,
			// migrationsPath: packageOutPathBuilder("tiger", "sdk", "state", "migrations"),
			entities: [
				// ---
				TIGERTabulatedBlockSchema,
			],
		})
)
