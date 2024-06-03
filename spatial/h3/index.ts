/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { cellToLatLng } from "h3-js"
import { Tagged } from "type-fest"
import { GeoPoint, PointLiteral } from "../geometries/point.js"

/**
 * A H3 cell index, full 64 bits.
 *
 * @type string
 * @title H3 Cell Index
 * @pattern ^[0-9a-f]{15}$
 */
export type H3Cell = Tagged<string, "H3Cell">

export function isH3Cell(value: string): value is H3Cell {
	return /^[0-9a-f]{15}$/.test(value)
}

/**
 * A H3 cell index, shortened to 48 bits.
 *
 * @type string
 * @title H3 Cell Index (Short)
 * @pattern ^[0-9a-f]{12}$
 */
export type H3CellShort = Tagged<string, "H3CellShort">

/**
 * Given a full H3 cell index, shorten it to 48 bits.
 */
export function shortenH3Cell(cell: H3Cell): H3CellShort {
	// ...and convert it to a 48-bit cell address.
	const cellBigInt = BigInt(`0x${cell}`)
	// 8 f 2 aa 84 5a 18 ac 6b
	//     aa 84 5a 18 ac 6b

	// Extract the cell address without the resolution
	const h3CellShortBigInt = cellBigInt & 0xfffffffffffffn

	const h3CellShortHex = h3CellShortBigInt.toString(16)

	return h3CellShortHex as H3CellShort
}

//2 aa 84 5a 18 ac 6b

// 8 f2 aa 84 5a 18 ac 6b
/**
 * Given a short cell address, expand it to a full H3 cell index.
 */
export function expandH3Cell(h3CellShort: H3CellShort, resolution = 15): H3Cell {
	// Convert the short cell address back to BigInt
	const h3CellShortBigInt = BigInt(`0x${h3CellShort}`)

	const resolutionHex = resolution.toString(16)
	// Reassemble the H3 cell index portion...
	const cellBigInt = h3CellShortBigInt << BigInt(8 * (15 - resolution))
	// Back to a string...
	const partialCell = cellBigInt.toString(16)
	// Finally, we add the resolution back to the cell index.
	const cell = `8${resolutionHex}${partialCell}`

	return cell as H3Cell
}

/**
 * Given a geographic point, return a short cell address.
 */
export function shortCellToPoint(shortCell: H3CellShort, resolution = 15): GeoPoint {
	const cell = expandH3Cell(shortCell, resolution)

	// Convert the H3 cell index back to latitude and longitude
	const [latitude, longitude] = cellToLatLng(cell)

	return new GeoPoint([longitude, latitude])
}

export function cellToPointLiteral(cell: H3Cell): PointLiteral {
	const [latitude, longitude] = cellToLatLng(cell)

	return {
		type: "Point",
		coordinates: [longitude, latitude],
	}
}
