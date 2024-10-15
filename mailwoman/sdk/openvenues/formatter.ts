/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import FragariaAddress, {
	AliasInputTypes,
	AttentionInputType,
	CommonOptions as FragariaOptions,
	PrimaryInputTypes,
} from "@fragaria/address-formatter"
import { OpenVenuesAddressCollection, OpenVenuesAddressComponent, OpenVenuesAddressRecord } from "./address.js"

export type FragariaInput = AttentionInputType | PrimaryInputTypes | AliasInputTypes

export const OpenVenuesAddressComponentToFragariaInput = {
	building: "building",
	city_district: "cityDistrict",
	city: "city",
	country_region: "region",
	country: "country",
	entrance: null,
	house_number: "houseNumber",
	house: "house",
	island: "island",
	level: null,
	metro_station: null,
	phone: null,
	po_box: null,
	postcode: "postcode",
	road: "road",
	staircase: null,
	state_district: null,
	state: "state",
	suburb: "suburb",
	unit: null,
	website: null,
	world_region: null,
} as const satisfies Record<OpenVenuesAddressComponent, FragariaInput | null>

export type FragariaAddressRecord = Partial<Record<FragariaInput, string>>

/**
 * Converts an address from OpenVenues into a format that can be used by Fragaria.
 */
export function convertToFragariaAddressRecord(
	openVenuesAddressRecord: OpenVenuesAddressRecord | OpenVenuesAddressCollection
): FragariaAddressRecord {
	const convertedAddressRecord: FragariaAddressRecord = {}

	if (Array.isArray(openVenuesAddressRecord)) {
		for (const { label, value } of openVenuesAddressRecord) {
			const fragariaInput = OpenVenuesAddressComponentToFragariaInput[label]

			if (fragariaInput) {
				if (!convertedAddressRecord[fragariaInput]) {
					convertedAddressRecord[fragariaInput] = ""
				}

				convertedAddressRecord[fragariaInput] += value
			}
		}
	} else {
		for (const [component, values] of Object.entries(openVenuesAddressRecord) as [
			OpenVenuesAddressComponent,
			string[],
		][]) {
			const fragariaInput = OpenVenuesAddressComponentToFragariaInput[component]

			if (fragariaInput) {
				convertedAddressRecord[fragariaInput] = values.join(" ")
			}
		}
	}

	return convertedAddressRecord
}

/**
 * Formats an address from OpenVenues into a format that can be used by Fragaria.
 */
export function formatOpenVenuesAddress(
	input: OpenVenuesAddressRecord | OpenVenuesAddressCollection,
	options?: FragariaOptions
): string[] {
	const convertedAddressRecord = convertToFragariaAddressRecord(input)

	return FragariaAddress.format(convertedAddressRecord, {
		abbreviate: true,
		output: "array",
		...options,
	}).map((line) => line.toUpperCase())
}
