/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

export interface IndentOptions {
	indentCharacter?: string
	includeEmptyLines?: boolean
}

/**
 * Indent each line in a string by a given amount.
 *
 * @param input - The string to indent.
 * @param count - The number of times to indent the string.
 * @param options - The options for the indentation.
 */
export function indent(
	input: string,
	count = 1,
	{ indentCharacter = "\t", includeEmptyLines = false }: IndentOptions = {}
): string {
	if (count === 0) {
		// We simply remove all leading whitespace.
		return input.replace(/^[ \t]+/gm, "")
	}

	const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm

	return input.replace(regex, indentCharacter.repeat(count))
}

/**
 * Get the shortest leading whitespace from lines in a string.
 */
export function findMinimumIndent(input: string): number {
	const match = input.match(/^[ \t]*(?=\S)/gm)

	if (!match) return 0

	return match.reduce((r, a) => Math.min(r, a.length), Infinity)
}

/**
 * Strip the leading whitespace from each line in a string.
 */
export function prettyIndent(input: string): string {
	input = input.trim()

	const indentSize = findMinimumIndent(input)

	if (indentSize === 0) return input

	const pattern = new RegExp(`^[ \\t]{${indentSize}}`, "gm")

	return input.replace(pattern, "")
}
