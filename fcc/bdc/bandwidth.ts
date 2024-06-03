/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * The unit of measurement for bandwidth.
 *
 * @category Bandwidth
 * @title Bandwidth Unit
 */
export enum BandwidthUnit {
	/**
	 * @title Megabits per second
	 */
	Mbps = "Mbps",
	/**
	 * @title Kilobits per second
	 */
	Kbps = "Kbps",
	/**
	 * @title Gigabits per second
	 */
	Gbps = "Gbps",
}

const BandWidthUnitFactor = {
	[BandwidthUnit.Mbps]: 1,
	[BandwidthUnit.Kbps]: 1_000,
	[BandwidthUnit.Gbps]: 0.001,
} as const satisfies Record<BandwidthUnit, number>

/**
 * Options for converting bandwidth.
 *
 * @internal
 */
export interface ConvertBandwidthOptions {
	/**
	 * The unit to convert the bandwidth to.
	 *
	 * @default BandwidthUnit.Mbps
	 */
	toUnit?: BandwidthUnit

	/**
	 * The unit the bandwidth is currently in.
	 *
	 * @default BandwidthUnit.Mbps
	 */
	fromUnit?: BandwidthUnit
}

/**
 * Converts the bandwidth to the desired unit.
 *
 * @internal
 */
export function convertBandwidth(
	/**
	 * The bandwidth value to convert.
	 */
	bandwidth: number,
	{ toUnit = BandwidthUnit.Mbps, fromUnit = BandwidthUnit.Mbps }: ConvertBandwidthOptions = {}
): number {
	if (toUnit === fromUnit) return bandwidth

	return (bandwidth * BandWidthUnitFactor[fromUnit]) / BandWidthUnitFactor[toUnit]
}

/**
 * Given a bandwidth value, formats it as a string with the appropriate unit.
 *
 * While the bandwidth for the various records may vary, in all cases the required unit for entry is
 * the same. It is always Mbps (Megabits per second).
 *
 * - Up to three digits can be added to the right of the decimal point for speeds less than 10 Mbps.
 * - 768 Kbps service would be entered as 0.768 Mbps, while 1 Gbps service would be entered as 1000
 *   Mbps.
 * - For all speeds equal or greater than 10 Mbps, speeds are rounded to the nearest whole number.
 *
 * @internal
 */
export function formatBandwidth(
	/**
	 * The bandwidth value to convert.
	 */
	bandwidth: number,
	{ fromUnit = BandwidthUnit.Mbps }: Pick<ConvertBandwidthOptions, "fromUnit"> = {}
): string {
	const bandwidthInMbps = convertBandwidth(bandwidth, { fromUnit, toUnit: BandwidthUnit.Mbps })

	if (bandwidthInMbps < 10) {
		return bandwidthInMbps.toFixed(3)
	}

	return Math.round(bandwidthInMbps).toString()
}
