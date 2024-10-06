/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   FCC/NITA Building Type Codes
 * @see https://www.fcc.gov/sites/default/files/2019-08/Building%20Type%20Code%20List.pdf
 */

/**
 * Code indicating the type of building at the location.
 *
 * @category NTIA
 * @category FCC
 * @title Building Type Code
 */
export enum BuildingTypeCode {
	/**
	 * A single-family home, apartment building, or condominium.
	 *
	 * @title Residential Building
	 */
	Residential = "R",
	/**
	 * A office building, retail store, or warehouse.
	 *
	 * @title Non-residential Building
	 */
	NonResidential = "B",
	/**
	 * Both residential and non-residential units.
	 *
	 * @title Mixed-use Building
	 */
	Mixed = "X",
	/**
	 * A dormitory, nursing home, or prison.
	 *
	 * @title Group Quarters
	 */
	GroupQuarters = "G",
	/**
	 * @title Community Anchor Institution
	 * @see {@link https://help.bdc.fcc.gov/hc/en-us/articles/13471550784411-How-to-Identify-a-Community-Anchor-Institution-as-a-Broadband-Serviceable-Location CAI Guide}
	 */
	CAI = "C",
	/**
	 * @title Enterprise or business park.
	 */
	Enterprise = "E",
	/**
	 * Building type not covered by the above categories.
	 *
	 * @title Other
	 */
	Other = "O",
}

/**
 * Code indicating the type of building at the location.
 *
 * @title Business/Residential Code
 */
export enum BusinessResidentialCode {
	/**
	 * @title Business-only service.
	 */
	Business = BuildingTypeCode.NonResidential,
	/**
	 * @title Residential-only service.
	 */
	Residential = BuildingTypeCode.Residential,

	/**
	 * @title Mixed business and residential service.
	 */
	Mixed = BuildingTypeCode.Mixed,
}
