/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Commands module.
 */

import { CommandModule } from "yargs"

import * as BDCGenerateProviderStatic from "./bdc/build-provider-static.js"
import * as BFCFetchFile from "./bdc/fetch-file.js"
import * as BDCGenerateGeoJSON from "./bdc/generate-geojson.js"
import * as BDCGenerateProviderGeoJSON from "./bdc/generate-provider-geojson.js"
import * as BDCIndex from "./bdc/index.js"
import * as BFCInferLocations from "./bdc/infer-locations.js"
import * as BDCSync from "./bdc/sync.js"

import * as inferCSVSchema from "./infer-csv-schema.js"
import * as shapeToGeoJSONSeq from "./shape-to-geojson.js"
import * as TileFetch from "./tiles/tile-fetch.js"

export const CLICommands = [
	// ---
	inferCSVSchema,
	shapeToGeoJSONSeq,
	BFCFetchFile,
	BDCIndex,
	BDCSync,
	BFCInferLocations,
	BDCGenerateProviderGeoJSON,
	BDCGenerateProviderStatic,
	BDCGenerateGeoJSON,
	TileFetch,
] as unknown as CommandModule<any, any>[]
