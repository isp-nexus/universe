/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Google Geocoding schema.
 */

import {
	GeocodeResponseData,
	Status as GoogleAPIResponseStatus,
	Client as GoogleMapsClient,
	PlaceData,
} from "@googlemaps/google-maps-services-js"
import { pick, pluckResponseData } from "@isp.nexus/core"
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
	 * Fetch place details by Google Place ID.
	 *
	 * @param input - The Google Place ID.
	 *
	 * @returns The place details.
	 */
	public placeDetails(input: GooglePlaceID | string): Promise<Partial<PlaceData>> {
		if (!isGooglePlaceID(input))
			throw ResourceError.from(400, `Invalid input ${input}`, "google", "geocoder", "geocodePlaceID")

		logger.info(`⛳️🕵️‍♀️ Fetching place details (${input})...`)

		return this.#client
			.placeDetails({
				params: {
					key: this.#apiKey,
					place_id: input,
				},
			})
			.then(pluckResponseData)
			.then((data) => {
				if (data.status !== GoogleAPIResponseStatus.OK) {
					throw ResourceError.from(400, data.error_message, "google", "geocoder", "placeDetails")
				}

				const refined = pick<Partial<PlaceData>>(data.result, [
					"business_status",
					"editorial_summary",
					"international_phone_number",
					"name",
					"opening_hours",
					"permanently_closed",
					"price_level",
					"rating",
					"types",
					"url",
					"user_ratings_total",
					"utc_offset",
					"vicinity",
					"website",
				])

				return refined
			})
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to fetch place details for ID "${input}"`)
			})
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

		if (typeof input !== "string") {
			throw ResourceError.from(400, `Invalid input ${input}`, "geocoding", "geocode")
		}
		if (isH3Cell(input)) {
			return this.geocodePoint(cellToPointLiteral(input))
		}

		if (isGooglePlaceID(input)) return this.geocodePlaceID(input)

		const point = GeoPoint.from(input)
		if (point) return this.geocodePoint(input)

		return this.geocodeAddress(input)
	}

	[Symbol.asyncDispose](): Promise<void> {
		this.#abortionController.abort()

		return Promise.resolve()
	}
}

/**
 * Google Geocoder service, pre-configured with a runtime Google Maps API key.
 *
 * Note that while this instance may be used directly, higher-level operations are available via
 * `@isp.nexus/mailwoman/sdk`
 *
 * @singleton
 */
export const $GoogleGeocoder = ServiceRepository.register(GoogleGeocoder)
