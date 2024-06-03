/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { TIGERClassCode } from "./class-code.js"
import { TIGERFunctionalStatus } from "./functional-status.js"
import type { LegalStatisticalAreaDescription } from "./legal-statistical-area.js"
import type { AdminLevel1Code } from "./state.js"

/**
 * @title TIGER County
 * @public
 * @requires {@linkcode AdminLevel1Code}
 */
export interface TIGERCounty {
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
	COUNTYFP: string

	/**
	 * @title County GNIS Code
	 *
	 * @minLength 8
	 * @maxLength 8
	 * @pattern ^\d{8}$
	 *
	 * @see {@link https://www.usgs.gov/us-board-on-geographic-names/domestic-names | USGS: Domestic Names}
	 */
	GEOID: string

	/**
	 * Fully Qualified GEOID as used in CEDSCI and other systems.
	 *
	 * @title Fully Qualified Geographic Identifier
	 * @minLength 19
	 * @maxLength 29
	 * @pattern ^\d{19}$
	 */
	GEOIDFQ: string

	/**
	 * Current name and the translated legal/statistical area description code for county
	 * sub-division.
	 *
	 * @title Name/Legal Statistical Area Description
	 * @minLength 1
	 * @maxLength 100
	 */
	NAMELSAD: string

	/**
	 * Legal/Statistical Area Description.
	 *
	 * @title Legal/Statistical Area Description
	 */
	LSAD: LegalStatisticalAreaDescription

	/**
	 * Class Code.
	 *
	 * @title Class Code
	 */
	CLASSFP: TIGERClassCode

	/**
	 * MAF/TIGER Feature Class Code.
	 *
	 * @title MAF/TIGER Feature Class Code
	 *
	 * @minLength 5
	 * @maxLength 5
	 * @pattern ^[A-Z]\d{1}$
	 */
	MTFCC: string

	/**
	 * Functional Status.
	 *
	 * @title Functional Status
	 * @minLength 1
	 * @maxLength 1
	 * @pattern ^[A-Z]$
	 */
	FUNCSTAT: TIGERFunctionalStatus

	/**
	 * Land Area in square meters.
	 *
	 * @title Land Area
	 * @minimum 0
	 */
	ALAND: number

	/**
	 * Water Area in square meters.
	 *
	 * @title Water Area
	 * @minimum 0
	 */
	AWATER: number

	/**
	 * Latitude of the internal point.
	 *
	 * @title Internal Point Latitude
	 */
	INTPTLAT: string

	/**
	 * Longitude of the internal point.
	 *
	 * @title Internal Point Longitude
	 */
	INTPTLON: string

	/**
	 * Name of the county.
	 *
	 * @title Name
	 * @minLength 1
	 * @maxLength 100
	 */
	NAME: string
}

export const TIGERCountySymbol = Symbol.for("TIGERCounty")
