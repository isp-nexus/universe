/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * A list of geographic regions, i.e. continents.
 *
 * @category Geographic
 */
export const RegionNames = [
	"Africa",
	"Antarctica",
	"Asia",
	"Europe",
	"North America",
	"Oceania",
	"South America",
] as const satisfies readonly string[]

/**
 * A region of the world, i.e. a continent.
 *
 * @category Geographic
 * @title Geographic Region
 * @public
 */
export type RegionName = (typeof RegionNames)[number]
