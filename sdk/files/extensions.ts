/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { isIndexedIterable } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
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

/**
 * Runtime assertion that a file extension is one of the expected values.
 */
export function assertExpectedFileExtension<Expected extends string>(
	/**
	 * The expected file extension or an iterable of expected file extensions.
	 */
	expectedExtension: Expected | Iterable<Expected>,
	/**
	 * The actual file extension, provided during runtime.
	 */
	actualExtension: string | undefined | null
): asserts actualExtension is Expected {
	if (!actualExtension) throw new Error("Assertion failed: fileExtension is falsy")

	if (typeof expectedExtension === "string") {
		if (actualExtension !== expectedExtension)
			throw ResourceError.from(417, `Assertion failed: fileExtension is not ${expectedExtension}`)
	} else {
		const expectedSet = isIndexedIterable(expectedExtension) ? expectedExtension : new Set(expectedExtension)

		if (!expectedSet.has(actualExtension as Expected))
			throw ResourceError.from(
				417,
				`Assertion failed: fileExtension is not one of ${Array.from(expectedExtension).join(", ")}`
			)
	}
}
