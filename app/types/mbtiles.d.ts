/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

declare module "@mapbox/mbtiles" {
	import tiletype from "@mapbox/tiletype"

	class MBTiles {
		constructor(sourcePath: string, callback: (err: Error, mbtiles: MBTiles) => void)

		getTile(
			z: number | string,
			x: number | string,
			y: number | string,
			callback: (err: Error, data: Buffer, headers: tiletype.Header) => void
		): void

		getInfo(callback: (err: Error, info: { [key: string]: any }) => void): void

		close(callback: (err: Error) => void): void
	}

	export default MBTiles
}
