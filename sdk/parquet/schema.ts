/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ParquetSchema as BaseParquetSchema } from "@dsnp/parquetjs"
import type { createSBBFParams as BloomFilterCreation } from "@dsnp/parquetjs/dist/lib/bloomFilterIO/bloomFilterWriter.js"
import type { FieldDefinition } from "@dsnp/parquetjs/dist/lib/declare.js"
import { LRUCache } from "lru-cache"

/**
 * A Parquet record-like object, i.e. a record with string keys and JSON-serializable values.
 */
export type ParquetRecordLike = {
	[key: string]: unknown | undefined
}

/**
 * Typed Parquet schema definition.
 */
export type ParquetSchemaDefinition<T = ParquetRecordLike> = {
	[field in Extract<keyof T, string>]: FieldDefinition
}

/**
 * Typed Parquet schema.
 */
export class ParquetSchema<T> extends BaseParquetSchema {
	declare schema: ParquetSchemaDefinition<T>
}

/**
 * Given a Parquet schema and a list of columns, create a list of Bloom filters for those columns.
 */
export function createBloomFilters<T>(
	parquetSchemaDef: ParquetSchemaDefinition<T>,
	columns: Extract<keyof T, string>[]
) {
	const bloomFilters: BloomFilterCreation[] = []

	for (const column of columns) {
		if (!parquetSchemaDef[column]) {
			throw new Error(`Bloom filter column ${column} not found in Parquet schema`)
		}

		bloomFilters.push({ column })
	}

	return bloomFilters
}

export class ParquetSchemaDefinitionCache
	extends LRUCache<ParquetSchemaDefinition<any>, ParquetSchema<any>>
	implements Disposable
{
	constructor(max = 1000) {
		super({
			max,
		})
	}

	public findOrCreateSchema<T extends ParquetRecordLike>(schemaDef: ParquetSchemaDefinition<T>): ParquetSchema<T> {
		let schema = this.get(schemaDef)

		if (!schema) {
			schema = new ParquetSchema(schemaDef)
			this.set(schemaDef, schema)
		}

		return schema
	}

	public async [Symbol.dispose]() {
		this.clear()
	}
}
