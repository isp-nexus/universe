/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { SourceSpecification } from "@maplibre/maplibre-gl-style-spec"
import type { LightSpecification, SkySpecification, StyleSpecification, TerrainSpecification } from "maplibre-gl"
import { LayerSpecificationList, LayerSpecificationListInput, LayerSpecificationListItem } from "../styles/layers.js"
import { TileSetSourceRecord } from "../styles/sources.js"
import { BaseLayers } from "./layers.js"
import { createTerrainDEMSource, HillshadeTileSetID, TerrainTileSetID } from "./terrain.js"

//#endregion

//#region Spec Creators

export function createLightSpec(spec?: Partial<LightSpecification>): LightSpecification {
	return {
		color: "white",
		intensity: 0.85,
		anchor: "viewport",
		position: [
			10, // Radial
			20, // Azimuthal
			-5, // Polar
		],
		...spec,
	}
}

export function createSkySpec(spec?: Partial<SkySpecification>): SkySpecification {
	return {
		"sky-color": "#000535",
		"horizon-color": "hsl(54deg 100% 16%)",
		"fog-color": "hsl(54deg 100% 5%)",
		"sky-horizon-blend": 0.75,
		"horizon-fog-blend": 0.75,
		"fog-ground-blend": 0.1,
		...spec,
	}
}

//#endregion

//#region Style Composition

export interface StyleSpecificationComposition {
	sources: Record<string, SourceSpecification>
	layers?: LayerSpecificationListInput[]
	light?: Partial<LightSpecification>
	sky?: Partial<SkySpecification>
	terrain?: Partial<TerrainSpecification>
}

/**
 * A stateful class for composing a style specification.
 */
export class StyleSpecificationComposer {
	layersList: LayerSpecificationList
	light: LightSpecification
	sky: SkySpecification
	terrain: TerrainSpecification
	sources: TileSetSourceRecord

	constructor(spec: StyleSpecificationComposition) {
		this.light = createLightSpec(spec.light)
		this.sky = createSkySpec(spec.sky)

		this.terrain = {
			source: TerrainTileSetID,
			...spec.terrain,
		}

		this.sources = {
			...spec.sources,
			[TerrainTileSetID]: createTerrainDEMSource(),
			[HillshadeTileSetID]: createTerrainDEMSource(),
		}

		this.layersList = new LayerSpecificationList(BaseLayers)

		for (const layer of spec.layers || []) {
			this.layersList.insert(layer)
		}
	}

	public get layers(): LayerSpecificationListItem[] {
		return Array.from(this.layersList)
	}

	toJSON(): StyleSpecification {
		const styleSpec: StyleSpecification = {
			version: 8,
			glyphs: "https://public.isp.nexus/protomaps/fonts/{fontstack}/{range}.pbf",
			sprite: "https://public.isp.nexus/protomaps/sprites/v3/light",

			light: createLightSpec(this.light),
			sky: createSkySpec(this.sky),
			// terrain: this.terrain,
			sources: this.sources,
			layers: this.layers,
		}

		return styleSpec
	}

	toJS(): StyleSpecification {
		return this.toJSON()
	}
}

//#endregion
