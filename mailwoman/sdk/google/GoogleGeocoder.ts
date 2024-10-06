/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Google Geocoding schema.
 */

import { GeocodeResponseData, Client as GoogleMapsClient } from "@googlemaps/google-maps-services-js"
import { pluckResponseData } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { PostalAddress, formatAddressFromParts, sanitizePostalAddress } from "@isp.nexus/mailwoman"
import { $private, assertOptionalKeyPresent } from "@isp.nexus/sdk/runtime"
import {
	GeoPoint,
	GeoPointInput,
	GooglePlaceID,
	H3Cell,
	cellToPointLiteral,
	isGooglePlaceID,
	isH3Cell,
} from "@isp.nexus/spatial"
import { parseGoogleGeocodeResult } from "./parser.js"

const logger = ConsoleLogger.withPrefix("Google Geocoder")

/**
 * @internal
 */
export function pluckGeocodeResult(data: GeocodeResponseData): PostalAddress[] {
	logger.info(`Found ${data.results.length} results.`)

	if (!data.results.length)
		throw ResourceError.from(404, "No results found", "google", "geocoder", "pluckGeocodeResult")

	return data.results.map(parseGoogleGeocodeResult)
}

export const $GoogleGeocoder = ServiceRepository.register(() => {
	return new GoogleGeocoder()
})

/**
 * A Google Geocoder client.
 */
export class GoogleGeocoder implements AsyncDisposable {
	#abortionController = new AbortController()

	/**
	 * The Google Maps API client.
	 */
	#client: GoogleMapsClient
	/**
	 * The Google Maps API key.
	 */
	#apiKey: string

	constructor() {
		assertOptionalKeyPresent($private, "SDK_GOOGLE_MAPS_API_KEY")
		this.#apiKey = $private.SDK_GOOGLE_MAPS_API_KEY
		this.#client = new GoogleMapsClient({
			config: {
				signal: this.#abortionController.signal,
			},
		})
	}

	public toString(): string {
		return "Google Geocoder"
	}

	/**
	 * Reverse geocode a Google Place ID.
	 */
	public geocodePlaceID(input: GooglePlaceID | string): Promise<PostalAddress[]> {
		if (!isGooglePlaceID(input))
			throw ResourceError.from(400, `Invalid input ${input}`, "google", "geocoder", "geocodePlaceID")

		logger.info(`⛳️ Geocoding place ID (${input})...`)

		return this.#client
			.geocode({
				params: {
					key: this.#apiKey,
					place_id: input,
				},
			})
			.then(pluckResponseData)
			.then(pluckGeocodeResult)
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to geocode place ID ${input}`)
			})
	}
	/**
	 * Reverse geocode a geographic point, e.g. a latitude and longitude.
	 */
	public geocodePoint(input: unknown): Promise<PostalAddress[]> {
		const geoPoint = GeoPoint.from(input)

		if (!geoPoint) throw ResourceError.from(400, `Invalid input ${input}`)

		logger.info(`🌐 Geocoding point (${geoPoint})...`)

		return this.#client
			.reverseGeocode({
				params: {
					key: this.#apiKey,
					latlng: geoPoint.toGoogleLatLngLiteral(),
				},
			})
			.then(pluckResponseData)
			.then(pluckGeocodeResult)
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to geocode point ${geoPoint}`)
			})
	}

	public geocodeAddress(input: string | PostalAddress): Promise<PostalAddress[]> {
		const formattedAddress = typeof input === "string" ? sanitizePostalAddress(input) : formatAddressFromParts(input)

		logger.info(`🌎 Geocoding address (${formattedAddress})...`)

		return this.#client
			.geocode({
				params: {
					key: this.#apiKey,
					address: formattedAddress,
				},
			})
			.then(pluckResponseData)
			.then(pluckGeocodeResult)
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to geocode address ${formattedAddress}`)
			})
	}

	public async geocode(coordinate: GeoPointInput): Promise<PostalAddress[]>
	public async geocode(placeID: GooglePlaceID): Promise<PostalAddress[]>
	public async geocode(cell: H3Cell): Promise<PostalAddress[]>
	public async geocode(formattedAddress: string): Promise<PostalAddress[]>
	public async geocode(input: unknown): Promise<PostalAddress[]>
	public async geocode(input: unknown): Promise<PostalAddress[]> {
		if (!input) throw ResourceError.from(400, "Input must be present", "geocoding", "geocode")

		if (typeof input === "string") {
			if (isH3Cell(input)) {
				return this.geocodePoint(cellToPointLiteral(input))
			}

			if (isGooglePlaceID(input)) return this.geocodePlaceID(input)

			return this.geocodeAddress(input)
		}

		return this.geocodePoint(input)
	}

	[Symbol.asyncDispose](): Promise<void> {
		this.#abortionController.abort()

		return Promise.resolve()
	}
}
