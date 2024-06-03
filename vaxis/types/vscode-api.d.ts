/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

export {}

/**
 * Global augmentation for VS Code webviews.
 *
 * @internal
 */
declare global {
	/**
	 * VS Code API for the webview.
	 */
	interface VSCodeAPI {
		/**
		 * Post a message to the extension.
		 *
		 * @param message JSON-serializable payload to send to the extension.
		 */
		postMessage: (message: {}) => void

		/**
		 * Persist the state of the webview.
		 */
		setState: (state: {}) => void

		/**
		 * Get the current state of the webview.
		 */
		getState: <T extends {} = unknown>() => T | null
	}

	/**
	 * Acquires the VS Code API for the current webview.
	 */
	function acquireVsCodeApi(): VSCodeAPI
}
