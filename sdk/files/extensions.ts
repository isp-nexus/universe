/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { basename as pluckBaseName } from "node:path"

/**
 * Pluck the file extension from a file name.
 *
 * Handles files with no extension, multiple dots, and hidden files.
 */
export function pluckFileExtension(fileName: string): string {
	const basename = pluckBaseName(fileName)
	const dotIndex = basename.indexOf(".")

	return dotIndex === -1 ? "" : basename.slice(dotIndex + 1)
}

export function changeFileExtension(fileName: string, newExtension: string): string {
	const basename = pluckBaseName(fileName)
	const dotIndex = basename.indexOf(".")

	return dotIndex === -1 ? fileName + "." + newExtension : fileName.slice(0, -basename.length + dotIndex) + newExtension
}
