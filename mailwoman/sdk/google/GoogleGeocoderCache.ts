/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { HTTPCacheDataSource } from "@isp.nexus/sdk/caching/HTTPCacheDataSource"

export const CommonGoogleCacheColumnNames = [
	"latitude",
	"longitude",
	"formatted_address",
	"place_id",
	"plus_code",
	"address_components",
	"api_operation",
	"api_response",
	"cache_key",
	"created_at",
	"input_address",
	"input_latitude",
	"input_longitude",
	"input_place_id",
	"input_idx",
] as const
export type CommonGoogleCacheColumnName = (typeof CommonGoogleCacheColumnNames)[number]

/**
 * The columns of the Google Places API cache.
 */
export const PlacesColumnNames = [
	"place_name",
	"place_types",
	"place_phone_number",
	"place_business_status",
	"place_website",
	"place_rating",
] as const
export type PlacesColumnName = (typeof PlacesColumnNames)[number]

/**
 * The columns of the Google Geocoder API cache.
 */
export const GeocoderColumnNames = ["partial_match"] as const
export type GeocoderColumnName = (typeof GeocoderColumnNames)[number]

export const GoogleCacheColumnNames = [
	...CommonGoogleCacheColumnNames,
	...PlacesColumnNames,
	...GeocoderColumnNames,
] as const
/**
 * The columns of the Google Geocoder cache.
 */
export type GoogleCacheColumnName = (typeof GoogleCacheColumnNames)[number]

/**
 * An HTTP cache enhanced for Google API responses.
 */
export class GoogleHTTPCache extends HTTPCacheDataSource {
	protected existingColumns: Set<GoogleCacheColumnName> | null = null

	protected async refreshColumnNames(): Promise<Set<GoogleCacheColumnName>> {
		const columnInfoRows = await this.tableInfo<GoogleCacheColumnName>(this.tableName)

		this.existingColumns = new Set<GoogleCacheColumnName>(columnInfoRows.map((row) => row.name))

		return this.existingColumns
	}

	protected async createGeocoderColumn(columnName: GoogleCacheColumnName, sql: string): Promise<void> {
		const existingColumns = this.existingColumns || (await this.refreshColumnNames())

		if (existingColumns.has(columnName)) return

		await this.query(/* sql */ `
			ALTER TABLE '${this.tableName}'
				ADD COLUMN '${columnName}' TEXT
				AS (${sql}) VIRTUAL;
		`)

		existingColumns!.add(columnName)

		await this.query(/* sql */ `
			CREATE INDEX IF NOT EXISTS '${this.tableName}_${columnName}_idx'	ON ${this.tableName}
				('${columnName}');
		`)
	}

	public override async ready(): Promise<this> {
		await super.ready()

		const columnSchemas: [GoogleCacheColumnName, string][] = [
			["input_idx", /* sql */ `CAST(request_headers ->> 'x-nexus-cache-idx' as INTEGER)`],
			["input_address", /* sql */ `request_params ->> 'address'`],
			["input_place_id", /* sql */ `request_params ->> 'place_id'`],
			["input_latitude", /* sql */ `request_params -> 'latlng' ->> 'lat'`],
			["input_longitude", /* sql */ `request_params -> 'latlng' ->> 'lng'`],

			[
				"api_operation",
				/* sql */ `
				CASE request_url
				WHEN 'https://maps.googleapis.com/maps/api/geocode/json' THEN 'geocode'
				WHEN 'https://maps.googleapis.com/maps/api/place/details/json' THEN 'place_details'
				ELSE NULL
				END
				`,
			],

			[
				// ---
				"api_response",
				/* sql */ `
				CASE	api_operation
				WHEN	'geocode'				THEN	storage_value -> 'data' -> 'data' -> 'results' -> 0
				WHEN	'place_details'	THEN	storage_value -> 'data' -> 'data' -> 'result'
				ELSE	storage_value -> 'data' -> 'data'
				END`,
			],

			["partial_match", /* sql */ `api_response ->> 'partial_match'`],

			["formatted_address", /* sql */ `api_response ->> 'formatted_address'`],

			["place_id", /* sql */ `api_response ->> 'place_id'`],

			["plus_code", /* sql */ `api_response -> 'plus_code' ->> 'global_code'`],

			["latitude", /* sql */ `CAST(api_response -> 'geometry' -> 'location' ->> 'lat' AS REAL)`],

			["longitude", /* sql */ `CAST(api_response -> 'geometry' -> 'location' ->> 'lng' AS REAL)`],

			["address_components", /* sql */ `api_response -> 'address_components'`],

			["place_website", /* sql */ `api_response ->> 'website'`],
			["place_name", /* sql */ `api_response ->> 'name'`],
			["place_business_status", /* sql */ `api_response ->> 'business_status'`],
			["place_phone_number", /* sql */ `api_response ->> 'international_phone_number'`],
			["place_rating", /* sql */ `api_response ->> 'rating'`],
			["place_types", /* sql */ `api_response -> 'types'`],
		]

		for (const [columnName, sql] of columnSchemas) {
			await this.createGeocoderColumn(columnName, sql)
		}

		await this.query(/* sql */ `
			CREATE VIEW IF NOT EXISTS google_api AS
			SELECT
				${GoogleCacheColumnNames.join(",\n")}
			FROM ${this.tableName}
		`)

		await this.query(/* sql */ `
			CREATE VIEW IF NOT EXISTS geocoder_api AS
			SELECT
			${[...CommonGoogleCacheColumnNames, ...GeocoderColumnNames].join(",\n")}
			FROM google_api
			WHERE api_operation = 'geocode'
		`)

		await this.query(/* sql */ `
			CREATE VIEW IF NOT EXISTS places_api AS
			SELECT
			${[...CommonGoogleCacheColumnNames, ...PlacesColumnNames].join(",\n")}
			FROM google_api
			WHERE api_operation = 'place_details'
		`)

		await this.query(/* sql */ `
			CREATE VIEW IF NOT EXISTS spatial_insights AS
			SELECT
				${[
					// ---
					...CommonGoogleCacheColumnNames,
					...GeocoderColumnNames,
				]
					.map((columnName) => `geocoder.${columnName}`)
					.join(",\n")},

				${PlacesColumnNames.map((columnName) => `p.${columnName}`).join(",\n")}
			FROM geocoder_api geocoder
			FULL JOIN places_api p ON p.place_id = geocoder.place_id`)

		return this
	}
}
