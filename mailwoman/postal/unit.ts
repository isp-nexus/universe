/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   USPS secondary address unit designators.
 */

/**
 * USPS-recognized secondary address unit designators.
 */
export const UnitDesignators = [
	// ---
	"APARTMENT",
	"BUILDING",
	"FLOOR",
	"SUITE",
	"UNIT",
	"ROOM",
	"DEPARTMENT",
	"#",
] as const satisfies readonly string[]

/**
 * Secondary address unit designators are used to identify a specific unit within a building or
 * complex.
 *
 * They are typically used in apartment buildings, office buildings, and other multi-unit
 * structures.
 *
 * @title Unit Designator
 */
export type UnitDesignator = (typeof UnitDesignators)[number]

/**
 * USPS-recognized secondary address unit designator abbreviations.
 */
export const UnitDesignatorAbbreviations = [
	"APT",
	"BLDG",
	"FL",
	"STE",
	"UNIT",
	"RM",
	"DEPT",
	"#",
] as const satisfies readonly string[]

/**
 * Secondary address unit designator abbreviations.
 *
 * @title Unit Designator Abbreviation
 */
export type UnitDesignatorAbbreviation = (typeof UnitDesignatorAbbreviations)[number]

/**
 * A record mapping unit prefixes to their abbreviations.
 */
export const UnitDesignatorAbbreviationRecord = {
	APARTMENT: "APT",
	BUILDING: "BLDG",
	FLOOR: "FL",
	SUITE: "STE",
	UNIT: "UNIT",
	ROOM: "RM",
	DEPARTMENT: "DEPT",
	"#": "#",
} as const satisfies Record<UnitDesignator, UnitDesignatorAbbreviation>

/**
 * A record mapping unit abbreviations to their full names.
 */
export type UnitDesignatorsAbbreviationRecord = typeof UnitDesignatorAbbreviationRecord

/**
 * A record mapping designator abbreviations to their full names.
 */
export const UnitDesignatorRecord = {
	APT: "APARTMENT",
	BLDG: "BUILDING",
	FL: "FLOOR",
	STE: "SUITE",
	UNIT: "UNIT",
	RM: "ROOM",
	DEPT: "DEPARTMENT",
	"#": "#",
} as const satisfies Record<UnitDesignatorAbbreviation, UnitDesignator>

export type UnitDesignatorRecord = typeof UnitDesignatorRecord

/**
 * A record mapping unit abbreviations to their pattern matchers.
 */
export const UnitDesignatorAbbreviationPatternMap: ReadonlyMap<UnitDesignatorAbbreviation, RegExp> = new Map(
	UnitDesignatorAbbreviations.map((unitPrefix) => [unitPrefix, new RegExp(`^(${unitPrefix}\\s+)(.*)`, "i")])
)

/**
 * A USPS abbreviation variant.
 */
export type UnitDesignatorsAbbreviation = UnitDesignatorsAbbreviationRecord[UnitDesignator]

/**
 * Result of a unit designator lookup.
 */
export interface UnitDesignatorsMatch<D extends UnitDesignator = UnitDesignator> {
	/**
	 * The unit designator that was matched.
	 */
	designator: D
	/**
	 * The matched unit prefix, which is the abbreviation of the unit designator.
	 */
	prefix: UnitDesignatorsAbbreviationRecord[D]
	/**
	 * The unit label, which is the text following the unit designator.
	 */
	label: string
}

/**
 * Given a unit designator abbreviation, returns the corresponding unit designator.
 *
 * @see {@link https://pe.usps.com/text/pub28/28c2_003.htm USPS Address Unit Designators}
 */
export function pluckUnitDesignator<D extends UnitDesignator>(designator: D): UnitDesignatorsMatch<D>
export function pluckUnitDesignator<D extends UnitDesignatorAbbreviation>(
	designatorAbbreviation: D
): UnitDesignatorsMatch<UnitDesignatorRecord[D]>
export function pluckUnitDesignator(input: unknown): UnitDesignatorsMatch | null
export function pluckUnitDesignator(input: unknown): UnitDesignatorsMatch | null {
	if (!input || typeof input !== "string") return null

	for (const designator of UnitDesignators) {
		const prefix = UnitDesignatorAbbreviationRecord[designator]
		const unitPattern = UnitDesignatorAbbreviationPatternMap.get(prefix)!

		const [, , label] = input.match(unitPattern) || []

		if (!label) continue

		return {
			designator,
			label,
			prefix,
		}
	}

	return null
}
