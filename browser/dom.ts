/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * @typedef {Object} DocumentOwner
 * @property {Document} document The document object.
 */

/**
 * Predicate function to determine if the given object includes a `document` instance.
 *
 * @param {Window | Global} windowOrGlobal The window or global object to check.
 *
 * @returns {windowOrGlobal is DocumentOwner}
 * @internal
 */
export function isDocumentOwner(windowOrGlobal = window) {
	return windowOrGlobal && typeof windowOrGlobal === "object" && "document" in windowOrGlobal
}

/**
 * Creates a promise that blocks until the DOM has loaded.
 *
 * ```js
 *
 * function initialize() {
 *  // ...
 * }
 *
 * waitUntilDOMReady().then(initialize)
 * ```
 */
export function waitUntilDOMReady(windowOrGlobal = window): Promise<void> {
	return new Promise((resolve, reject) => {
		if (!isDocumentOwner(windowOrGlobal)) {
			return reject("`document` is not defined. Was this method called on the server?")
		}

		if (windowOrGlobal.document.readyState === "loading") {
			windowOrGlobal.document.addEventListener("DOMContentLoaded", () => resolve())
		} else {
			resolve()
		}
	})
}
