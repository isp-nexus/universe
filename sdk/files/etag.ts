/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   ETag generation.
 */

import { BinaryLike, createHash } from "node:crypto"
import { fnv1a } from "./fnv1a.js"

function validateAlgorithm(algorithm: string) {
	if (algorithm === "fnv1a") {
		return true
	}

	// validate that the algorithm is supported by the node runtime
	try {
		createHash(algorithm)
	} catch (_e) {
		throw new TypeError(`Algorithm ${algorithm} not supported.`)
	}
}

function buildHashFn(algorithm = "sha1", weak = false) {
	validateAlgorithm(algorithm)

	const prefix = weak ? 'W/"' : '"'
	if (algorithm === "fnv1a") {
		return (payload: string | Buffer) => prefix + fnv1a(payload).toString(36) + '"'
	}

	return (payload: BinaryLike) => prefix + createHash(algorithm).update(payload).digest("base64") + '"'
}

export function createETag(input: string, algorithm = "sha1", weak = false) {
	const hash = buildHashFn(algorithm, weak)
	return hash(input)
}
