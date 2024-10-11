/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Path reflection utilities for the ISP Nexus mono-repo.
 */

/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */

import { basename, dirname, join } from "node:path"
import type { Join } from "type-fest"
import type { Basename } from "./basename.js"
import type { Dirname } from "./dirname.js"

/**
 * Type-safe path builder.
 *
 * @external URL - The URL class.
 * @template S - The type of the path string.
 */
export interface PathBuilder<S extends string> extends URL, Omit<String, keyof URL> {
	/**
	 * Append additional path segments to the current path.
	 */
	// Note: We shadow PathBuilder to allow instances of PathBuilder to be used as a function.
	<T extends Array<string | number>>(...additionalPathSegments: T): PathBuilder<Join<[S, ...T], "/">>
}

/**
 * Type-safe path builder.
 */
export class PathBuilder<S extends string = string> extends URL implements PathBuilder<S> {
	/**
	 * Directory name of a path. Similar to the Unix dirname command.
	 */
	public dirname(): PathBuilder<Dirname<S>> {
		return PathBuilder.from(dirname(this.toString())) as any
	}

	/**
	 * Base name of a path. Similar to the Unix basename command.
	 */
	public basename(): PathBuilder<Basename<S>> {
		return PathBuilder.from(basename(this.toString())) as any
	}

	/**
	 * Get the current path as a string.
	 */
	public override toString(): S {
		return this.pathname as S
	}

	protected constructor(path: S, base: string | URL = "file://") {
		super(path, base)
	}

	public get [Symbol.toStringTag](): S {
		return this.toString()
	}

	public get length() {
		return this.toString().length
	}

	public [Symbol.toPrimitive](): S {
		return this.toString()
	}

	public [Symbol.for("nodejs.util.inspect.custom")]() {
		return this.toString()
	}

	// @note This fixes invalid Markdown in the base class JSDoc.
	/**
	 * The port of the URL.
	 */
	public declare port: string

	/**
	 * Normalize a path builder into a type-safe path builder.
	 *
	 * This is typical if your given path is {@linkcode PathBuilderLike}
	 */
	public static from<P1 extends string, Pn extends string[]>(
		pathBuilder: PathBuilder<P1>,
		...pathSegmentN: Pn
	): PathBuilder<Join<[P1, ...Pn], "/">>

	/**
	 * Create a new path builder from a string.
	 */
	public static from<P1 extends string, Pn extends string[]>(
		pathSegment1: P1,
		...pathSegmentN: Pn
	): PathBuilder<Join<[P1, ...Pn], "/">>

	/**
	 * Normalize a path builder or string into a type-safe path builder.
	 *
	 * This is typical if your given path is {@linkcode PathBuilderLike}
	 */
	public static from<P extends PathBuilder | string, Pn extends string[]>(
		pathBuilderLike: P,
		...pathSegmentN: Pn
	): PathBuilder<Join<[P extends PathBuilder<infer T> ? T : P, ...Pn], "/">>

	public static from<P extends PathBuilder | string, Pn extends string[]>(
		pathBuilderLike: P,
		...pathSegmentN: Pn
	): PathBuilder<Join<[P extends PathBuilder<infer T> ? T : P, ...Pn], "/">> {
		const joinedPath = join(
			// ---
			pathBuilderLike.toString(),
			...pathSegmentN.map((pathSegment) => pathSegment.toString())
		)

		const pathBuilderInstance = new PathBuilder(joinedPath)
		const toString = pathBuilderInstance.toString.bind(pathBuilderInstance)

		const PathBuilderProxy = new Proxy(PathBuilder.from, {
			apply(target, _thisArg, args) {
				return target(joinedPath, ...args)
			},

			get(target, prop) {
				switch (prop) {
					case Symbol.toPrimitive:
					case Symbol.for("nodejs.util.inspect.custom"):
					case "toString":
					case "valueOf":
						return toString
					case "name":
						return "PathBuilderProxy"
				}

				if (prop === Symbol.toStringTag) return toString()

				if (prop in pathBuilderInstance) {
					return (pathBuilderInstance as any)[prop]
				}

				return (target as any)[prop]
			},

			getPrototypeOf() {
				return PathBuilder.prototype
			},

			[Symbol.for("nodejs.util.inspect.custom")]() {
				return "PathBuilder"
			},
		})

		Object.assign(PathBuilderProxy, {
			[Symbol.for("nodejs.util.inspect.custom")]: () => pathBuilderInstance.pathname,
		})

		return PathBuilderProxy as any
	}
}

for (const [propertyName, propertyDescriptor] of Object.entries(Object.getOwnPropertyDescriptors(String.prototype))) {
	if (propertyName === "constructor") continue
	if (propertyName === "toString") continue
	if (propertyName === "valueOf") continue
	if (propertyName === "length") continue

	if (Object.hasOwn(URL.prototype, propertyName)) continue

	try {
		Object.defineProperty(PathBuilder.prototype, propertyName, propertyDescriptor)
	} catch (e) {
		console.error(`Failed to assign property ${propertyName} to PathBuilder prototype:`, e)
	}
}

/**
 * Type-safe path builder or string.
 */
export type PathBuilderLike<T = string | PathBuilder> =
	T extends PathBuilder<infer S> ? PathBuilder<S> : T extends string ? T : never
