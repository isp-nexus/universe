/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Query builder utilities.
 */

import type { ISODateTimeString } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import type { Tagged } from "type-fest"
import { FindOptionsWhere } from "typeorm"

export type SQLFieldWithoutPostProcessing = string | number

/**
 * A row of data that has not been fully parsed by TypeORM.
 */
export type UnparsedRow<T> = {
	[P in keyof T]: T[P] extends SQLFieldWithoutPostProcessing
		? T[P]
		: T[P] extends Date
			? ISODateTimeString
			: T[P] extends Iterable<infer U>
				? Tagged<string, "RowArray", U>
				: Tagged<string, "RowField", T[P]>
}

/**
 * Creates a where clause such as that each criteria only needs to be met once.
 */
export function matchOne<T>(criteria: Partial<T>[]): FindOptionsWhere<T>[] {
	const record = criteria.map((c) =>
		Object.entries(c).reduce(
			(acc, [key, value]) => {
				if (value) {
					acc[key] = value
				}
				return acc
			},
			{} as Record<string, any>
		)
	)

	const hasCriteria = record.some((x) => Object.keys(x).length > 0)

	if (!hasCriteria) {
		throw ResourceError.from(
			400,
			`At least one criteria must be provided (${JSON.stringify(criteria)})`,
			"columnMatchSome"
		)
	}

	return record
}
