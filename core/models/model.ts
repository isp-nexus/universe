/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { kebabCase } from "change-case"
import { KebabCase, SnakeCase } from "type-fest"
import { BaseEntity } from "typeorm"
import { smartSnakeCase } from "../identifiers.js"
import { PickJSON, pickJSON } from "./utils.js"

//#region JSON Pragma Types

/**
 * URL to the ISP Nexus schema store.
 *
 * @category Nexus
 * @format url
 * @public
 */
export const ISPNexusSchemaURL = "https://schema.isp.nexus"
export type ISPNexusSchemaURL = typeof ISPNexusSchemaURL

/**
 * A unique identifier for a JSON schema.
 *
 * @ignore
 * @category JSON Schema
 * @title JSON Schema ID
 * @internal
 */
export interface JSONSchemaID<SchemaName extends string = string> {
	name: SchemaName
	pathname: `/${KebabCase<SchemaName>}`
	tableName: SnakeCase<SchemaName>
	url: `${ISPNexusSchemaURL}/${KebabCase<SchemaName>}`
}

export function JSONSchemaID<SchemaName extends string>(schemaName: SchemaName) {
	const pathname = `/${kebabCase(schemaName)}` as const
	const url = `${ISPNexusSchemaURL}${pathname}` as const

	return {
		name: schemaName,
		tableName: smartSnakeCase(schemaName),
		pathname,
		url,
	} as JSONSchemaID<SchemaName>
}

// /**
//  * Convenience function to import a type-safe JSON schema.
//  *
//  * @internal
//  */
// export async function importJSONSchema<T extends JSONSchema7 = JSONSchema7>(schemaPath: string): Promise<T> {
// 	return import(/* @vite-ignore */ schemaPath, {
// 		with: {
// 			type: "json",
// 		},
// 	}).catch(async () => {
// 		const { ResourceError } = await import("@isp.nexus/core/errors")

// 		throw ResourceError.from(417, `Schema not generated: ${schemaPath}`, "schema", "missing")
// 	})
// }

//#endregion

//#region JSON Model Types

/**
 * Base interface for JSON schema model classes.
 *
 * @ignore
 * @internal
 */
export abstract class JSONSchemaModel<ID extends JSONSchemaID> extends BaseEntity {
	/**
	 * The JSON Schema ID for this model.
	 */
	protected readonly schemaID: ID

	/**
	 * The JSON schema URL for this schema.
	 *
	 * @ignore
	 */
	get $schema(): `/${string}` {
		return this.schemaID.pathname
	}

	/**
	 * Serialize this object to JSON.
	 *
	 * @ignore
	 */
	// abstract toJSON(): any

	public pickJSON<K extends keyof this>(...keys: K[]): PickJSON<this, K> {
		return pickJSON(this, keys)
	}

	constructor(id: ID) {
		super()
		this.schemaID = id
	}
}

//#endregion
