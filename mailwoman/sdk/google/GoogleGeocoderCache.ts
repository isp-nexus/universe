/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { HTTPCacheDataSource } from "@isp.nexus/sdk/caching/HTTPCacheDataSource"

/**
 * An HTTP cache enhanced for Google API responses.
 */
export class GoogleHTTPCache extends HTTPCacheDataSource {
	public override async ready(): Promise<this> {
		await super.ready()

		const { tableName } = this

		await this.query(/* sql */ `
			CREATE TEMP VIEW IF NOT EXISTS ${tableName}_introspection AS
			SELECT * FROM "${tableName}" LIMIT 0;
		`)

		const columnInfoRows = await this.query<Array<{ name: string }>>(/* sql*/ `
			PRAGMA table_info(${tableName}_introspection);
		`)

		const existingColumns = new Set(columnInfoRows.map((row) => row.name))

		if (!existingColumns.has("geocoder_input_address")) {
			await this.query(/* sql */ `
				ALTER TABLE ${tableName}
					ADD COLUMN 'geocoder_input_address' TEXT
					AS (request_params -> 'address') VIRTUAL;
			`)

			await this.query(/* sql */ `
				CREATE INDEX IF NOT EXISTS "${tableName}_geocoder_input_address_idx"	ON ${tableName}
					(geocoder_input_address);
			`)
		}

		if (!existingColumns.has("geocoder_input_lat_lng")) {
			await this.query(/* sql */ `
				ALTER TABLE ${tableName}
					ADD COLUMN 'geocoder_input_lat_lng' TEXT
					AS (
						iif(
							request_params -> 'latlng' IS NOT NULL,
							concat('[', request_params -> 'latlng', ']'),
							NULL
						)
					) VIRTUAL;
			`)

			await this.query(/* sql */ `
				CREATE INDEX IF NOT EXISTS "${tableName}geocoder_input_lat_lng_idx"	ON ${tableName}
					(geocoder_input_lat_lng);
			`)
		}

		if (!existingColumns.has("geocoder_results")) {
			await this.query(/* sql */ `
				ALTER TABLE ${tableName}
					ADD COLUMN 'geocoder_results' TEXT AS (
						iif(
							request_url IS '"https://maps.googleapis.com/maps/api/geocode/json"',
							storage_value -> 'data' -> 'data' -> 'results',
							NULL
						)
					) VIRTUAL;
			`)

			await this.query(/* sql */ `
				CREATE INDEX IF NOT EXISTS "${tableName}_geocoder_results_idx"	ON ${tableName}
					(geocoder_results);
			`)
		}

		if (!existingColumns.has("place_details")) {
			await this.query(/* sql */ `
				ALTER TABLE ${tableName}
					ADD COLUMN 'place_details' TEXT AS (
						iif(
							request_url IS '"https://maps.googleapis.com/maps/api/place/details/json"',
							storage_value -> 'data' -> 'data' -> 'result',
							NULL
						)
					) VIRTUAL;
			`)

			await this.query(/* sql */ `
				CREATE INDEX IF NOT EXISTS "${tableName}_place_details_idx"	ON ${tableName}
					(place_details);
			`)
		}

		// SELECT geocoder_input_address, value -> 'formatted_address', value -> 'geometry' -> 'location'   from google_geocoder_http_requests, json_each(google_geocoder_http_requests.geocoder_results)

		return this
	}
}
