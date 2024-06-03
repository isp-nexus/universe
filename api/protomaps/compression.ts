/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { Compression, DecompressFunc } from "pmtiles"

export const decompressPMTileBuffer: DecompressFunc = async (buf, compression) => {
	if (compression === Compression.None || compression === Compression.Unknown) {
		return buf
	}

	if (compression === Compression.Gzip) {
		const stream = new Response(buf).body
		const result = stream?.pipeThrough(new DecompressionStream("gzip"))

		return new Response(result).arrayBuffer()
	}
	throw Error("Compression method not supported")
}
