/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

export function pluckFileExtension(fsPath: unknown): string | null {
	if (typeof fsPath !== "string") return null
	const lastDotIndex = fsPath.lastIndexOf(".")

	if (lastDotIndex === -1) return null

	return fsPath.slice(lastDotIndex + 1)
}

export const GeoJSONMatcher: FileMatcher = {
	languageID: "geojson",
	extensions: ["geojson", "json"],
	mimeTypes: ["application/json", "application/geo+json"],
}

export const GeoJSONSequenceMatcher: FileMatcher = {
	languageID: "geojsons",
	extensions: ["geojson", "ndjson", "json"],
	mimeTypes: [
		"application/geo+json-sequence",
		"application/x-ndjson",
		"", // Possible if we can't determine the mime type.
	],
}

export const VectorLikeFileMatchers = [GeoJSONMatcher, GeoJSONSequenceMatcher]

export function matchFile(
	matcher: FileMatcher | FileMatcher[],
	fsPath?: string,
	languageID?: string
): FileMatcher | null {
	const matchers = Array.isArray(matcher) ? matcher : [matcher]

	for (const $matcher of matchers) {
		if (languageID && languageID === $matcher.languageID) return $matcher

		if (!fsPath) continue

		const extension = pluckFileExtension(fsPath)

		if (extension && $matcher.extensions.includes(extension)) return $matcher
	}

	return null
}
