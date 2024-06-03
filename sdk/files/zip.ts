/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import ADMZip from "adm-zip"

export type ZipEntryContentPair = [entry: ADMZip.IZipEntry, content: Buffer]

/**
 * Extract the contents of a zip file.
 *
 * @category Files
 * @internal
 */
export function extractZip(data: ArrayBuffer | Buffer) {
	const normalizedData = data instanceof ArrayBuffer ? Buffer.from(data) : data
	const zip = new ADMZip(normalizedData)
	const pairs = zip
		.getEntries()
		.map((entry) => [entry, zip.readFile(entry)])
		.filter((pair): pair is ZipEntryContentPair => pair[1] !== null)

	if (pairs.length === 0) {
		throw new Error("No entry pairs found in zip file.")
	}

	return new Map<ADMZip.IZipEntry, Buffer>(pairs)
}

/**
 * Extract the contents of a zip file and return the first entry.
 */
export function extractSingleFileZip(data: ArrayBuffer | Buffer) {
	const normalizedData = data instanceof ArrayBuffer ? Buffer.from(data) : data
	const zip = new ADMZip(normalizedData)

	const [entry] = zip.getEntries()
	// We use the async version of getData to avoid blocking the event loop.
	return new Promise<Buffer>((resolve, reject) =>
		entry!.getDataAsync((extractedData, error) => {
			if (error) {
				reject(error)
			} else {
				resolve(extractedData)
			}
		})
	)
}
