/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { InferTupleMember } from "@isp.nexus/core"

/**
 * FCC broadband technology codes.
 *
 * @category Broadband
 * @category FCC
 * @title Broadband Technology Codes
 * @see {@link https://www.fcc.gov/general/broadband-deployment-data-fcc-form-477 FCC Broadband Deployment Data}
 */
export enum BroadbandTechnologyCode {
	/**
	 * @title Asymmetric xDSL
	 */
	AsymmetricXDSL = 10,
	/**
	 * @title ADSL2/ADSL2+
	 */
	ADSL2ADSL2Plus = 11,
	/**
	 * @title VDSL
	 */
	VDSL = 12,
	/**
	 * @title Symmetric xDSL
	 */
	SymmetricXDSL = 20,
	/**
	 * @title Other Copper Wireline
	 */
	OtherCopperWireline = 30,
	/**
	 * @title Cable Modem (other than DOCSIS 1)
	 */
	CableModemOtherThanDOCSIS1 = 40,
	/**
	 * @title Cable Modem (DOCSIS 1)
	 */
	CableModemDOCSIS1 = 41,
	/**
	 * @title Cable Modem (DOCSIS 3)
	 */
	CableModemDOCSIS3 = 42,
	/**
	 * @title Cable Modem (DOCSIS 3.1)
	 */
	CableModemDOCSIS31 = 43,
	/**
	 * @title Optical Carrier Fiber
	 */
	OpticalCarrierFiber = 50,
	/**
	 * @title Geostationary Satellite
	 */
	GeostationarySatellite = 60,
	/**
	 * @title Non-Geostationary Satellite
	 */
	NonGeostationarySatellite = 61,
	/**
	 * @title Unlicensed Terrestrial Fixed Wireless
	 */
	UnlicensedTerrestrialFixedWireless = 70,
	/**
	 * @title Licensed Terrestrial Fixed Wireless
	 */
	LicensedTerrestrialFixedWireless = 71,
	/**
	 * @title Licensed by Rule Terrestrial Fixed Wireless
	 */
	LicensedByRuleTerrestrialFixedWireless = 72,
	/**
	 * @title Electric Power Line
	 */
	ElectricPowerLine = 90,
	/**
	 * @title All Other
	 */
	AllOther = 0,
}

/**
 * FCC broadband technology categories.
 *
 * @category Broadband
 * @category FCC
 * @title Broadband Technology Categories
 */
export enum BroadbandTechnologyCategory {
	/**
	 * Cable, including DOCSIS 1, 3, and 3.1.
	 *
	 * @title Cable
	 */
	Cable = "CABLE",
	/**
	 * DSL, including ADSL, ADSL2/ADSL2+, VDSL, and symmetric xDSL.
	 *
	 * @title DSL
	 */
	DSL = "DSL",
	/**
	 * Fiber, e.g. optical carrier fiber.
	 *
	 * @title Fiber
	 */
	Fiber = "FIBER",
	/**
	 * Fixed wireless, including unlicensed, licensed, and licensed by rule.
	 *
	 * @title Fixed Wireless
	 */
	FixedWireless = "FIXED_WIRELESS",
	/**
	 * Satellite, including geostationary and non-geostationary.
	 *
	 * @title Satellite
	 */
	Satellite = "SATELLITE",
	/**
	 * Electric power line, e.g. broadband over power lines.
	 *
	 * @title Electric Power Line
	 */
	ElectricPowerLine = "ELECTRIC_POWER_LINE",
	/**
	 * All other technologies not covered by the above categories.
	 *
	 * @title Other
	 */
	Other = "OTHER",
}

/**
 * A mapping of broadband technology codes to their respective category names.
 *
 * @category Broadband
 * @category FCC
 * @see {@linkcode BroadbandTechnologyCategory} for the available categories.
 * @see {@linkcode BroadbandTechnologyCategoryToCodeSet} for the reverse mapping.
 */
export const BroadbandTechnologyCodeToCategoryName = {
	[BroadbandTechnologyCode.CableModemOtherThanDOCSIS1]: BroadbandTechnologyCategory.Cable,
	[BroadbandTechnologyCode.CableModemDOCSIS1]: BroadbandTechnologyCategory.Cable,
	[BroadbandTechnologyCode.CableModemDOCSIS3]: BroadbandTechnologyCategory.Cable,
	[BroadbandTechnologyCode.CableModemDOCSIS31]: BroadbandTechnologyCategory.Cable,
	[BroadbandTechnologyCode.AsymmetricXDSL]: BroadbandTechnologyCategory.DSL,
	[BroadbandTechnologyCode.ADSL2ADSL2Plus]: BroadbandTechnologyCategory.DSL,
	[BroadbandTechnologyCode.VDSL]: BroadbandTechnologyCategory.DSL,
	[BroadbandTechnologyCode.SymmetricXDSL]: BroadbandTechnologyCategory.DSL,
	[BroadbandTechnologyCode.OtherCopperWireline]: BroadbandTechnologyCategory.Other,
	[BroadbandTechnologyCode.OpticalCarrierFiber]: BroadbandTechnologyCategory.Fiber,
	[BroadbandTechnologyCode.GeostationarySatellite]: BroadbandTechnologyCategory.Satellite,
	[BroadbandTechnologyCode.NonGeostationarySatellite]: BroadbandTechnologyCategory.Satellite,
	[BroadbandTechnologyCode.UnlicensedTerrestrialFixedWireless]: BroadbandTechnologyCategory.FixedWireless,
	[BroadbandTechnologyCode.LicensedTerrestrialFixedWireless]: BroadbandTechnologyCategory.FixedWireless,
	[BroadbandTechnologyCode.LicensedByRuleTerrestrialFixedWireless]: BroadbandTechnologyCategory.FixedWireless,
	[BroadbandTechnologyCode.ElectricPowerLine]: BroadbandTechnologyCategory.ElectricPowerLine,
	[BroadbandTechnologyCode.AllOther]: BroadbandTechnologyCategory.Other,
} as const satisfies Record<BroadbandTechnologyCode, BroadbandTechnologyCategory>

/**
 * @internal
 */
export type BroadbandTechnologyCodeToCategoryName = typeof BroadbandTechnologyCodeToCategoryName

/**
 * A mapping of broadband technology categories to their respective technology codes.
 *
 * @category Broadband
 * @category FCC
 * @see {@linkcode BroadbandTechnologyCodeToCategoryName} for the reverse mapping.
 * @see {@linkcode BroadbandTechnologyCategory} for the available categories.
 */
export const BroadbandTechnologyCategoryToCodeSet = {
	[BroadbandTechnologyCategory.Cable]: new Set([
		BroadbandTechnologyCode.CableModemOtherThanDOCSIS1,
		BroadbandTechnologyCode.CableModemDOCSIS1,
		BroadbandTechnologyCode.CableModemDOCSIS3,
		BroadbandTechnologyCode.CableModemDOCSIS31,
	] as const),
	[BroadbandTechnologyCategory.DSL]: new Set([
		BroadbandTechnologyCode.AsymmetricXDSL,
		BroadbandTechnologyCode.ADSL2ADSL2Plus,
		BroadbandTechnologyCode.VDSL,
		BroadbandTechnologyCode.SymmetricXDSL,
	] as const),
	[BroadbandTechnologyCategory.Fiber]: new Set([BroadbandTechnologyCode.OpticalCarrierFiber] as const),
	[BroadbandTechnologyCategory.FixedWireless]: new Set([
		BroadbandTechnologyCode.UnlicensedTerrestrialFixedWireless,
		BroadbandTechnologyCode.LicensedTerrestrialFixedWireless,
		BroadbandTechnologyCode.LicensedByRuleTerrestrialFixedWireless,
	] as const),
	[BroadbandTechnologyCategory.Satellite]: new Set([
		BroadbandTechnologyCode.GeostationarySatellite,
		BroadbandTechnologyCode.NonGeostationarySatellite,
	] as const),
	[BroadbandTechnologyCategory.ElectricPowerLine]: new Set([BroadbandTechnologyCode.ElectricPowerLine] as const),
	[BroadbandTechnologyCategory.Other]: new Set([
		BroadbandTechnologyCode.AllOther,
		BroadbandTechnologyCode.OtherCopperWireline,
	] as const),
} as const satisfies Record<BroadbandTechnologyCategory, Set<BroadbandTechnologyCode>>

export type BroadbandTechnologyCategoryToCodeSet = {
	[K in BroadbandTechnologyCategory]: InferTupleMember<(typeof BroadbandTechnologyCategoryToCodeSet)[K]>
}

/**
 * Given a broadband technology code, return the category name.
 *
 * @category Broadband
 * @category FCC
 */
export function pluckBroadbandTechnologyCategoryFromCode<T extends BroadbandTechnologyCode>(
	technologyCode: T
): BroadbandTechnologyCodeToCategoryName[T] {
	return BroadbandTechnologyCodeToCategoryName[technologyCode]
}

/**
 * Given a broadband technology category, return the set of technology codes.
 *
 * @category Broadband
 * @category FCC
 */
export function pluckBroadbandTechnologyCodesFromCategory<T extends BroadbandTechnologyCategory>(
	technologyCategory: T
) {
	return BroadbandTechnologyCategoryToCodeSet[technologyCategory]
}
