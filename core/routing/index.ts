/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/// <reference types="../../node_modules/urlpattern-polyfill/dist/index.d.ts" />

import type { AxiosRequestConfig } from "axios"

/**
 * Derived from React Router, this type helper is used to extract the parameters from a path
 * pattern.
 *
 * @internal
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URLPattern | MDN: URLPattern}
 */
export type ParamPattern<Path extends string> = Path extends "*" | "/*"
	? "*"
	: Path extends `${infer Rest}/*`
		? "*" | _$PathParam<Rest>
		: _$PathParam<Path>

/**
 * Type helper to extract the parameters from a path pattern.
 *
 * @internal
 */
type _$PathParam<Path extends string> = Path extends `${infer L}${"/" | "."}${infer R}`
	? _$PathParam<L> | _$PathParam<R>
	: Path extends `:${infer Param}`
		? Param extends `${infer Optional}?`
			? Optional
			: Param extends `${infer ParamName}(${infer _ParamPattern})`
				? ParamName
				: Param
		: never

export type URLPatternPathnameInit = Pick<Required<URLPatternInit>, "pathname">

/**
 * Either a URLPattern or a pathname pattern string.
 */
export type URLRouteInit<I extends URLPatternPathnameInit | string> = I extends string ? { pathname: I } : I

/**
 * Type helper to extract the parameters from a URL Pattern pathname.
 */
export type ExtractURLPatternPathnameParams<I extends URLPatternInit | string> = I extends string
	? ParamPattern<I>
	: I extends URLPatternPathnameInit
		? ParamPattern<I["pathname"]>
		: never

/**
 * Type helper to extract a URL Pattern pathname.
 */
export type ExtractURLPatternPathname<I extends URLPatternPathnameInit | string> = I extends string
	? I
	: I extends URLPatternPathnameInit
		? I["pathname"]
		: never

/**
 * A record of path parameter names to their raw values.
 */
export type URLPatternPathParameters<I extends URLPatternPathnameInit | string, V extends string | number = string> = {
	[key in ExtractURLPatternPathnameParams<I>]: V
}

const URLPatternComponents = [
	"protocol",
	"username",
	"hostname",
	"port",
	"pathname",
	"password",
	"search",
	"hash",
] as const satisfies readonly (keyof URLPatternInit)[]

/**
 * A URL pattern with path parameters.
 */
// @ts-ignore: Property 'UrlPattern' does not exist
export class URLRoutePattern<I extends URLPatternPathnameInit | string = string> extends URLPattern {
	public override toString(): string {
		return JSON.stringify(this.toJSON(), null, "\t")
	}

	constructor(init: I) {
		const normalizedInit = typeof init === "string" && !init.startsWith("http") ? { pathname: init } : init
		super(normalizedInit)
	}

	static from<I extends URLPatternPathnameInit | string>(init: I): URLRoutePattern<I> {
		return new URLRoutePattern(init)
	}

	/**
	 * Given a URL, attempts to match the path parameters.
	 */
	public matchParams(input: URLPatternInit | string, baseURL?: string): null | URLPatternPathParameters<I> {
		return super.exec(input, baseURL)?.pathname.groups as URLPatternPathParameters<I>
	}

	/**
	 * Given a set of parameters, returns an Axios configuration object.
	 */
	public toAxiosConfig(params: Partial<URLPatternPathParameters<I, string | number>> = {}): {
		url: string
		params: Partial<URLPatternPathParameters<I, string | number>>
	} {
		// First, we start with our uncompiled pathname pattern.
		const components = this.toJSON()

		const url = new URL(
			components.pathname || "/",
			components.baseURL || `${components.protocol || "https"}://${components.hostname || "localhost"}`
		)

		url.username = components.username || ""
		url.password = components.password || ""
		url.port = components.port || ""

		let { pathname } = this
		const paramPairs = Object.entries(params) as Array<[keyof URLPatternPathParameters<I>, string | number]>
		const remainingParams = { ...params }

		// ...Iterating over each parameter in the params object...
		for (const [paramName, paramValue] of paramPairs) {
			// Next, we check if the pathname pattern includes the param name.
			const paramPattern = `:${paramName}`

			const paramPatternIndex = pathname.indexOf(paramPattern)
			if (paramPatternIndex === -1) continue

			// Is the param present?
			if (!paramValue) continue

			let normalizedParamValue: string

			switch (typeof paramValue) {
				case "string":
					normalizedParamValue = encodeURIComponent(paramValue)
					break
				case "number":
					normalizedParamValue = encodeURIComponent(paramValue.toString())
					break
				default:
					console.warn(`Unexpected parameter value type: ${typeof paramValue}`)
					continue
			}

			// We replace the param pattern with the normalized param value.
			pathname =
				pathname.slice(0, paramPatternIndex) +
				normalizedParamValue +
				pathname.slice(paramPatternIndex + paramPattern.length)

			delete remainingParams[paramName]
		}

		url.pathname = pathname
		const href = url.href

		// We have what appears to be complete URL configuration, so let's test it.
		const spec = new URLPattern(components)

		if (!spec.test(href)) {
			throw new Error(
				`Insufficient parameters to compile URL route: ${this.pathname} (${JSON.stringify(params)}) -> ${pathname}`
			)
		}

		const config = {
			url: components.hostname ? href : url.pathname,
			params: remainingParams,
		} satisfies Pick<AxiosRequestConfig, "url" | "params">

		return config
	}

	/**
	 * Compiles the URL route with the given parameters.
	 */
	public compile(params: URLPatternPathParameters<I, string | number>): string {
		return this.toAxiosConfig(params).url
	}

	public toURL(params: URLPatternPathParameters<I>, baseURL?: string): URL {
		return new URL(this.compile(params), baseURL)
	}

	public toJSON(): URLPatternInit {
		const result: URLPatternInit = {}

		for (const component of URLPatternComponents) {
			const value = this[component]

			if (!value) continue
			if (value === "*") continue

			result[component] = value
		}

		return result
	}
}
