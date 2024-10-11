/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { basename as _basename } from "node:path"
import type { Split } from "type-fest"
import { PathBuilder } from "./path-builder.js"

/**
 * Pluck the base name from a path.
 */
export type Basename<T extends string> =
	Split<T, "/"> extends [...infer _Head, infer Tail] ? (Tail extends string ? Tail : never) : never

/**
 * Return the last portion of a path. Similar to the Unix basename command. Often used to extract
 * the file name from a fully qualified path.
 *
 * @param path — the path to evaluate.
 * @param suffix — optionally, an extension to remove from the result.
 * @throws — {TypeError} if path is not a string or if ext is given and is not a string.
 */
export function basename<T extends PathBuilder | string>(
	path: T
): T extends PathBuilder<infer U> ? PathBuilder<Basename<U>> : T extends string ? PathBuilder<Basename<T>> : never {
	return PathBuilder.from(_basename(path.toString())) as any
}
