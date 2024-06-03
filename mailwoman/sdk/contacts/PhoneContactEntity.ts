/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ModelIDLength, simpleSHA3, TemporalColumnOptions } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { $PhoneContact, $PointOfContact, type PhoneContact } from "@isp.nexus/mailwoman"
import { inferColumnIndexConfig } from "@isp.nexus/sdk"
import { EntitySchema } from "typeorm"

/**
 * @internal
 */
export const PhoneContactSchema = new EntitySchema<PhoneContact>({
	name: $PhoneContact.tableName,
	columns: {
		subscriberNumber: {
			unique: true,
			type: "varchar",
			length: 15,
		},

		verifiedAt: {
			type: "datetime",
			nullable: true,
		},

		id: {
			primary: true,
			type: "text",
			length: ModelIDLength.Short,
		},

		lastVerifiedByID: {
			type: "text",
			length: ModelIDLength.Short,
			nullable: true,
		},

		...TemporalColumnOptions,
	},
	indices: [
		inferColumnIndexConfig<PhoneContact>("verifiedAt"),
		inferColumnIndexConfig<PhoneContact>("lastVerifiedByID"),
	],
	relations: {
		pointOfContact: {
			type: "many-to-one",
			target: $PointOfContact.tableName,
			joinColumn: {
				name: "last_verified_by_id",
				referencedColumnName: "id",
			},

			nullable: true,
			inverseSide: "phoneContactMethods",
		},
	},
})

/**
 * Pluck or create an phone ID.
 */
export function pluckOrCreatePhoneID(input: PhoneContact): string {
	if (input.id) return input.id

	if (!input.subscriberNumber)
		throw ResourceError.from(
			400,
			`Phone (${input.subscriberNumber}) must have a subscriber number`,
			"pluckOrCreatePhoneID",
			"subscriberNumber-missing"
		)

	const prefix = input.subscriberNumber.slice(2, 4)

	return prefix + simpleSHA3([input.subscriberNumber], ModelIDLength.Short * 4).slice(2)
}
