/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { similarity } from "talisman/metrics/identity.js"
import mongeElkan from "talisman/metrics/monge-elkan.js"

/**
 * The address components recognized by OpenVenues' address parser.
 *
 * @see {@link https://github.com/openvenues/libpostal/blob/8f2066b1d30f4290adf59cacc429980f139b8545/src/address_parser.h libpostal/src/address_parser.h}
 */
export type OpenVenuesAddressComponent =
	| "building"
	| "city_district"
	| "city"
	| "country_region"
	| "country"
	| "entrance"
	| "house_number"
	| "house"
	| "island"
	| "level"
	| "metro_station"
	| "phone"
	| "po_box"
	| "postcode"
	| "road"
	| "staircase"
	| "state_district"
	| "state"
	| "suburb"
	| "unit"
	| "website"
	| "world_region"

export interface OpenVenuesAddressEntry {
	label: OpenVenuesAddressComponent
	value: string
}

export type OpenVenuesAddressCollection = OpenVenuesAddressEntry[]

export type OpenVenuesAddressRecord = {
	[AddressComponent in OpenVenuesAddressComponent]?: string[]
}

export function convertParsedAddressCollectionToRecord(input: OpenVenuesAddressCollection): OpenVenuesAddressRecord {
	const output: OpenVenuesAddressRecord = {}

	for (const { label, value } of input) {
		if (!output[label]) {
			output[label] = []
		}

		output[label]!.push(value)
	}

	return output
}

const OpenVenuesAddressComponentGranularity = [
	"unit",
	"building",
	"house_number",
	"road",
	"suburb",
	"postcode",
	"city_district",
	"city",
	"state_district",
	"state",
	"country_region",
	"country",
] as const satisfies readonly OpenVenuesAddressComponent[]

type OpenVenuesAddressComponentGranularity = (typeof OpenVenuesAddressComponentGranularity)[number]

const OpenVenuesAddressComponentGranularityIndex = OpenVenuesAddressComponentGranularity.reduce(
	(index, component, i) => {
		index[component] = i
		return index
	},
	{} as Record<OpenVenuesAddressComponent, number>
)

function isGranularityComponent(input: string): input is OpenVenuesAddressComponentGranularity {
	return Object.hasOwn(OpenVenuesAddressComponentGranularityIndex, input)
}

/**
 * Given a set of address component keys, retain only those of equal or lesser granularity.
 *
 * This is useful for comparing addresses at a similar level of detail, discarding components which
 * are too specific to be useful.
 *
 * @returns An array of address component keys, the first entry being the most precise.
 */
function compareGranularity(left: OpenVenuesAddressComponent, right: OpenVenuesAddressComponent): number {
	return OpenVenuesAddressComponentGranularityIndex[left] - OpenVenuesAddressComponentGranularityIndex[right]
}

export const OpenVenuesAddressComponentWeight = {
	building: 1,
	city_district: 1,
	city: 1,
	country_region: 0.5,
	country: 0.5,
	entrance: 0.2,
	house_number: 1,
	house: 1,
	island: 0.5,
	level: 0.8,
	metro_station: 0,
	phone: 0,
	po_box: 0.25,
	postcode: 1,
	road: 0.8,
	staircase: 0.8,
	state_district: 1,
	state: 1,
	suburb: 0.25,
	unit: 1,
	website: 0,
	world_region: 0,
} as const satisfies Record<OpenVenuesAddressComponent, number>

export type OpenVenuesAddressComponentWeighted = typeof OpenVenuesAddressComponentWeight

export type OpenVenuesAddressMeasurementRecord = {
	[AddressComponent in OpenVenuesAddressComponent]?: number
}

export interface OpenVenuesAddressMeasurementResult {
	measurements: OpenVenuesAddressMeasurementRecord
	weightedMeasurements: OpenVenuesAddressMeasurementRecord
	maxGranularity: OpenVenuesAddressComponentGranularity | null
	minGranularity: OpenVenuesAddressComponentGranularity | null
	weightedSimilarity: number
	meidanSimilarity: number
}

export function calculateAddressSimilarity(
	left: OpenVenuesAddressRecord,
	right: OpenVenuesAddressRecord
): OpenVenuesAddressMeasurementResult | null {
	const measurements: OpenVenuesAddressMeasurementRecord = {}
	const weightedMeasurements: OpenVenuesAddressMeasurementRecord = {}

	const leftKeys = Object.keys(left).filter(isGranularityComponent).sort(compareGranularity)
	const leftGranularity = leftKeys[0]

	const rightKeys = Object.keys(right).filter(isGranularityComponent).sort(compareGranularity)
	const rightGranularity = rightKeys[0]

	if (!leftGranularity || !rightGranularity) return null

	const commonGranularity = Math.max(
		...[leftGranularity, rightGranularity].map((granularity) => OpenVenuesAddressComponentGranularityIndex[granularity])
	)

	const componentKeys = Array.from(new Set([...leftKeys, ...rightKeys])).filter(
		(key) => OpenVenuesAddressComponentGranularityIndex[key] >= commonGranularity
	)

	if (componentKeys.length === 0) {
		return {
			measurements,
			weightedMeasurements,
			weightedSimilarity: 0,
			meidanSimilarity: 0,
			maxGranularity: null,
			minGranularity: null,
		}
	}

	const maxGranularity = componentKeys[0] || null
	const minGranularity = componentKeys[componentKeys.length - 1] || null

	// Find the similarity between each component of the addresses...
	for (const componentKey of componentKeys) {
		const weight = OpenVenuesAddressComponentWeight[componentKey] ?? 0
		const leftValues = left[componentKey] ?? []
		const rightValues = right[componentKey] ?? []

		const measurement = mongeElkan(similarity, leftValues.join(" "), rightValues.join(" "))
		measurements[componentKey] = measurement
		weightedMeasurements[componentKey] = measurement * weight
	}

	let weightedSimilarity = 0

	// Calculate the weighted mean similarity between the addresses...
	for (const componentKey of componentKeys) {
		const weight = OpenVenuesAddressComponentWeight[componentKey] ?? 0

		// if (weight === 0) continue

		weightedSimilarity += measurements[componentKey]! * weight
	}

	weightedSimilarity /= Object.keys(measurements).length

	// Calculate the median similarity between the addresses...
	const values = Object.values(measurements)
	values.sort()

	const meidanSimilarity = values[Math.floor(values.length / 2)]!

	return {
		measurements,
		weightedMeasurements,
		weightedSimilarity,
		meidanSimilarity,
		maxGranularity,
		minGranularity,
	}
}

mongeElkan(similarity, "a", "b")
