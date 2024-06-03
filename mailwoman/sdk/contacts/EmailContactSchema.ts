/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ModelIDLength, simpleSHA3, TemporalColumnOptions } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { $EmailContact, $PointOfContact, type EmailContact } from "@isp.nexus/mailwoman"
import { inferColumnIndexConfig } from "@isp.nexus/sdk"
import { EntitySchema } from "typeorm"

/**
 * @internal
 */
export const EmailContactSchema = new EntitySchema<EmailContact>({
	name: $EmailContact.tableName,
	columns: {
		deliversTo: {
			unique: true,
			type: "text",
			nullable: false,
		},

		verifiedAt: {
			type: "datetime",
			nullable: true,
		},

		lastVerifiedByID: {
			type: "text",
			length: ModelIDLength.Short,
		},

		id: {
			primary: true,
			type: "text",
			length: ModelIDLength.Short,
		},

		...TemporalColumnOptions,
	},
	relations: {
		pointOfContact: {
			type: "many-to-one",
			nullable: true,
			target: $PointOfContact.tableName,
			joinColumn: {
				name: "last_verified_by_id",
				referencedColumnName: "id",
			},
			inverseSide: "emailContactMethods",
		},
	},
	indices: [
		inferColumnIndexConfig<EmailContact>("verifiedAt"),
		inferColumnIndexConfig<EmailContact>("lastVerifiedByID"),
	],
})

/**
 * Pluck or create an email ID.
 */
export function pluckOrCreateEmailID(input: EmailContact): string {
	if (input.id) return input.id

	if (!input.deliversTo)
		throw ResourceError.from(
			400,
			`Email (${JSON.stringify(input)}) must have a delivers-to address`,
			"emailContactID",
			"pluckOrCreateEmailID"
		)

	const [address, domain] = input.deliversTo.split("@")
	const prefix = (address![0]! + domain![0]!).padEnd(2, "Z")

	return prefix + simpleSHA3([input.deliversTo], ModelIDLength.Short * 4).slice(2)
}
