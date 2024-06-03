/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger } from "./logging/index.js"

/**
 * Promise-based sleep function.
 *
 * @param timeout - Time to sleep in milliseconds.
 */
export function waitForTimeout(timeout: number, message?: string): Promise<void> {
	return new Promise((resolve) => {
		if (message) {
			ConsoleLogger.info(`[Timer ${(timeout / 1000).toFixed(2)}s] ${message}`)
		}

		return setTimeout(resolve, timeout)
	})
}
