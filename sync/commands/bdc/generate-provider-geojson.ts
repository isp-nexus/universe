/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { CommandHandler } from "@isp.nexus/sdk"
import { findCachedSpatialiteExtensionPath } from "@isp.nexus/sdk/runtime"
import { BDCDataSourcePath, FabricDataSourcePath } from "@isp.nexus/sync/fcc"
import { AdminLevel1Code, TIGERLevel } from "@isp.nexus/tiger"
import { TIGERDataSourcePath } from "@isp.nexus/tiger/sdk"
import * as fs from "node:fs/promises"
import { CommandBuilder } from "yargs"
import { $ } from "zx"
export const command = "generate-provider-geojson <providerID> <stateCode> [outputFile]"
export const describe = "Generate GeoJSON for a broadband provider."

interface CommandArgs {
	outputFile: string
	providerID: number
	stateCode: AdminLevel1Code
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	providerID: {
		describe: "The Broadband Provider ID",
		type: "number",
		demandOption: true,
		coerce: (value) => parseInt(value, 10),
		alias: "f",
	},
	stateCode: {
		describe: "FIPS State Code",
		type: "string",
		// coerce: (value) => parseInt(value, 10),
		demandOption: true,
		alias: "s",
		choices: Object.values(AdminLevel1Code),
	},
	outputFile: {
		describe: "The output file",
		type: "string",
		demandOption: true,
		alias: "o",
		normalize: true,
	},
}

export const handler: CommandHandler<CommandArgs> = async ({ providerID, stateCode, outputFile }) => {
	if (!outputFile.endsWith(".geojsons")) {
		throw ResourceError.from(400, "Output file must be a newline-delimited JSON file.")
	}

	if (providerID < 0) {
		throw ResourceError.from(400, "Provider ID must be a positive integer.")
	}

	ConsoleLogger.info(`Generating GeoJSON for provider ${providerID} in state ${stateCode}...`)
	const spatialiteLocation = findCachedSpatialiteExtensionPath()

	const template = /* sql */ `
		SELECT load_extension('${spatialiteLocation}');

		ATTACH DATABASE 'file:${FabricDataSourcePath}?mode=ro' AS fabric;
		ATTACH DATABASE 'file:${TIGERDataSourcePath}?mode=ro' AS tiger;
		ATTACH DATABASE 'file:${BDCDataSourcePath}?mode=ro' AS bdc;

		CREATE TEMP VIEW 'broadband_servicable_location' AS
		SELECT
			bsl.provider_id,
			bsl.location_id,
			bsl.technology_code,
			bsl.business_residential_code,
			bsl.max_advertised_download_speed,
			bsl.max_advertised_upload_speed,
			bsl.low_latency,
			bsl.revision,
			bsl.vintage,
			tabblock20.GEOID,
			tabblock20.state_code,
			tabblock20.county_code,
			tabblock20.county_sub_division_code,
			tabblock20.tract_code,
			tabblock20.block_code,
			tabblock20.land_area_sqm,
			tabblock20.water_area_sqm,
			tabblock20.longitude,
			tabblock20.latitude,
			tabblock20.urban_rural_code,
			tabblock20.urbanized_area_code,
			tabblock20.housing_unit_count,
			tabblock20.population,
			tabblock20.GEOMETRY
		FROM bdc.bsl_availability bsl
		INNER JOIN fabric.locations fab ON fab.location_id = bsl.location_id
		INNER JOIN tiger.tabblock20 tabblock20 ON tabblock20.GEOID = fab.geoid
		WHERE bsl.provider_id = ${providerID} AND bsl.state_code = '${parseInt(stateCode, 10)}';

		SELECT
		json_object(
			'type', 'Feature',
			'tippecanoe', json_object(
				'maxzoom', 15,
				'minzoom', 12,
				'layer', 'bdc_${TIGERLevel.Block}'
			),
			'properties', json_object(
				'GEOID', GEOID,
				'nexus:kind', 'bdc:tabblock20',
				'provider_id', provider_id,
				'state_code', state_code,
				'county_code', county_code,
				'county_sub_division_code', county_sub_division_code,
				'tract_code', tract_code,
				'block_code', block_code,
				'land_area_sqm', land_area_sqm,
				'water_area_sqm', water_area_sqm,
				'longitude', longitude,
				'latitude', latitude,
				'urban_rural_code', urban_rural_code,
				'urbanized_area_code', urbanized_area_code,
				'housing_unit_count', housing_unit_count,
				'population', population,
				'average_download_speed', avg(max_advertised_download_speed),
				'average_upload_speed', avg(max_advertised_upload_speed),
				'technology_codes', json_group_array(DISTINCT technology_code),
				'locationIDs', json_group_array(DISTINCT location_id),
				'locations', json_group_array(
					json_object(
						'location_id', location_id,
						'technology_code', technology_code,
						'business_residential_code', business_residential_code,
						'max_advertised_download_speed', max_advertised_download_speed,
						'max_advertised_upload_speed', max_advertised_upload_speed,
						'low_latency', low_latency
					)
				)
			),
			'geometry', json(AsGeoJSON(GEOMETRY))
		) AS ${TIGERLevel.Block}_feature
		FROM broadband_servicable_location
		GROUP BY GEOID;

		SELECT
		json_object(
			'type', 'Feature',
			'tippecanoe', json_object(
				'maxzoom', 11,
				'minzoom', 9,
				'layer', 'bdc_${TIGERLevel.Tract}'
			),
			'properties', json_object(
				'nexus:kind', 'bdc:tract',
				'provider_id', provider_id,
				'state_code', state_code,
				'county_code', county_code,
				'land_area_sqm', SUM(land_area_sqm),
				'water_area_sqm', SUM(water_area_sqm),
				'housing_unit_count', SUM(housing_unit_count),
				'population', SUM(population),
				'average_download_speed', AVG(max_advertised_download_speed),
				'average_upload_speed', AVG(max_advertised_upload_speed),
				'technology_codes', json_group_array(DISTINCT technology_code),
				'locationIDs', json_group_array(DISTINCT location_id)
			),
			'geometry', json(AsGeoJSON(ST_Simplify(GUnion(geometry), 0.00001)))
		) AS ${TIGERLevel.Tract}_feature
			FROM broadband_servicable_location
			GROUP BY GEOID, tract_code;

		SELECT
		json_object(
			'type', 'Feature',
			'tippecanoe', json_object(
				'maxzoom', 8,
				'minzoom', 2,
				'layer', 'bdc_${TIGERLevel.County}'
			),
			'properties', json_object(
				'nexus:kind', 'bdc:county',
				'provider_id', provider_id,
				'state_code', state_code,
				'county_code', county_code,
				'land_area_sqm', SUM(land_area_sqm),
				'water_area_sqm', SUM(water_area_sqm),
				'housing_unit_count', SUM(housing_unit_count),
				'population', SUM(population),
				'average_download_speed', AVG(max_advertised_download_speed),
				'average_upload_speed', AVG(max_advertised_upload_speed),
				'technology_codes', json_group_array(DISTINCT technology_code),
				'locationIDs', json_group_array(DISTINCT location_id)
			),
			'geometry', json(AsGeoJSON(ST_Simplify(GUnion(geometry), 0.0001)))
		) AS ${TIGERLevel.County}_feature
			FROM broadband_servicable_location
			GROUP BY GEOID, county_code;
		`

	await fs.rm(outputFile, { force: true })

	const interval = setInterval(() => {
		console.log(".")
	}, 2000)

	// avoiding the need to load the entire result set into memory
	const child = $`echo ${template} | sqlite3 -batch -noheader -newline '' :memory: > ${outputFile}`
	const result = await child.nothrow()

	clearInterval(interval)

	if (result.exitCode !== 0) {
		throw ResourceError.from(500, result.stderr, "bdc", "generate-geojson")
	}
}
