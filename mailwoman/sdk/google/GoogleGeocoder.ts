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
import { APIClient, APIClientConfig, assertOptionalKeyPresent, pick, pluckResponseData } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { PostalAddress, formatAddressFromParts } from "@isp.nexus/mailwoman"
import { HTTPCacheDataSource } from "@isp.nexus/sdk/caching/HTTPCacheDataSource"
import { $private, DataSourceFile } from "@isp.nexus/sdk/runtime"
import {
	GeoPoint,
	GeoPointInput,
	GooglePlaceID,
	H3Cell,
	cellToPointLiteral,
	isGooglePlaceID,
	isH3Cell,
} from "@isp.nexus/spatial"
import { AxiosRequestConfig } from "axios"
import { CacheRequestConfig } from "axios-cache-interceptor"
import { PathBuilder } from "path-ts"
import { GoogleHTTPCache } from "./GoogleGeocoderCache.js"
import { parseGoogleGeocodeResult } from "./parser.js"

export interface GoogleGeocoderOptions extends APIClientConfig {
	/**
	 * The Google Maps API key.
	 */
	apiKey: string
}

/**
 * A Google Geocoder client.
 */
export class GoogleGeocoder extends APIClient {
	/**
	 * The Google Maps API client.
	 */
	#client: GoogleMapsClient

	/**
	 * The Google Maps API key.
	 */
	#apiKey: string

	constructor({ apiKey, ...apiOptions }: GoogleGeocoderOptions) {
		super(apiOptions)

		this.#apiKey = apiKey

		this.#client = new GoogleMapsClient({
			axiosInstance: this.axios as any, // Fixes outdated type definitions
		})
	}

	public override toString(): string {
		return "Google Geocoder"
	}

	/**
	 * @internal
	 */
	protected pluckGeocodeResult = (data: GeocodeResponseData): PostalAddress[] => {
		this.logger.debug(`Found ${data.results.length} results.`)

		if (!data.results.length)
			throw ResourceError.from(404, "No results found", "google", "geocoder", "pluckGeocodeResult")

		return data.results.map(parseGoogleGeocodeResult)
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

		this.logger.debug(`⛳️🕵️‍♀️ Fetching place details (${input})...`)

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
					// "opening_hours",
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
	public geocodePlaceID(input: GooglePlaceID | string, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]> {
		if (!isGooglePlaceID(input))
			throw ResourceError.from(400, `Invalid input ${input}`, "google", "geocoder", "geocodePlaceID")

		this.logger.info(`⛳️ Geocoding place ID (${input})...`)

		return this.#client
			.geocode({
				params: {
					key: this.#apiKey,
					place_id: input,
				},
				...(requestConfig as any),
			})
			.then(pluckResponseData)
			.then(this.pluckGeocodeResult)
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to geocode place ID ${input}`)
			})
	}
	/**
	 * Reverse geocode a geographic point, e.g. a latitude and longitude.
	 */
	public geocodePoint(input: unknown, requestConfig?: Partial<AxiosRequestConfig>): Promise<PostalAddress[]> {
		const geoPoint = GeoPoint.from(input)

		if (!geoPoint) throw ResourceError.from(400, `Invalid input ${input}`)

		this.logger.info(`🌐 Geocoding point (${geoPoint})...`)

		return this.#client
			.reverseGeocode({
				params: {
					key: this.#apiKey,
					latlng: geoPoint.toGoogleLatLngLiteral(),
				},

				...(requestConfig as any),
			})
			.then(pluckResponseData)
			.then(this.pluckGeocodeResult)
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to geocode point ${geoPoint}`)
			})
	}

	public geocodeAddress(input: string | PostalAddress, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]> {
		const formattedAddress = typeof input === "string" ? input : formatAddressFromParts(input)

		this.logger.debug(`🌎 Geocoding address (${formattedAddress})...`)

		return this.#client
			.geocode({
				params: {
					key: this.#apiKey,
					address: formattedAddress,
					bounds: {
						// A rough bounding box around the contiguous United States.
						northeast: {
							lng: -64.13086408320487,
							lat: 49.53178728159759,
						},
						southwest: {
							lng: -124.82956037316481,
							lat: 25.341844536880345,
						},
					},
					language: "en-US",
				},
				...(requestConfig as any),
			})
			.then(pluckResponseData)
			.then(this.pluckGeocodeResult)
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to geocode address ${formattedAddress}`)
			})
	}

	public async geocode(coordinate: GeoPointInput, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(placeID: GooglePlaceID, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(cell: H3Cell, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(formattedAddress: string, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(input: unknown, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(input: unknown, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]> {
		if (!input) throw ResourceError.from(400, "Input must be present", "geocoding", "geocode")

		if (typeof input !== "string") {
			throw ResourceError.from(400, `Invalid input ${input}`, "geocoding", "geocode")
		}
		if (isH3Cell(input)) {
			return this.geocodePoint(cellToPointLiteral(input), requestConfig)
		}

		if (isGooglePlaceID(input)) return this.geocodePlaceID(input, requestConfig)

		const point = GeoPoint.from(input)
		if (point) return this.geocodePoint(input, requestConfig)

		return this.geocodeAddress(input, requestConfig)
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
export const $GoogleGeocoder = ServiceRepository.register(async () => {
	const omissions = new Set(Object.values($private))

	assertOptionalKeyPresent($private, "SDK_GOOGLE_MAPS_API_KEY")
	assertOptionalKeyPresent($private, "NEXUS_HTTP_CACHE_PATH")

	const httpCacheDataSource = await new GoogleHTTPCache({
		storagePath: PathBuilder.from($private.NEXUS_HTTP_CACHE_PATH, DataSourceFile.SQLite3),
		namespace: "google_geocoder",
		omissions,
	}).ready()

	return new GoogleGeocoder({
		displayName: "Google Geocoder Service",
		apiKey: $private.SDK_GOOGLE_MAPS_API_KEY,
		caching: {
			generateKey: HTTPCacheDataSource.generateCacheKey,

			storage: httpCacheDataSource.toAxiosStorage(),
			// We don't need to interpret the header since our cache will automatically
			// expire on outdated data.
			interpretHeader: false,
			// Addresses are unlikely to change while we're working with them,
			// so we can cache them for a week in milliseconds.
			ttl: 1000 * 60 * 60 * 24 * 7,
		},
	})
})
