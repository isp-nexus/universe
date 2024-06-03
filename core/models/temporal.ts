/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { EntitySchemaOptions } from "typeorm"

export enum TemporalColumnName {
	/**
	 * The date and time the record was created.
	 */
	CreatedAt = "created_at",
	/**
	 * The date and time the record was last updated.
	 */
	UpdatedAt = "updated_at",
	/**
	 * The date and time the record was soft deleted.
	 */
	DeletedAt = "deleted_at",
}

/**
 * All temporal column names. Used for SQL select queries.
 */
export const TemporalColumnNames: TemporalColumnName[] = Object.values(TemporalColumnName)

/**
 * Common temporal properties for database entities.
 */
export interface TemporalProperties {
	/**
	 * The date and time the record was created.
	 *
	 * @type string
	 * @format date-time
	 * @title Created At
	 */
	[TemporalColumnName.CreatedAt]?: Date

	/**
	 * The date and time the record was last updated.
	 *
	 * @type string
	 * @format date-time
	 * @title Updated At
	 */
	[TemporalColumnName.UpdatedAt]?: Date

	/**
	 * The date and time the record was soft deleted.
	 *
	 * @type string
	 * @format date-time
	 * @title Deleted At
	 */
	[TemporalColumnName.DeletedAt]?: Date
}

/**
 * TypeORM column options for temporal properties.
 */
export const TemporalColumnOptions = {
	[TemporalColumnName.CreatedAt]: {
		type: "datetime",
		nullable: false,
		createDate: true,
	},

	[TemporalColumnName.UpdatedAt]: {
		type: "datetime",
		nullable: true,
		updateDate: true,
	},

	[TemporalColumnName.DeletedAt]: {
		type: "datetime",
		nullable: true,
		deleteDate: true,
	},
} as const satisfies EntitySchemaOptions<TemporalProperties>["columns"]
