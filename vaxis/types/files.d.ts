/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

export {}

/**
 * Global augmentation for file matchers.
 *
 * @internal
 */
declare global {
	export interface FileMatcher {
		languageID: string
		extensions: string[]
		mimeTypes: string[]
	}

	export interface EditorFileMatch extends FileMatcher {
		filename: string
		content: string
	}
}
