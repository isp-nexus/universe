/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import PinoPretty, { PrettyOptions } from "pino-pretty"

function prettyTransporter(options: PrettyOptions) {
	/**
	 * Pretty print Pino logs.
	 *
	 * @internal
	 */
	const pretty = PinoPretty({
		...options,
		customPrettifiers: {
			// geometry: (value, key, options, extras) => {
			// 	return jsonColorizer.colorize(value)
			// 	// return `GEOCODE!! ${value}`
			// },
		},
		ignore: "pid,hostname",
		translateTime: "SYS:HH:MM:ss",
	})

	return pretty
}

export default prettyTransporter
