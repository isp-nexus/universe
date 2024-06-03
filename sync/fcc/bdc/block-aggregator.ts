/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import "@isp.nexus/core/polyfills/promises/withResolvers"

import { BroadbandServicableLocationID, BroadbandTechnologyCode, ProviderID } from "@isp.nexus/fcc"
import {
	createBloomFilters,
	createCLIProgressBar,
	ParquetReader,
	ParquetSchemaDefinition,
	ParquetWriter,
} from "@isp.nexus/sdk"
import { H3Cell, MultiPolygonLiteral } from "@isp.nexus/spatial"
import { wellKnownGeometryToGeoJSON } from "@isp.nexus/spatial/sdk"
import { AdminLevel1Code, AdminLevel1CodeToAbbreviation, FIPSBlockGeoID, StateAbbreviation } from "@isp.nexus/tiger"
import { findGeometryByBlockID } from "@isp.nexus/tiger/sdk"
import FastGlob from "fast-glob"
import { createWriteStream } from "node:fs"
import * as path from "node:path"
import { FIPSStateLevelPath } from "./path-builders.js"

/**
 * @internal
 */
export const RawBSLAvailabilityColumns = [] as const satisfies readonly string[]

export type RawBSLAvailabilityRow = [
	frn: string,
	provider_id: string,
	brand_name: string,
	location_id: string,
	technologyCode: string,
	max_advertised_download_speed: string,
	max_advertised_upload_speed: string,
	low_latency: string,
	business_residential_code: string,
	stateAbbreviation: StateAbbreviation,
	block_geoid: FIPSBlockGeoID,
	h3_res8_id: H3Cell,
]

export interface CensusBlockAvailabilityRecord {
	provider_id: ProviderID
	location_id: BroadbandServicableLocationID
	technology_code: BroadbandTechnologyCode
	max_advertised_download_speed: number
	max_advertised_upload_speed: number
	low_latency: boolean
	business_residential_code: number
	geoid: Uint8Array
}

export const CensusBlockAvailabilitySchema = {
	provider_id: { type: "UINT_32", encoding: "RLE", typeLength: 20 },
	location_id: { type: "UINT_32", encoding: "RLE", typeLength: 34 },
	technology_code: { type: "UINT_32", encoding: "RLE", typeLength: 7 },
	max_advertised_download_speed: { type: "UINT_32", encoding: "RLE", typeLength: 14 },
	max_advertised_upload_speed: { type: "UINT_32", encoding: "RLE", typeLength: 14 },
	low_latency: { type: "BOOLEAN", encoding: "RLE", typeLength: 1 },
	business_residential_code: { type: "UINT_16", encoding: "RLE", typeLength: 1 },
	geoid: { type: "FIXED_LEN_BYTE_ARRAY", encoding: "PLAIN", typeLength: 15, optional: true },
} as const satisfies ParquetSchemaDefinition<CensusBlockAvailabilityRecord>

export const CensusBlockAvailabilityFilters = createBloomFilters(CensusBlockAvailabilitySchema, [
	"provider_id",
	"technology_code",
	"max_advertised_download_speed",
	"max_advertised_upload_speed",
	"geoid",
])

export interface CensusBlockGeoFeatureProperties {
	geoid: FIPSBlockGeoID
	providerIDs: ProviderID[]
	locationIDs: BroadbandServicableLocationID[]
	technologyCodes: BroadbandTechnologyCode[]
	maxAdvertisedDownloadSpeed: number
	maxAdvertisedUploadSpeed: number
}

export interface CensusBlockGeoFeature {
	type: "Feature"
	geometry: MultiPolygonLiteral
	properties: CensusBlockGeoFeatureProperties
	id: number
}

export interface CensusBlockGeoFeatureCollection {
	type: "FeatureCollection"
	features: CensusBlockGeoFeature[]
}

/**
 * Opens a Parquet writer for a specific census block.
 *
 * This can be used to write availability data to a Parquet file.
 */
export async function openBlockAggregateWriter(
	stateCode: AdminLevel1Code,
	geoid: FIPSBlockGeoID
): Promise<ParquetWriter<CensusBlockAvailabilityRecord>> {
	const parquetFilePath = FIPSStateLevelPath(stateCode, "parquet", `${geoid}.parquet`)

	const nextHandle = await ParquetWriter.openFile<CensusBlockAvailabilityRecord>(
		CensusBlockAvailabilitySchema,
		parquetFilePath
	)

	return nextHandle
}

/**
 * Opens a Parquet reader for a specific census block.
 *
 * This can be used to read availability data from a Parquet file.
 */
export async function openBlockAggregateReader(
	stateCode: AdminLevel1Code,
	geoid: FIPSBlockGeoID
): Promise<ParquetReader<CensusBlockAvailabilityRecord>> {
	const parquetFilePath = FIPSStateLevelPath(stateCode, "parquet", `${geoid}.parquet`)

	const nextHandle = await ParquetReader.openFile<CensusBlockAvailabilityRecord>(parquetFilePath)

	return nextHandle
}

/**
 * Create a GeoJSON feature for a census block.
 *
 * @param geoid - The FIPS block geo ID.
 */
export async function createBlockGeoJSON(
	stateCode: AdminLevel1Code,
	geoid: FIPSBlockGeoID
): Promise<CensusBlockGeoFeature> {
	const reader = await openBlockAggregateReader(stateCode, geoid)

	const geometry = await findGeometryByBlockID(geoid).then((buffer) =>
		wellKnownGeometryToGeoJSON<MultiPolygonLiteral>(buffer)
	)

	const providerIDs = new Set<ProviderID>()
	const locationIDs = new Set<BroadbandServicableLocationID>()
	const technologyCodes = new Set<BroadbandTechnologyCode>()

	let maxAdvertisedDownloadSpeed = 0
	let maxAdvertisedUploadSpeed = 0

	for await (const record of reader) {
		const {
			// ---
			provider_id,
			location_id,
			technology_code,
			max_advertised_download_speed,
			max_advertised_upload_speed,
		} = record as CensusBlockAvailabilityRecord

		providerIDs.add(provider_id)
		locationIDs.add(location_id)
		technologyCodes.add(technology_code)

		maxAdvertisedDownloadSpeed = Math.max(maxAdvertisedDownloadSpeed, max_advertised_download_speed)
		maxAdvertisedUploadSpeed = Math.max(maxAdvertisedUploadSpeed, max_advertised_upload_speed)

		// progressBar.increment()
	}

	// await progressBar.dispose()

	await reader.dispose()

	return {
		type: "Feature",
		geometry,
		id: parseInt(geoid, 10),
		properties: {
			geoid,
			providerIDs: Array.from(providerIDs),
			locationIDs: Array.from(locationIDs),
			technologyCodes: Array.from(technologyCodes),
			maxAdvertisedDownloadSpeed,
			maxAdvertisedUploadSpeed,
		},
	}
}

/**
 * Write all census block availability data to a GeoJSON file.
 */
export async function writeStateBlockGeoJSON(stateCode: AdminLevel1Code, destinationPath: string): Promise<void> {
	const stateAbbreviation = AdminLevel1CodeToAbbreviation[stateCode]
	const blockFilePaths = await FastGlob(FIPSStateLevelPath(stateCode, "parquet", "*.parquet"))
	let blocksRemaining = blockFilePaths.length

	if (!blocksRemaining) return

	const progressBar = await createCLIProgressBar(
		{ total: blocksRemaining, displayName: `GeoJSON (${stateAbbreviation})` },
		{ stage: "Writing" }
	)

	const withResolvers = Promise.withResolvers<void>()

	const writeStream = createWriteStream(destinationPath)

	writeStream.on("finish", () => {
		progressBar.dispose().then(withResolvers.resolve)
	})

	writeStream.on("error", (error) => {
		progressBar.dispose().then(() => withResolvers.reject(error))
	})

	// writeStream.write(
	// 	[
	// 		// ---
	// 		`{`,
	// 		`\t"type": "FeatureCollection",`,
	// 		`\t"features": [`,
	// 	].join("\n")
	// )

	// TODO: we flush and lose block handles. We need to open them again.
	// const reader = await this..openReader(index.parquet)

	for (const filePath of blockFilePaths) {
		const geoid = path.basename(filePath, ".parquet") as FIPSBlockGeoID

		await createBlockGeoJSON(stateCode, geoid)
			.then((feature) => {
				writeStream.write(JSON.stringify(feature))
				--blocksRemaining

				// writeStream.write(blocksRemaining ? ",\n" : "\n")
				if (blocksRemaining) {
					writeStream.write("\n")
				}
			})
			.catch(withResolvers.reject)
			.finally(() => progressBar.increment())
	}

	// writeStream.write("]}")

	writeStream.end()

	return withResolvers.promise
}
