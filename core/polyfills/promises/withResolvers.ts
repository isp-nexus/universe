/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Polyfills for Promises.
 */

if (!Promise.withResolvers) {
	Promise.withResolvers = function <T>(this: PromiseConstructor): PromiseWithResolvers<T> {
		if (!this) throw new TypeError("Promise.withResolvers called on non-object")
		const out = {} as PromiseWithResolvers<T>

		out.promise = new this((resolve_, reject_) => {
			out.resolve = resolve_
			out.reject = reject_
		})

		return out
	}
}
