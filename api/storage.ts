/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"

export function assertR2KeyMatch(r2Response: R2Object | R2ObjectBody | null): asserts r2Response {
	if (!r2Response) {
		throw ResourceError.from(404, "Archive not found", "pmtiles", "r2", "missing-key")
	}
}

export function assertR2ObjectBody(
	r2Response: R2Object | R2ObjectBody,
	ErrorConstructor: typeof Error = Error
): asserts r2Response is R2ObjectBody {
	if (!("body" in r2Response)) {
		throw new ErrorConstructor("Expected R2Object to have a body")
	}
}
