/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { TileType } from "pmtiles"

export const TileTypeFileExtensions = new Set(["avif", "jpg", "mvt", "png", "webp"] as const)
export type TileTypeFileExtension = typeof TileTypeFileExtensions extends Set<infer T> ? T : never

/**
 * PM Tile file extension to tile type.
 */
export const TileFileExtensionMap = new Map([
	["avif", TileType.Avif],
	["jpg", TileType.Jpeg],
	["mvt", TileType.Mvt],
	["png", TileType.Png],
	["webp", TileType.Webp],
]) satisfies ReadonlyMap<TileTypeFileExtension, TileType>

/**
 * PM Tile type to file extension.
 */
export const TileTypeFileExtensionMap = new Map(
	Array.from(TileFileExtensionMap).map(([k, v]) => [v, k] as const)
) as ReadonlyMap<TileType, TileTypeFileExtension>

/**
 * PM tile types to content types.
 */
export const TileTypeToContentType = {
	[TileType.Unknown]: "application/octet-stream",
	[TileType.Avif]: "image/avif",
	[TileType.Jpeg]: "image/jpeg",
	[TileType.Mvt]: "application/x-protobuf",
	[TileType.Png]: "image/png",
	[TileType.Webp]: "image/webp",
} as const satisfies Record<TileType, string>
