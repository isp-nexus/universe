/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Path reflection utilities for the ISP Nexus mono-repo.
 */

/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */

import { join } from "node:path"
import type { Join } from "type-fest"

/**
 * Type-safe path builder.
 *
 * @external URL - The URL class.
 * @template S - The type of the path string.
 */
export interface PathBuilder<S extends string> extends URL, Omit<string, keyof URL> {
	/**
	 * Append additional path segments to the current path.
	 */
	<T extends Array<string | number>>(...additionalPathSegments: T): PathBuilder<Join<[S, ...T], "/">> & string
}

/**
 * Type-safe path builder.
 */
export class PathBuilder<S extends string = string> extends URL implements PathBuilder<S> {
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
	 * Create a type-safe path builder.
	 */
	public static from<S extends Array<string | number>>(...pathSegments: S): PathBuilder<Join<S, "/">> & string {
		const joinedPath = join(...pathSegments.map((pathSegment) => pathSegment.toString())) as Join<S, "/">
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
export type PathBuilderLike<S extends string = string> = S | (PathBuilder<S> & string)
