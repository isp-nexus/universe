/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file USPS street suffixes and their abbreviations.
 * @see {@link https://pe.usps.com/text/pub28/28apc_002.htm USPS Street Suffix Abbreviations}
 */

//#region Records

/**
 * A record mapping known USPS street suffixes to their respective abbreviations.
 *
 * Note that the first entry in each suffix being the preferred USPS abbreviation.
 *
 * @category Address
 * @category Street
 * @category Postal
 * @internal
 * @see {@linkcode StreetSuffix} for a list of all known USPS street suffixes.
 */
export const StreetSuffixAbbreviationRecord = {
	ALLEY: ["ALY", "ALLEE", "ALLY"],
	ANEX: ["ANX", "ANNEX", "ANNX"],
	ARCADE: ["ARC"],
	AVENUE: ["AVE", "AV", "AVEN", "AVENU", "AVN", "AVNUE"],
	BAYOU: ["BYU", "BAYOO"],
	BEACH: ["BCH"],
	BEND: ["BND"],
	BLUFF: ["BLF", "BLUF"],
	BLUFFS: ["BLFS"],
	BOTTOM: ["BTM", "BOT", "BOTTM"],
	BOULEVARD: ["BLVD", "BOUL", "BOULV"],
	BRANCH: ["BR", "BRNCH"],
	BRIDGE: ["BRG", "BRDGE"],
	BROOK: ["BRK"],
	BROOKS: ["BRKS"],
	BURG: ["BG"],
	BURGS: ["BGS"],
	BYPASS: ["BYP", "BYPA", "BYPAS", "BYPS"],
	CAMP: ["CP", "CMP"],
	CANYON: ["CYN", "CANYN", "CNYN"],
	CAPE: ["CPE"],
	CAUSEWAY: ["CSWY", "CAUSWA"],
	CENTER: ["CTR", "CEN", "CENT", "CENTR", "CENTRE", "CNTER", "CNTR"],
	CENTERS: ["CTRS"],
	CIRCLE: ["CIR", "CIRC", "CIRCL", "CRCL", "CRCLE"],
	CIRCLES: ["CIRS"],
	CLIFF: ["CLF"],
	CLIFFS: ["CLFS"],
	CLUB: ["CLB"],
	COMMON: ["CMN"],
	COMMONS: ["CMNS"],
	CORNER: ["COR"],
	CORNERS: ["CORS"],
	COURSE: ["CRSE"],
	COURT: ["CT"],
	COURTS: ["CTS"],
	COVE: ["CV"],
	COVES: ["CVS"],
	CREEK: ["CRK"],
	CRESCENT: ["CRES", "CRSENT", "CRSNT"],
	CREST: ["CRST"],
	CROSSING: ["XING", "CRSSNG"],
	CROSSROAD: ["XRD"],
	CROSSROADS: ["XRDS"],
	CURVE: ["CURV"],
	DALE: ["DL"],
	DAM: ["DM"],
	DIVIDE: ["DV", "DIV", "DVD"],
	DRIVE: ["DR", "DRIV", "DRV"],
	DRIVES: ["DRS"],
	ESTATE: ["EST"],
	ESTATES: ["ESTS"],
	EXPRESSWAY: ["EXPY", "EXP", "EXPR", "EXPRESS", "EXPW"],
	EXTENSION: ["EXT", "EXTN", "EXTNSN"],
	EXTENSIONS: ["EXTS"],
	FALL: ["FALL"],
	FALLS: ["FLS"],
	FERRY: ["FRY", "FRRY"],
	FIELD: ["FLD"],
	FIELDS: ["FLDS"],
	FLAT: ["FLT"],
	FLATS: ["FLTS"],
	FORD: ["FRD"],
	FORDS: ["FRDS"],
	FOREST: ["FRST", "FORESTS"],
	FORGE: ["FRG", "FORG"],
	FORGES: ["FRGS"],
	FORK: ["FRK"],
	FORKS: ["FRKS"],
	FORT: ["FT", "FRT"],
	FREEWAY: ["FWY", "FREEWY", "FRWAY", "FRWY"],
	GARDEN: ["GDN", "GARDN", "GRDEN", "GRDN"],
	GARDENS: ["GDNS", "GRDNS"],
	GATEWAY: ["GTWY", "GATEWY", "GATWAY", "GTWAY"],
	GLEN: ["GLN"],
	GLENS: ["GLNS"],
	GREEN: ["GRN"],
	GREENS: ["GRNS"],
	GROVE: ["GRV", "GROV"],
	GROVES: ["GRVS"],
	HARBOR: ["HBR", "HARB", "HARBR", "HRBOR"],
	HARBORS: ["HBRS"],
	HAVEN: ["HVN"],
	HEIGHTS: ["HTS", "HT"],
	HIGHWAY: ["HWY", "HIGHWY", "HIWAY", "HIWY", "HWAY"],
	HILL: ["HL"],
	HILLS: ["HLS"],
	HOLLOW: ["HOLW", "HLLW", "HOLLOWS", "HOLWS"],
	INLET: ["INLT"],
	ISLAND: ["IS", "ISLND"],
	ISLANDS: ["ISS", "ISLNDS"],
	ISLE: ["ISLE", "ISLES"],
	JUNCTION: ["JCT", "JCTION", "JCTN", "JUNCTN", "JUNCTON"],
	JUNCTIONS: ["JCTS", "JCTNS"],
	KEY: ["KY"],
	KEYS: ["KYS"],
	KNOLL: ["KNL", "KNOL"],
	KNOLLS: ["KNLS"],
	LAKE: ["LK"],
	LAKES: ["LKS"],
	LAND: ["LAND"],
	LANDING: ["LNDG", "LNDNG"],
	LANE: ["LN"],
	LIGHT: ["LGT"],
	LIGHTS: ["LGTS"],
	LOAF: ["LF"],
	LOCK: ["LCK"],
	LOCKS: ["LCKS"],
	LODGE: ["LDG", "LDGE", "LODG"],
	LOOP: ["LOOP", "LOOPS"],
	MALL: ["MALL"],
	MANOR: ["MNR"],
	MANORS: ["MNRS"],
	MEADOW: ["MDW"],
	MEADOWS: ["MDWS", "MDW", "MEDOWS"],
	MEWS: ["MEWS"],
	MILL: ["ML"],
	MILLS: ["MLS"],
	MISSION: ["MSN", "MISSN", "MSSN"],
	MOTORWAY: ["MTWY"],
	MOUNT: ["MT", "MNT"],
	MOUNTAIN: ["MTN", "MNTAIN", "MNTN", "MOUNTIN", "MTIN"],
	MOUNTAINS: ["MTNS", "MNTNS"],
	NECK: ["NCK"],
	ORCHARD: ["ORCH", "ORCHRD"],
	OVAL: ["OVAL", "OVL"],
	OVERPASS: ["OPAS"],
	PARK: ["PARK", "PRK", "PARKS"],
	PARKWAY: ["PKWY", "PARKWY", "PKWAY", "PKY"],
	PARKWAYS: ["PKWY", "PKWYS"],
	PASS: ["PASS"],
	PASSAGE: ["PSGE"],
	PATH: ["PATH", "PATHS"],
	PIKE: ["PIKE", "PIKES"],
	PINE: ["PNE"],
	PINES: ["PNES"],
	PLACE: ["PL"],
	PLAIN: ["PLN"],
	PLAINS: ["PLNS"],
	PLAZA: ["PLZ", "PLZA"],
	POINT: ["PT"],
	POINTS: ["PTS"],
	PORT: ["PRT"],
	PORTS: ["PRTS"],
	PRAIRIE: ["PR", "PRR"],
	RADIAL: ["RADL", "RAD", "RADIEL"],
	RAMP: ["RAMP"],
	RANCH: ["RNCH", "RANCHES", "RNCHS"],
	RAPID: ["RPD"],
	RAPIDS: ["RPDS"],
	REST: ["RST"],
	RIDGE: ["RDG", "RDGE"],
	RIDGES: ["RDGS"],
	RIVER: ["RIV", "RVR", "RIVR"],
	ROAD: ["RD"],
	ROADS: ["RDS"],
	ROUTE: ["RTE"],
	ROW: ["ROW"],
	RUE: ["RUE"],
	RUN: ["RUN"],
	SHOAL: ["SHL"],
	SHOALS: ["SHLS"],
	SHORE: ["SHR", "SHOAR"],
	SHORES: ["SHRS", "SHOARS"],
	SKYWAY: ["SKWY"],
	SPRING: ["SPG", "SPNG", "SPRNG"],
	SPRINGS: ["SPGS", "SPNGS", "SPRNGS"],
	SPUR: ["SPUR"],
	SPURS: ["SPUR"],
	SQUARE: ["SQ", "SQR", "SQRE", "SQU"],
	SQUARES: ["SQS", "SQRS"],
	STATION: ["STA", "STATN", "STN"],
	STRAVENUE: ["STRA", "STRAV", "STRAVEN", "STRAVN", "STRVN", "STRVNUE"],
	STREAM: ["STRM", "STREME"],
	STREET: ["ST", "STRT", "STR"],
	STREETS: ["STS"],
	SUMMIT: ["SMT", "SUMIT", "SUMITT"],
	TERRACE: ["TER", "TERR"],
	THROUGHWAY: ["TRWY"],
	TRACE: ["TRCE", "TRACES"],
	TRACK: ["TRAK", "TRACKS", "TRK", "TRKS"],
	TRAFFICWAY: ["TRFY"],
	TRAIL: ["TRL", "TRAILS", "TRLS"],
	TRAILER: ["TRLR", "TRLRS"],
	TUNNEL: ["TUNL", "TUNEL", "TUNLS", "TUNNELS", "TUNNL"],
	TURNPIKE: ["TPKE", "TRNPK", "TURNPK"],
	UNDERPASS: ["UPAS"],
	UNION: ["UN"],
	UNIONS: ["UNS"],
	VALLEY: ["VLY", "VALLY", "VLLY"],
	VALLEYS: ["VLYS"],
	VIADUCT: ["VIA", "VDCT", "VIADCT"],
	VIEW: ["VW"],
	VIEWS: ["VWS"],
	VILLAGE: ["VLG", "VILL", "VILLAG", "VILLG", "VILLIAGE"],
	VILLAGES: ["VLGS"],
	VILLE: ["VL"],
	VISTA: ["VIS", "VIST", "VST", "VSTA"],
	WALK: ["WALK"],
	WALKS: ["WALK"],
	WALL: ["WALL"],
	WAY: ["WAY", "WY"],
	WAYS: ["WAYS"],
	WELL: ["WL"],
	WELLS: ["WLS"],
} as const satisfies Record<string, readonly string[]>

/**
 * @internal
 */
export type StreetSuffixAbbreviationRecord = typeof StreetSuffixAbbreviationRecord

/**
 * A USPS street suffix, i.e. "Street", "Avenue", "Boulevard", etc.
 *
 * @category Address
 * @category Street
 * @category Postal
 * @title Street Suffix
 * @see {@link https://pe.usps.com/text/pub28/28apc_002.htm USPS Street Suffix Abbreviations}
 */
export type StreetSuffix = keyof StreetSuffixAbbreviationRecord

/**
 * A standardized USPS street suffix abbreviation, i.e. "ST", "AVE", "BLVD", etc.
 *
 * This is the preferred abbreviation for a given {@linkcode StreetSuffix}.
 *
 * @category Address
 * @category Street
 * @category Postal
 * @title USPS Standard Suffix Abbreviation
 * @public
 * @see {@linkcode StreetSuffix} for the un-abbreviated form of a USPS street suffix.
 * @see {@linkcode StreetSuffixAbbreviation} for a type that represents all possible USPS street suffix abbreviations.
 * @see {@link https://pe.usps.com/text/pub28/28apc_002.htm USPS Street Suffix Abbreviations}
 */
export type USPSStandardSuffixAbbreviation = StreetSuffixAbbreviationRecord[StreetSuffix][0]

/**
 * A USPS-recognized street suffix abbreviation.
 *
 * @category Address
 * @category Street
 * @category Postal
 * @title Street Suffix Abbreviation
 * @see {@linkcode USPSStandardSuffixAbbreviation} for the preferred abbreviation for a given USPS street suffix.
 */
export type StreetSuffixAbbreviation = StreetSuffixAbbreviationRecord[StreetSuffix][number]

//#endregion

//#region Lookup

/**
 * Mapping of each {@linkcode StreetSuffix} and {@linkcode StreetSuffixAbbreviation} to its parent
 * {@linkcode StreetSuffix}.
 *
 * @internal
 */
const StreetSuffixLookupCache = new Map<string, StreetSuffix>()

for (const streetSuffix of Object.keys(StreetSuffixAbbreviationRecord) as StreetSuffix[]) {
	StreetSuffixLookupCache.set(streetSuffix, streetSuffix)

	const variations = StreetSuffixAbbreviationRecord[streetSuffix]

	for (const variation of variations) {
		StreetSuffixLookupCache.set(variation, streetSuffix)
	}
}

/**
 * Result of a successful USPS street suffix lookup.
 *
 * @internal
 */
export type StreetSuffixMatch<Suffix extends StreetSuffix = StreetSuffix> = {
	/**
	 * The matched USPS street suffix, i.e. "Street", "Avenue", "Boulevard", etc.
	 */
	suffix: Suffix
	/**
	 * The preferred USPS street suffix abbreviation, i.e. "ST", "AVE", "BLVD", etc.
	 */
	abbreviation: StreetSuffixAbbreviationRecord[Suffix][0]
}

/**
 * Lookup a USPS street suffix and its preferred abbreviation.
 */
export function lookupStreetSuffix<S extends StreetSuffix>(suffix: S): StreetSuffixMatch<S>

export function lookupStreetSuffix<A extends StreetSuffixAbbreviation>(abbreviationVariant: A): StreetSuffixMatch
export function lookupStreetSuffix(input: string | null | undefined): StreetSuffixMatch | null
export function lookupStreetSuffix(
	input: string | null | undefined | StreetSuffix | StreetSuffixAbbreviation
): StreetSuffixMatch | null {
	if (!input || typeof input !== "string") return null

	// Can we find a matching suffix?
	const suffix =
		StreetSuffixLookupCache.get(input) ||
		// Can we find a match by normalizing the input?
		StreetSuffixLookupCache.get(input.trim().toUpperCase())

	if (!suffix) return null

	const [abbreviation] = StreetSuffixAbbreviationRecord[suffix]

	return {
		suffix,
		abbreviation,
	}
}

/**
 * Type-predicate to determine if a given input is a {@link StreetSuffix}.
 *
 * @see {@link StreetSuffix} for a list of all known USPS street suffixes.
 */
export function isStreetSuffix(input: unknown): input is StreetSuffix {
	if (!input || typeof input !== "string") return false

	return Object.hasOwn(StreetSuffixAbbreviationRecord, input)
}

//#endregion
