/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import {
	AdminLevel1Code,
	FIPSCountyCode,
	FIPSTractCode,
	GeoIDPart,
	GeoIDPartLength,
	TIGERLevel,
	TIGERTract,
} from "@isp.nexus/tiger"
import { EntitySchema } from "typeorm"

/**
 * TypeORM entity schema for TIGER tracts.
 *
 * @internal
 */
export const TIGERTractSchema = new EntitySchema<TIGERTract>({
	synchronize: false,
	name: TIGERLevel.Tract,
	columns: {
		GEOID: {
			primary: true,
			type: "text",
			length: 15,
		},
		[GeoIDPart.State]: {
			type: "text",
			length: GeoIDPartLength[GeoIDPart.State],
		},
		[GeoIDPart.County]: {
			type: "text",
			length: GeoIDPartLength[GeoIDPart.County],
		},
		[GeoIDPart.CountySubDivision]: {
			type: "text",
			length: GeoIDPartLength[GeoIDPart.CountySubDivision],
		},
		[GeoIDPart.Tract]: {
			type: "text",
			length: GeoIDPartLength[GeoIDPart.Tract],
		},
		GEOMETRY: {
			type: "blob",
			select: false,
		},
	},
})

/**
 * @internal
 */
export interface TIGERTractShapeAttributes {
	/**
	 * @title State FIPS Code
	 */
	STATEFP: AdminLevel1Code

	/**
	 * @title County FIPS Code
	 * @minLength 3
	 * @maxLength 3
	 * @pattern ^\d{3}$
	 */
	COUNTYFP: FIPSCountyCode

	/**
	 * @title Tract FIPS Code
	 *
	 * @minLength 6
	 * @maxLength 6
	 * @pattern ^\d{6}$
	 */
	TRACTCE: FIPSTractCode
}
