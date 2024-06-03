/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { BroadbandServicableLocationID, BroadbandTechnologyCode, ProviderID } from "@isp.nexus/fcc"
import { LineDelimitedCharacter } from "@isp.nexus/sdk/files"
import { CensusBlockAvailabilityRecord } from "./block-aggregator.js"

/**
 * Given a buffer containing CSV data, yield each line as an availability record.
 */
export function* takeAvailabilityLine(
	csvBuffer: Buffer,
	providerID: ProviderID
): Iterable<CensusBlockAvailabilityRecord> {
	// First, we need to skip the header row.
	let byteIndex = csvBuffer.indexOf(LineDelimitedCharacter.Newline) + 1
	const contentDelimiters = new Uint32Array(12) // 12 columns
	contentDelimiters[0] = byteIndex
	let delimiterIndex = 1
	let doubleQuoteCount = 0

	while (byteIndex < csvBuffer.length) {
		const byte = csvBuffer[byteIndex]

		if (byte === LineDelimitedCharacter.DoubleQuote) {
			doubleQuoteCount++
		}

		if (byte === LineDelimitedCharacter.Comma && doubleQuoteCount % 2 === 0) {
			contentDelimiters[delimiterIndex] = byteIndex

			delimiterIndex++
		}

		if (byte === LineDelimitedCharacter.Newline) {
			contentDelimiters[delimiterIndex] = LineDelimitedCharacter.Newline
			const slices: Buffer[] = []

			// We start at index 2 to avoid the two first unused columns.
			for (let i = 3; i < contentDelimiters.length; i++) {
				const start = contentDelimiters[i]! + 1
				const end = contentDelimiters[i + 1]!

				slices.push(csvBuffer.subarray(start, end))
			}

			const record: CensusBlockAvailabilityRecord = {
				provider_id: providerID,
				location_id: parseInt(slices[0]!.toString(), 10) as BroadbandServicableLocationID,
				technology_code: parseInt(slices[1]!.toString(), 10) as BroadbandTechnologyCode,
				max_advertised_download_speed: parseInt(slices[2]!.toString(), 10),
				max_advertised_upload_speed: parseInt(slices[3]!.toString(), 10),
				low_latency: slices[4]![0] === LineDelimitedCharacter.One,
				business_residential_code: slices[5]![0]!,
				geoid: slices[7]!,
			}

			yield record
			delimiterIndex = 1
			doubleQuoteCount = 0
		}

		byteIndex++
	}
}
