/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { resolve as _resolve } from "node:path"
import { Join } from "type-fest"
import { PathBuilder, PathBuilderLike } from "./path-builder.js"

/**
 * Type-utility for resolving a relative path-like string to an absolute path.
 */
export type ResolvePathString<
	S extends string,
	Root extends string = "/",
	Ss extends string[] = [],
> = S extends `/${string}` ? Join<[S, ...Ss], "/"> : `${Root}/${Join<[S, ...Ss], "/">}`

/**
 * Type-utility for resolving a relative path-like string to an absolute path.
 *
 * This is useful for converting relative paths to absolute paths, such as when creating
 * higher-order path builders that are relative to a project root.
 */
export type ResolvePathBuilderLike<
	T extends PathBuilderLike = PathBuilderLike,
	Root extends string = "/",
	Pn extends string[] = [],
> =
	T extends PathBuilder<infer S>
		? ResolvePathString<S, Root, Pn>
		: T extends string
			? ResolvePathString<T, Root, Pn>
			: never

/**
 * The right-most parameter is considered {to}. Other parameters are considered an array of {from}.
 *
 * Starting from leftmost {from} parameter, resolves {to} to an absolute path.
 *
 * If {to} isn't already absolute, {from} arguments are prepended in right to left order, until an
 * absolute path is found. If after using all {from} paths still no absolute path is found, the
 * current working directory is used as well. The resulting path is normalized, and trailing slashes
 * are removed unless the path gets resolved to the root directory.
 *
 * @param pathSegment1 A sequence of paths or path segments.
 * @param pathSegmentN A sequence of paths or path segments.
 * @throws {TypeError} If any of the arguments is not a string.
 */
export function resolvePathBuilder<T extends PathBuilderLike, Pn extends string[]>(
	pathSegment1?: T,
	...pathSegmentN: Pn
): PathBuilder<ResolvePathBuilderLike<T, "/{$CWD}", Pn>> {
	const resolved_string = _resolve(pathSegment1?.toString() || "", ...pathSegmentN)

	return PathBuilder.from(resolved_string) as any
}

export interface PathBuilderResolver<RuntimeRootAlias extends string = "~"> {
	(): PathBuilder<RuntimeRootAlias>

	<T extends PathBuilderLike, Pn extends string[] = []>(
		pathSegment1?: T,
		...pathSegmentN: Pn
	): PathBuilder<ResolvePathBuilderLike<T, RuntimeRootAlias, Pn>>
}

/**
 * Create a custom path builder resolver with a bound root.
 *
 * This is useful for creating higher-order path builders that are relative to a project root.
 *
 * @param absoluteRuntimeRoot The absolute path to the root of the project. Note that this should be
 *   an absolute path, not a relative path. If you compile your project to a different location, you
 *   should use the absolute path to the root of the compiled project.
 *
 * @returns A custom path builder resolver.
 */
export function createPathBuilderResolver<RuntimeRootAlias extends string = "~">(
	absoluteRuntimeRoot: string
): PathBuilderResolver<RuntimeRootAlias> {
	const customPathBuilderResolver = (...args: PathBuilderLike[]) => {
		return resolvePathBuilder(absoluteRuntimeRoot, ...args.map((arg) => arg.toString()))
	}

	return customPathBuilderResolver as any
}

export { resolvePathBuilder as resolve }
