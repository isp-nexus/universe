/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { EtagMismatch, RangeResponse, Source } from "pmtiles"
import { assertR2KeyMatch, assertR2ObjectBody } from "../storage.js"

export class KeyNotFoundError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "KeyNotFoundError"
	}
}

export interface R2SourceConfig {
	bucket: R2Bucket
	pathPrefix: string
	tileSetName: string
}

/**
 * A PMTiles source that retrieves tiles from an R2 bucket.
 */
export class R2Source implements Source {
	protected bucket: R2Bucket
	protected tileSetName: string
	protected tileSetPath: string

	constructor({ bucket, tileSetName, pathPrefix }: R2SourceConfig) {
		if (!bucket) throw ResourceError.from(400, "Cannot create R2Source without a bucket")
		if (!tileSetName) throw ResourceError.from(400, "Cannot create R2Source without a tile set name")
		if (!pathPrefix) throw ResourceError.from(400, "Cannot create R2Source without a path prefix")

		this.bucket = bucket
		this.tileSetName = tileSetName
		this.tileSetPath = `${pathPrefix}/${this.tileSetName}.pmtiles`
	}

	getKey() {
		return this.tileSetName
	}

	async getBytes(offset: number, length: number, _signal?: AbortSignal, etag?: string): Promise<RangeResponse> {
		const response = await this.bucket.get(this.tileSetPath, {
			range: { offset, length },
			onlyIf: { etagMatches: etag },
		})

		assertR2KeyMatch(response)
		assertR2ObjectBody(response, EtagMismatch as ErrorConstructor)

		return {
			data: await response.arrayBuffer(),
			etag: response.etag,
			cacheControl: response.httpMetadata?.cacheControl,
			expires: response.httpMetadata?.cacheExpiry?.toISOString(),
		}
	}
}
