/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { JSONSchemaID } from "@isp.nexus/core"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { BroadbandTechnologyCode } from "@isp.nexus/fcc"
import { DataSourceFile, dataSourcePathBuilder, inferColumnIndexConfig, NexusDataSource } from "@isp.nexus/sdk"
import { packagePathBuilder } from "@isp.nexus/sdk/reflection"
import { AdminLevel1Code, FIPSBlockGeoID, FIPSStateCode, GeoIDPart } from "@isp.nexus/tiger"
import { EntitySchema } from "typeorm"
import { CensusBlockAvailabilityRecord } from "./block-aggregator.js"
import { BDCFile } from "./common.js"

/**
 * Path builder for a specific state and broadband provider.
 */
export function broadbandProviderStoragePathBuilder(stateCode: FIPSStateCode) {
	// return joinDataSourcePath(stateCode, "fcc", "bdc", DataSourceFile.SQLite3)
	return packagePathBuilder("fcc", "scratch", "bdc", stateCode, DataSourceFile.SQLite3)
}

export const $BDCFile = JSONSchemaID("BDCFile")
export type $BDCFile = typeof $BDCFile

/**
 * @internal
 */
export const BDCFileSchema = new EntitySchema<BDCFile>({
	name: $BDCFile.tableName,
	columns: {
		fileID: {
			primary: true,
			type: "int",
		},
		fileName: {
			type: "text",
		},
		fileType: {
			type: "text",
		},
		providerID: {
			type: "int",
		},
		providerName: {
			type: "text",
		},
		category: {
			type: "text",
		},
		subcategory: {
			type: "text",
		},
		stateCode: {
			type: "text",
			length: 2,
		},
		technologyCodes: {
			type: "text",
			nullable: true,
			transformer: {
				from: (value) => (value ? JSON.parse(value) : new Set()),
				to: (value: Set<BroadbandTechnologyCode> | null) => {
					if (value && value.size) return JSON.stringify(Array.from(value))

					return null
				},
			},
		},
		recordCount: {
			type: "int",
		},

		revision: {
			type: "datetime",
			createDate: true,
		},

		vintage: {
			type: "datetime",
		},

		synchronizedAt: {
			type: "datetime",
			nullable: true,
		},
	},
	indices: [
		inferColumnIndexConfig<BDCFile>("fileID"),
		inferColumnIndexConfig<BDCFile>("fileType"),
		inferColumnIndexConfig<BDCFile>("providerID"),
		inferColumnIndexConfig<BDCFile>("technologyCodes"),
		inferColumnIndexConfig<BDCFile>("vintage"),
		inferColumnIndexConfig<BDCFile>("revision"),
		inferColumnIndexConfig<BDCFile>("recordCount"),
		inferColumnIndexConfig<BDCFile>("synchronizedAt"),
	],
})

export const $BSLAvailability = JSONSchemaID("BSLAvailability")
export type $BSLAvailability = typeof $BSLAvailability

export interface BSLAvailability extends Omit<CensusBlockAvailabilityRecord, "geoid"> {
	geoid: FIPSBlockGeoID
	vintage: Date
	revision: Date
	[GeoIDPart.State]: AdminLevel1Code
}
/**
 * TypeORM entity schema for a broadband provider.
 *
 * @internal
 */
export const BSLAvailabilitySchema = new EntitySchema<BSLAvailability>({
	name: $BSLAvailability.tableName,

	columns: {
		state_code: {
			type: "integer",
			primary: true,
		},
		provider_id: {
			type: "integer",
			primary: true,
		},
		location_id: {
			type: "integer",
			primary: true,
		},
		technology_code: {
			type: "integer",
			primary: true,
		},
		business_residential_code: {
			type: "integer",
			primary: true,
		},
		max_advertised_download_speed: {
			type: "integer",
		},
		max_advertised_upload_speed: {
			type: "integer",
		},
		low_latency: {
			type: "boolean",
		},
		revision: {
			type: "date",
		},
		vintage: {
			type: "date",
		},
	},
	// indices: [
	// 	inferColumnIndexConfig<BSLAvailability>("providerID"),
	// 	inferColumnIndexConfig<BSLAvailability>("locationID"),
	// 	inferColumnIndexConfig<BSLAvailability>("frn"),
	// 	inferColumnIndexConfig<BSLAvailability>("maxAdvertisedDownloadSpeed"),
	// 	inferColumnIndexConfig<BSLAvailability>("maxAdvertisedUploadSpeed"),
	// 	inferColumnIndexConfig<BSLAvailability>("h3_cell"),
	// 	inferColumnIndexConfig<BSLAvailability>("businessResidentialCode"),
	// 	inferColumnIndexConfig<BSLAvailability>("GEOID"),
	// ],
})

export const BSLAvailabilityConflictPaths = Object.entries(BSLAvailabilitySchema.options.columns)
	.filter(([, column]) => column?.primary)
	.map(([columnName]) => columnName) as (keyof BSLAvailability)[]

export const BDCDataSourcePath = dataSourcePathBuilder("bdc", DataSourceFile.SQLite3)

/**
 * Broadband Data Collection (BDC) data source.
 *
 * @singleton
 */
export const $BDCDataSource = ServiceRepository.register(
	() =>
		new NexusDataSource({
			displayName: "BDC",
			storagePath: BDCDataSourcePath,
			wal: true,
			pragmas: {
				auto_vacuum: "INCREMENTAL",
				page_size: 4096,
				cache_size: 10000,
			},
			entities: [
				// ---
				BDCFileSchema,
				BSLAvailabilitySchema,
			],
		})
)
