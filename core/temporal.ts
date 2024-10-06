/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for working with temporal data, such as dates and times.
 */

import type { Tagged } from "type-fest"

/**
 * A string type to indicate ISO 8601 formatted content.
 *
 * Note that this may be a date, time, or date and time.
 *
 * @category Temporal
 */
export type ISODateTimeString = Tagged<string, "ISODateTimeString">

/**
 * Unserialize a date string into a Date object.
 *
 * @category Temporal
 */
export function unserializeDate(date: string | unknown): Date | undefined {
	if (typeof date === "string") return new Date(date)
	return undefined
}
