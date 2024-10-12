/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { dirname as _dirname } from "node:path"
import type { Join, Split } from "type-fest"
import { PathBuilder } from "./path-builder.js"

/**
 * Pluck the directory name from a path.
 */
export type Dirname<T extends string> =
	Split<T, "/"> extends [...infer Head, infer _Tail]
		? Head extends string[]
			? Join<Head, "/">
			: Head extends string
				? Head
				: never
		: never

/**
 * Return the directory name of a path. Similar to the Unix dirname command.
 *
 * @throws — {TypeError} if path is not a string.
 */
export function dirname<T extends PathBuilder | string>(
	path: T
): T extends PathBuilder<infer U> ? PathBuilder<Dirname<U>> : T extends string ? PathBuilder<Dirname<T>> : never {
	return PathBuilder.from(_dirname(path.toString())) as any
}

export { dirname as pathBuilderDirname }
