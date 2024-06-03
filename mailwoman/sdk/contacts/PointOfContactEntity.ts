/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ModelIDLength, TemporalColumnOptions } from "@isp.nexus/core"
import { $EmailContact, $Organization, $PhoneContact, $PointOfContact, PointOfContact } from "@isp.nexus/mailwoman"
import { inferColumnIndexConfig } from "@isp.nexus/sdk"
import { EntitySchema } from "typeorm"

/**
 * @internal
 */
export const PointOfContactSchema = new EntitySchema<PointOfContact>({
	name: $PointOfContact.tableName,

	columns: {
		familyName: {
			type: "text",
			nullable: true,
		},

		givenName: {
			type: "text",
			nullable: true,
		},

		middleName: {
			type: "text",
			nullable: true,
		},

		prefix: {
			type: "text",
			nullable: true,
		},

		dateOfBirth: {
			type: "date",
			nullable: true,
		},

		organizationID: {
			type: "text",
			nullable: true,
			length: ModelIDLength.Short,
		},

		origin: {
			type: "text",
			nullable: false,
		},

		id: {
			primary: true,
			type: "text",
			length: ModelIDLength.Short,
		},

		...TemporalColumnOptions,
	},
	relations: {
		organization: {
			target: $Organization.tableName,
			type: "many-to-one",
			createForeignKeyConstraints: false,
			joinColumn: {
				name: "organization_id",
				referencedColumnName: "id",
			},
		},

		phoneContactMethods: {
			type: "one-to-many",
			target: $PhoneContact.tableName,
			joinColumn: {
				referencedColumnName: "last_verified_by_id",
			},
		},
		emailContactMethods: {
			type: "one-to-many",
			target: $EmailContact.tableName,
			joinColumn: {
				referencedColumnName: "last_verified_by_id",
			},
		},
	},
	indices: [
		inferColumnIndexConfig<PointOfContact>("origin"),
		inferColumnIndexConfig<PointOfContact>("familyName"),
		inferColumnIndexConfig<PointOfContact>("givenName"),
		inferColumnIndexConfig<PointOfContact>("middleName"),
		inferColumnIndexConfig<PointOfContact>("dateOfBirth"),
		inferColumnIndexConfig<PointOfContact>("organizationID"),
	],
})
