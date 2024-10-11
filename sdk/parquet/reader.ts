/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for reading Parquet files.
 */

import "@isp.nexus/core/polyfills/promises/withResolvers"

import { ParquetReader as BaseParquetReader } from "@dsnp/parquetjs"
import { BufferReaderOptions } from "@dsnp/parquetjs/dist/lib/bufferReader.js"
import { ParquetEnvelopeReader } from "@dsnp/parquetjs/dist/lib/reader.js"
import { PathBuilderLike } from "path-ts"
import { ParquetRecordLike, ParquetSchema } from "./schema.js"

/**
 * A typed Parquet reader, wrapping the base Parquet reader.
 */
export class ParquetReader<T extends ParquetRecordLike> extends BaseParquetReader implements AsyncDisposable {
	declare schema: ParquetSchema<T>

	static override async openFile<T extends ParquetRecordLike>(
		filePath: PathBuilderLike,
		options?: BufferReaderOptions
	): Promise<ParquetReader<T>> {
		const envelopeReader = await ParquetEnvelopeReader.openFile(filePath.toString(), options)

		return ParquetReader.openEnvelopeReader<T>(envelopeReader, options)
	}

	static override async openBuffer<T extends ParquetRecordLike>(buffer: Buffer, options?: BufferReaderOptions) {
		const envelopeReader = await ParquetEnvelopeReader.openBuffer(buffer, options)

		return this.openEnvelopeReader<T>(envelopeReader, options)
	}

	static override async openEnvelopeReader<T extends ParquetRecordLike>(
		envelopeReader: ParquetEnvelopeReader,
		opts?: BufferReaderOptions
	) {
		if (opts?.metadata) {
			return new ParquetReader<T>(opts.metadata, envelopeReader, opts)
		}

		try {
			await envelopeReader.readHeader()

			const metadata = await envelopeReader.readFooter()

			return new ParquetReader<T>(metadata, envelopeReader, opts)
		} catch (err) {
			await envelopeReader.close()
			throw err
		}
	}

	public override [Symbol.asyncIterator](): AsyncGenerator<T, void, unknown> {
		return super[Symbol.asyncIterator]() as AsyncGenerator<T, void, unknown>
	}

	public async [Symbol.asyncDispose]() {
		return this.close()
	}

	public async dispose() {
		return this[Symbol.asyncDispose]()
	}
}
