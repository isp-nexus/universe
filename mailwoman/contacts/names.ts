/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { tuple } from "@isp.nexus/core"

/**
 * A parsed person name result.
 */
export interface ParsedPersonName {
	/**
	 * @title Name Prefix
	 * A prefix or title
	 */
	prefix?: string | null
	/**
	 * First name or given name
	 */
	givenName?: string | null
	/**
	 * Middle name or initial
	 */
	middleName?: string | null
	/**
	 * Last name or family name or surname
	 */
	familyName?: string | null
	/**
	 * Suffix
	 */
	suffix?: string | null
}

/**
 * Parse a full name into its components.
 */
export function parseContactName(input: string | undefined | null): ParsedPersonName | null {
	if (!isPresent(input)) return null

	const parsedName: ParsedPersonName = {
		prefix: null,
		givenName: null,
		middleName: null,
		familyName: null,
		suffix: null,
	}

	let normalizedInput = input
		// strip out James (Jim) Gordon
		.replace(/\s*\(.+\)\s*/g, " ")
		// strip out James "Jim" Gordon
		.replace(/\s*".+"\s*/g, " ")
		// collapse whitespace
		.trim()

	// TODO: may not want to limit this to "1" (though it makes splitting weird)

	if (count(normalizedInput, ",") === 1) {
		const commaTokens = normalizedInput.split(",")
		const tokenAfterComma = commaTokens[1]!.trim()

		// Check if the name ends with a suffix (ignore the '.' in Ph.D., Jr. etc.)
		if (NameSuffixes.has(tokenAfterComma)) {
			// Assume it's Jim Gordon, Esq.
			parsedName.suffix = tokenAfterComma
			normalizedInput = commaTokens[0]!.trim()
		} else {
			// Assume it's Gordon, Jim -- Reverse it.
			normalizedInput = commaTokens[1]!.trim() + " " + commaTokens[0]!.trim()
		}
	}

	const tokens: (string | null)[] = normalizedInput.split(/\s+/)
	let totalTokens = tokens.length
	let loop = 0
	let token

	while (loop < totalTokens) {
		token = tokens[loop]

		if (token && NamePrefixes.has(token.toUpperCase())) {
			parsedName.prefix = isPresent(parsedName.prefix) ? parsedName.prefix + " " + token : token
			// null it out because we've taken care of it
			tokens[loop] = null
		} else if (token && NameSuffixes.has(token.toUpperCase())) {
			parsedName.suffix = isPresent(parsedName.suffix) ? parsedName.suffix + " " + token : token
			// null it out because we've taken care of it
			tokens[loop] = null
		}

		loop++
	}

	const cleanedTokens = tokens.filter(Boolean) as string[]
	totalTokens = cleanedTokens.length
	loop = 0

	// if we only have "Mary Ann", this will split Mary --> First, Ann --> Last
	const hasCompoundGivenName = totalTokens > 2 && isCompoundGivenName(cleanedTokens[0]!, cleanedTokens[1]!)
	const hasCompoundFamilyName = totalTokens > 2 && isCompoundFamilyName(cleanedTokens[totalTokens - 2]!)

	while (loop < totalTokens) {
		token = cleanedTokens[loop]!

		if (loop === 0 || (loop === 1 && hasCompoundGivenName)) {
			parsedName.givenName = loop === 0 ? token : parsedName.givenName + " " + token
		} else if (hasCompoundFamilyName && (loop === totalTokens - 1 || loop === totalTokens - 2)) {
			// Has a compound last and we're on the last 2 tokens.
			parsedName.familyName = isPresent(parsedName.familyName) ? parsedName.familyName + " " + token : token
		} else if (loop === 1 || (loop === 2 && hasCompoundGivenName)) {
			// We're on the 2nd word; or the 3rd word but the 1st 2 are compound.
			if (totalTokens >= 3 && !hasCompoundGivenName && !isCompoundFamilyName(token)) {
				// We're on the second word of a three or more word name, and the first two weren't a compound.
				parsedName.middleName = token
			} else if (totalTokens >= 4 && hasCompoundGivenName) {
				// we're on the third word of a four or more word name and the first two were compound.
				parsedName.middleName = token
			} else {
				// we're on the second word of a two word name.
				parsedName.familyName = token
			}
		} else {
			//if ( loop > 1) {
			// we're on the 3rd word of a 3 or more name
			parsedName.familyName = isPresent(parsedName.familyName) ? parsedName.familyName + " " + token : token
		}

		loop++
	}

	return parsedName
}

function isPresent<T extends string | null | undefined>(text: T): text is NonNullable<T> {
	return typeof text === "string" && text.trim().length !== 0
}

function count(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1
}

const NameSuffixes = tuple([
	"CCSP",
	"CNP",
	"CPA",
	"DC",
	"DDS",
	"DMA ",
	"DMD",
	"DMin",
	"DMus",
	"DO",
	"DPM",
	"DVM",
	"EI",
	"EIT",
	"ESQ",
	"Esq",
	"ESQUIRE",
	"ESTATE",
	"FAM",
	"FAMILY",
	"I",
	"II",
	"III",
	"IV",
	"JD",
	"JR",
	"LLS",
	"LP",
	"LPN",
	"LUTCF",
	"MD",
	"OC",
	"OD",
	"PA",
	"PE",
	"PharmD",
	"PHD",
	"PhD",
	"PsyD",
	"RA",
	"RLA",
	"RLS",
	"RN",
	"SE",
	"SJ",
	"SR",
	"V",
	"VI",
	"VII",
	"VIII",
	"VP",
])

const NamePrefixes = tuple([
	"AIRMAN",
	"AN",
	"AND",
	"BG",
	"BR",
	"BRIG",
	"BRIGADIER",
	"CADET",
	"CAPT",
	"CAPTAIN",
	"CMDR",
	"COL",
	"COLONEL",
	"COMMANDER",
	"COMMISSIONER",
	"CORPORAL",
	"CPL",
	"CPT",
	"DEP",
	"DEPUTY",
	"DOCTOR",
	"DR",
	"FATHER",
	"FR",
	"GEN",
	"GENERAL",
	"HON",
	"HONORABLE",
	"JDGE",
	"JUDGE",
	"LIEUTENANT",
	"LT",
	"LTCOL",
	"LTGEN",
	"MAJ",
	"MAJGEN",
	"MAJOR",
	"MASTER",
	"MISS",
	"MISTER",
	"MR",
	"MRMRS",
	"MRS",
	"MS",
	"MISS",
	"PASTOR",
	"PFC",
	"PRES",
	"PRIVATE",
	"PROF",
	"PROFESSOR",
	"PVT",
	"RABBI",
	"REP",
	"REPRESENTATIVE",
	"REV",
	"REVEREND",
	"SEN",
	"SENATOR",
	"SGT",
	"SHERIFF",
	"SIR",
	"SISTER",
	"SM",
	"SN",
	"SRA",
	"SSGT",
])

const CompoundFirstNames = tuple([
	"ANA MARIA",
	"ANN MARIE",
	"ANNA MARIA",
	"ANNA MARIE",
	"ANNE MARIE",
	"BARBARA ANN",
	"BETH ANN",
	"BETTY ANN",
	"BETTY JEAN",
	"BETTY JO",
	"BILLIE JO",
	"CAROL ANN",
	"JO ANN",
	"JO ANNA",
	"JO ANNE",
	"JO ELLEN",
	"JOHN PAUL",
	"JOSE LUIS",
	"JUAN CARLOS",
	"JULIE ANN",
	"LA DONNA",
	"LA TOYA",
	"LA VERNE",
	"LE ROY",
	"LEE ANN",
	"LEIGH ANN",
	"LISA MARIE",
	"LORI ANN",
	"LOU ANN",
	"LU ANN",
	"MARIA DE",
	"MARIA DEL",
	"MARIA ELENA",
	"MARIA TERESA",
	"MARY ALICE",
	"MARY ANN",
	"MARY ANNE",
	"MARY BETH",
	"MARY ELIZABETH",
	"MARY ELLEN",
	"MARY FRANCES",
	"MARY GRACE",
	"MARY JANE",
	"MARY JEAN",
	"MARY JO",
	"MARY KAY",
	"MARY LEE",
	"MARY LOU",
	"MARY LOUISE",
	"MARY LYNN",
	"PATRICIA ANN",
	"ROSE ANN",
	"ROSE MARIE",
	"ROSE MARY",
	"RUTH ANN",
	"SAN JUANA",
	"SAN JUANITA",
	"SUE ANN",
	"WILLIE MAE",
])

const compoundLastNamePrefixes = tuple([
	"AL",
	"BIN",
	"DA",
	"DE",
	"DEL",
	"DELLA",
	"DI",
	"DU",
	"EL",
	"IBN",
	"LA",
	"LE",
	"LO",
	"MAC",
	"MC",
	"PIETRO",
	"ST",
	"TER",
	"VAN",
	"VANDEN",
	"VERE",
	"VON",
])

function isCompoundGivenName(primaryGivenName: string, secondaryGivenName: string) {
	return CompoundFirstNames.has(primaryGivenName + " " + secondaryGivenName)
}

function isCompoundFamilyName(lastNamePrefix: string) {
	return compoundLastNamePrefixes.has(lastNamePrefix.replace(/\./g, ""))
}
