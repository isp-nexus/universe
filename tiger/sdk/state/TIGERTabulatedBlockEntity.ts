/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { smartSnakeCase } from "@isp.nexus/core"
import { GeoIDPart, TIGERLevel, TIGERProperty, TIGERTabulatedBlock } from "@isp.nexus/tiger"
import { EntitySchema } from "typeorm"

/**
 * TypeORM entity schema for TIGER tracts.
 *
 * @internal
 */
export const TIGERTabulatedBlockSchema = new EntitySchema<TIGERTabulatedBlock>({
	name: TIGERLevel.Block,
	synchronize: false,
	orderBy: {
		GEOID: "ASC",
	},
	columns: {
		GEOID: {
			primary: true,
			type: "text",
		},
		[GeoIDPart.County]: {
			type: "text",
		},
		[GeoIDPart.CountySubDivision]: {
			type: "text",
		},
		[GeoIDPart.Tract]: {
			type: "text",
		},
		[GeoIDPart.BlockGroup]: {
			type: "text",
		},
		[GeoIDPart.Block]: {
			type: "text",
		},
		[TIGERProperty.UrbanizedAreaCode]: {
			type: "text",
			nullable: true,
		},
		[TIGERProperty.UrbanRuralCode]: {
			type: "text",
			nullable: true,
		},
		[TIGERProperty.HousingUnitCount]: {
			type: "integer",
		},
		[TIGERProperty.LandAreaSqm]: {
			type: "integer",
		},
		[TIGERProperty.WaterAreaSqm]: {
			type: "integer",
		},
		[TIGERProperty.Population]: {
			type: "integer",
		},
		GEOMETRY: {
			type: "blob",
			select: false,
		},
	},
})

/**
 * Default column selections for TIGER tabulated block entities.
 *
 * @internal
 */
export const TIGERTabulatedBlockEntitySelections = (
	[
		TIGERProperty.GeoID,
		TIGERProperty.UrbanizedAreaCode,
		TIGERProperty.UrbanRuralCode,
		TIGERProperty.HousingUnitCount,
		TIGERProperty.LandAreaSqm,
		TIGERProperty.WaterAreaSqm,
		TIGERProperty.Population,
	] as const
).map((columnName) => smartSnakeCase(columnName))
