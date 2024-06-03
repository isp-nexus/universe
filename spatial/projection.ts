/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * A coordinate system used to represent the Earth's surface.
 *
 * @category Geo
 */
export enum CoordinateProjection {
	/**
	 * Coordinate system used in Google Earth and GSP systems.
	 *
	 * It represents Earth as a three-dimensional ellipsoid.
	 */
	WGS84 = "4326",
	/**
	 * North American Datum 1983, a geodetic reference system used in the TIGER/Line data.
	 */
	NAD83 = "4269",
}
