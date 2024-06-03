/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { JSONSchemaID } from "@isp.nexus/core"
import { MultiPolygonLiteral } from "@isp.nexus/spatial"
import { TIGERProperty, TIGERPropertyRecord } from "./constants.js"
import { GeoIDPart, ParsedGeoIDBlockLevel, type FIPSBlockGeoID } from "./geoid.js"

export const $TigerTabulatedBlock = JSONSchemaID("TIGERBlock")
export type $TigerTabulatedBlock = typeof $TigerTabulatedBlock

/**
 * The properties of a tabulated block from the TIGER/Line dataset.
 */
export type TIGERTabulatedBlockProperties = Pick<
	TIGERPropertyRecord<FIPSBlockGeoID>,
	| TIGERProperty.GeoID
	| GeoIDPart.CountySubDivision
	| GeoIDPart.Tract
	| GeoIDPart.Place
	| GeoIDPart.BlockGroup
	| GeoIDPart.Block
	| GeoIDPart.Place
	| GeoIDPart.CongressionalDistrict
	| TIGERProperty.ClassCode
	| TIGERProperty.UrbanRuralCode
	| TIGERProperty.UrbanizedAreaCode
	| TIGERProperty.FunctionalStatus
	| TIGERProperty.LandAreaSqm
	| TIGERProperty.WaterAreaSqm
	| TIGERProperty.CentroidLatitude
	| TIGERProperty.CentroidLongitude
	| TIGERProperty.HousingUnitCount
	| TIGERProperty.Population
>

export interface TIGERBlockFeature {
	type: "Feature"
	id: FIPSBlockGeoID
	geometry: MultiPolygonLiteral
	properties: TIGERTabulatedBlockProperties
}

export interface TIGERBlockFeatureCollection {
	type: "FeatureCollection"
	features: TIGERBlockFeature[]
}

/**
 * A tabulated block from the TIGER/Line dataset.
 *
 * @public
 * @requires {@linkcode ParsedGeoIDBlockLevel}
 */
export interface TIGERTabulatedBlock extends ParsedGeoIDBlockLevel, TIGERTabulatedBlockProperties {
	/**
	 * The GeoID of the tabulated block.
	 *
	 * @title GeoID
	 */
	GEOID: FIPSBlockGeoID

	/**
	 * The geometry of the tabulated block, typically a polygon, but may be a multi-polygon for blocks
	 * with holes, or islands.
	 *
	 * @title Geometry
	 */
	GEOMETRY: MultiPolygonLiteral
}
