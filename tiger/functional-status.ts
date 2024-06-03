/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * A code indicating the functional status of a governmental unit.
 *
 * @title TIGER Functional Status
 */
export enum TIGERFunctionalStatus {
	/**
	 * Active government providing primary general-purpose functions. Active entity (federally
	 * recognized entities only).
	 */
	ActiveGovernment = "A",
	/**
	 * Active government that is partially consolidated with another government but with separate
	 * officials providing primary general-purpose functions.
	 */
	PartiallyConsolidatedActiveGovernment = "B",
	/**
	 * Active government consolidated with another government with a single set of officials.
	 */
	ActiveGovernmentConsolidated = "C",
	/**
	 * Active government providing special-purpose functions.
	 */
	ActiveGovernmentSpecialPurpose = "E",
	/**
	 * Fictitious entity created to fill the Census Bureau geographic hierarchy
	 */
	FictitiousEntity = "F",
	/**
	 * Active government that is subordinate to another unit of government.
	 */
	SubordinateActiveGovernment = "G",
	/**
	 * Inactive governmental unit that has the power to provide primary special-purpose functions.
	 */
	InActiveGovernmentalUnit = "I",
	/**
	 * Inactive, nonfunctioning legal real property entity with potential quasi-legal administrative
	 * functions.
	 */
	InactiveNonFunctioningLegalRealPropertyEntity = "L",
	/**
	 * Active legal real property entity with quasi-legal functions.
	 */
	ActiveLegalRealPropertyEntity = "M",
	/**
	 * Non-functioning legal entity.
	 */
	NonFunctioningLegalEntity = "N",
	/**
	 * Statistical entity.
	 */
	StatisticalEntity = "S",
	/**
	 * Active state-recognized entity.
	 */
	ActiveStateRecognizedEntity = "T",
}
