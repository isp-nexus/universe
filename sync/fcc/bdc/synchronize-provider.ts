/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { BroadbandServicableLocationID, BroadbandTechnologyCode } from "@isp.nexus/fcc"
import { ParquetReader } from "@isp.nexus/sdk"
import { FIPSBlockGeoID } from "@isp.nexus/tiger"
import { CensusBlockAvailabilityRecord } from "./block-aggregator.js"
import { BDCFile, BDCFilingDataType } from "./common.js"

export interface SynchronizeProviderEntryParams {
	entry: BDCFile
	dataType?: BDCFilingDataType
	skipCache?: boolean
}

const Decoder = new TextDecoder()

export interface BlockAvailabilityStatistics {
	blockIDs: ReadonlySet<FIPSBlockGeoID>
	locationIDs: ReadonlySet<BroadbandServicableLocationID>
	technologyCodes: ReadonlySet<BroadbandTechnologyCode>
	speeds: ReadonlyArray<[number, number]>
	recordCount: number
}

export async function collectBlockAvailabilityStatistics(
	reader: ParquetReader<CensusBlockAvailabilityRecord>
): Promise<BlockAvailabilityStatistics> {
	const blockIDs = new Set<FIPSBlockGeoID>()
	const locationIDs = new Set<BroadbandServicableLocationID>()
	const technologyCodes = new Set<BroadbandTechnologyCode>()
	const speeds = new Set<string>()

	for await (const {
		geoid: geoIDEncoded,
		location_id,
		technology_code,
		max_advertised_download_speed,
		max_advertised_upload_speed,
	} of reader) {
		locationIDs.add(location_id)
		technologyCodes.add(technology_code)

		speeds.add(JSON.stringify([max_advertised_download_speed, max_advertised_upload_speed]))

		if (geoIDEncoded) {
			const geoid = (typeof geoIDEncoded === "string" ? geoIDEncoded : Decoder.decode(geoIDEncoded)) as FIPSBlockGeoID

			blockIDs.add(geoid)
		}
	}

	return {
		blockIDs,
		locationIDs,
		technologyCodes,
		recordCount: blockIDs.size,
		speeds: [...speeds].map((speed) => JSON.parse(speed)),
	}
}
