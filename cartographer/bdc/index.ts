/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { TIGERLevel } from "@isp.nexus/tiger"
import {
	CircleLayerSpecification,
	FillExtrusionLayerSpecification,
	FillLayerSpecification,
	HeatmapLayerSpecification,
	LineLayerSpecification,
	SymbolLayerSpecification,
} from "@maplibre/maplibre-gl-style-spec"
import { interpolateTurbo } from "d3-scale-chromatic"
import { LayerSpecificationListInput } from "../styles/layers.js"
import { TileSetSourceID } from "../styles/sources.js"

/**
 * Identifier for the Broadband Data Collection tile set.
 */
export const BDCTileSetID = TileSetSourceID("bdc")

/**
 * Broadband Data Collection layer specifications.
 *
 * @internal
 */
export type BDCLayerSpecificationInput = LayerSpecificationListInput<
	| FillLayerSpecification
	| LineLayerSpecification
	| CircleLayerSpecification
	| HeatmapLayerSpecification
	| SymbolLayerSpecification
	| FillExtrusionLayerSpecification
>

/**
 * Base specification for a Broadband Data Collection layer.
 *
 * @internal
 */
export type BaseBDCLayerSpecification<T> = T extends BDCLayerSpecificationInput
	? Omit<T, "source-layer" | "source">
	: never

function createBDCBlockLayer<T extends BDCLayerSpecificationInput>(spec: BaseBDCLayerSpecification<T>): T {
	return {
		...spec,
		id: `bdc_${TIGERLevel.Block}_${spec.id}`,
		source: BDCTileSetID,
		"source-layer": `bdc_${TIGERLevel.Block}`,
		minzoom: 12,
	} as unknown as T
}

function createBDCTractLayer<T extends BDCLayerSpecificationInput>(spec: BaseBDCLayerSpecification<T>): T {
	return {
		...spec,
		id: `bdc_${TIGERLevel.Tract}_${spec.id}`,
		source: BDCTileSetID,
		"source-layer": `bdc_${TIGERLevel.Tract}`,
		maxzoom: 12,
		minzoom: 9,
	} as unknown as T
}

function createBDCCountyLayer<T extends BDCLayerSpecificationInput>(spec: BaseBDCLayerSpecification<T>): T {
	return {
		...spec,
		id: `bdc_${TIGERLevel.County}_${spec.id}`,
		source: BDCTileSetID,
		"source-layer": `bdc_${TIGERLevel.County}`,
		maxzoom: 9,
		minzoom: 2,
	} as unknown as T
}

export function createBDCLayer<T extends BDCLayerSpecificationInput>(spec: BaseBDCLayerSpecification<T>): T[] {
	return [createBDCBlockLayer(spec), createBDCTractLayer(spec), createBDCCountyLayer(spec)] as T[]
}

const GIGABIT_BROADBAND_SPEED = 1000

export const BroadbandDataCollectionLayers: BDCLayerSpecificationInput[] = [
	{
		afterID: "earth",
		// metadata: {
		// 	queryable: false,
		// },
		id: "blocks-underserved",
		layout: {
			visibility: "none",
		},
		"source-layer": `bdc_${TIGERLevel.Block}`,
		source: BDCTileSetID,
		type: "fill",
		filter: [
			// ---
			"all",
			["in", 50, ["get", "technology_codes"]], // Fiber only
			[">", ["get", "land_area_sqm"], 0],
			// ["==", ["get", "UR"], "R"],
		],
		paint: {
			// "fill-extrusion-height": [
			// 	// Our extrusion height represents the magnitude of broadband underservice,
			// 	// e.g. How many people are underserved per square meter of land area.
			// 	"let",
			// 	"population_density",
			// 	["/", ["to-number", ["get", "population"]], ["to-number", ["get", "land_area_sqm"]]],
			// 	["*", ["var", "population_density"], 10000],
			// ],
			"fill-color": "hsl(60deg, 100%, 50%)",
			"fill-opacity": [
				// Underserved areas are emphasized to their level importance,
				// relative to the impact of the underservice.
				"let",
				"internet_speed_impact",
				["/", ["to-number", ["get", "average_download_speed"]], GIGABIT_BROADBAND_SPEED],
				[
					// ---
					"interpolate",
					["linear"],
					["var", "internet_speed_impact"],
					0,
					0.1,
					1,
					0.5,
				],
			],
		},
		// layout: {
		// 	visibility: "none",
		// },
	},

	{
		afterID: "blocks-underserved",
		id: "bdc-boundary-blocks",
		layout: {
			visibility: "none",
		},
		metadata: {
			queryable: false,
		},
		"source-layer": `bdc_${TIGERLevel.Block}`,
		source: BDCTileSetID,
		type: "line",
		// filter: [">=", ["get", "ALAND"], 0],
		minzoom: 9,
		paint: {
			"line-color": "#000",
			"line-width": 1,
			"line-dasharray": [2, 2],
		},
	},
	{
		afterID: "blocks-underserved",
		metadata: {
			queryable: false,
		},
		id: "blocks-underserved-ratio-label",
		"source-layer": `bdc_${TIGERLevel.Block}`,
		source: BDCTileSetID,
		type: "symbol",
		filter: [
			// ---
			"all",
			// ["in", 50, ["get", "technology_codes"]], // Fiber only
			[">", ["get", "land_area_sqm"], 0],
			// ["==", ["get", "UR"], "R"],
		],
		paint: {
			"text-color": "black",
			"text-halo-color": "white",
			"text-halo-width": 1,
		},
		layout: {
			visibility: "none",
			"text-field": [
				"concat",
				["number-format", ["get", "average_download_speed"], { "min-fraction-digits": 0, "max-fraction-digits": 2 }],
				" Mbps",
			],
			"text-size": 10,
			"text-offset": [0, 0],
			"text-anchor": "center",
			"text-font": ["Fira Code Regular"],
		},
	},
	...createBDCLayer({
		id: "coverage-fiber-label",
		beforeID: "places_subplace",
		filter: [
			// ---

			"all",
			["==", ["get", "provider_id"], 131425],
			// ["in", 50, ["get", "technology_codes"]],
		],
		type: "symbol",
		layout: {
			visibility: "none",
			"text-field": [
				"concat",
				["number-format", ["get", "average_download_speed"], { "min-fraction-digits": 0, "max-fraction-digits": 2 }],
				" Mbps",
			],
			"text-size": [
				// ---
				"let",
				"multiplier",
				// We scale the text size based on the average download speed.
				// By default, we're no smaller than 14, Any speed above the gigabit threshold
				// acts as a multiplier for the text size.
				// ---
				["/", ["get", "average_download_speed"], GIGABIT_BROADBAND_SPEED / 4],
				["+", 14, ["var", "multiplier"]],
			],
			"text-offset": [0, 0],
			"text-line-height": 1.2,
			"text-pitch-alignment": "viewport",
			"text-variable-anchor": ["center"],
			"text-padding": 10,
			"text-anchor": "center",
			"text-font": ["Fira Code Medium"],
		},

		paint: {
			"text-halo-width": 2,
			"text-halo-color": [
				// ---
				"interpolate",
				["exponential", 0.5],
				["get", "average_download_speed"],
				GIGABIT_BROADBAND_SPEED / 4,
				"#fff",

				GIGABIT_BROADBAND_SPEED,
				"#000",
			],

			"text-color": [
				// ---
				"interpolate",
				["exponential", 0.25],
				["get", "average_download_speed"],
				GIGABIT_BROADBAND_SPEED / 4,
				interpolateTurbo(0),

				GIGABIT_BROADBAND_SPEED / 2,
				interpolateTurbo(0.25),

				GIGABIT_BROADBAND_SPEED,
				interpolateTurbo(0.5),

				GIGABIT_BROADBAND_SPEED * 2,
				interpolateTurbo(0.75),

				GIGABIT_BROADBAND_SPEED * 4,
				interpolateTurbo(1),
			],
		},
	}),
	{
		afterID: "blocks-underserved",
		type: "line",
		source: "composite",
		id: "lm-routes",
		paint: {
			"line-color": "#ff009c",

			"line-width": [
				"interpolate",
				["exponential", 1.6],
				["zoom"],
				// ---
				3,
				0,
				6,
				1.1,
				12,
				1.6,
				15,
				5,
				18,
				15,
			],
		},
		layout: {
			"line-cap": "round",
		},
		"source-layer": "CENTURYLINK_ROUTE",
	},
	...createBDCLayer({
		afterID: "earth",
		id: "coverage-fiber-heat",
		filter: [
			// ---

			"all",
			["==", ["get", "provider_id"], 131425],
		],
		minzoom: 10,
		type: "heatmap",
		layout: {
			visibility: "none",
		},
		paint: {
			"heatmap-color": [
				// ---
				"interpolate",
				["linear"],
				["heatmap-density"],
				...Array.from({ length: 10 }, (_, i) => {
					return [i / 10, interpolateTurbo(i / 10)] as [number, string]
				}).flat(),
			],

			"heatmap-radius": [
				// ---
				"interpolate",
				["linear"],
				["zoom"],
				10,
				5,
				15,
				20,
			],
			"heatmap-weight": [
				// ---
				"*",
				["get", "land_area_sqm"],
				0.00001,
			],
		},
	}),

	{
		maxzoom: 13,
		beforeID: "places_locality",
		type: "circle",
		id: "datacenter-marker",
		source: "composite",
		"source-layer": "DataCentersCombined20220921",
		paint: {
			"circle-color": "red",
			"circle-stroke-color": "hsl(0, 0%, 100%)",
			"circle-stroke-width": 2,
			"circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 3, 12, 5],
			"circle-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.84, 3, 1, 22, 1],
		},
		layout: {
			visibility: "none",
		},
	},

	{
		maxzoom: 13,
		minzoom: 8,
		afterID: "datacenter-marker",
		id: "datacenter-label",
		type: "symbol",
		source: "composite",
		"source-layer": "DataCentersCombined20220921",
		layout: {
			// visibility: "none",
			"text-field": ["get", "Category"],
			"text-size": 12,
			"text-anchor": "top",
			"text-offset": [0, 0.5],
			// "text-allow-overlap": true,
			"text-font": ["Fira Code Regular"],
		},
		paint: {
			"text-color": "#fff",
			"text-halo-color": "#fb8429",
			"text-halo-width": 1,
			"text-opacity": [
				// We fade out the outline at higher zoom levels
				"interpolate",
				["linear"],
				["zoom"],
				1,
				0.01,
				6,
				0.5,
				16,
				1,
			],
		},
	},
]
