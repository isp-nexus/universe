/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ModelIDLength, pick, simpleSHA3, TemporalColumnOptions } from "@isp.nexus/core"
import { $Organization, $PointOfContact, Organization, OrganizationClassification } from "@isp.nexus/mailwoman"
import { inferColumnIndexConfig } from "@isp.nexus/sdk"
import { EntitySchema } from "typeorm"

/**
 * @internal
 */
export const OrganizationSchema = new EntitySchema<Organization>({
	name: $Organization.tableName,
	columns: {
		//#region ID Properties

		id: {
			primary: true,
			type: "text",
			length: ModelIDLength.Short,
		},

		EIN: {
			type: "text",
			nullable: true,
			length: 9,
		},

		frn: {
			type: "int",
			nullable: true,
		},

		providerID: {
			type: "text",
			nullable: true,
			length: ModelIDLength.Short,
		},

		form499ID: {
			type: "text",
			nullable: true,
			length: ModelIDLength.Short,
		},

		predecessorFRN: {
			type: "int",
			nullable: true,
		},

		successorFRN: {
			type: "int",
			nullable: true,
		},

		//#endregion

		//#region Entity Properties

		legalName: {
			type: "text",
			nullable: true,
		},

		classifications: {
			type: "text",
			nullable: true,
			transformer: {
				from: (value) => (value ? JSON.parse(value) : new Set()),
				to: (value: Set<OrganizationClassification> | null) => {
					if (value && value.size) return JSON.stringify(Array.from(value))

					return null
				},
			},
		},

		sanitizedLegalName: {
			type: "text",
			nullable: true,
		},

		doingBusinessAs: {
			type: "text",
			nullable: true,
		},

		holdingCompany: {
			type: "text",
			nullable: true,
		},

		//#endregion

		//#region Timestamps

		registeredAt: {
			type: "datetime",
			nullable: true,
		},

		form499FiledAt: {
			type: "date",
			nullable: true,
		},

		...TemporalColumnOptions,

		inactiveAt: {
			type: "date",
			nullable: true,
		},

		headquartersAddressID: {
			type: "text",
			length: ModelIDLength.Short,
			nullable: true,
		},

		dcAgentID: {
			type: "text",
			length: ModelIDLength.Short,
			nullable: true,
		},

		dcAgentOrganizationID: {
			type: "text",
			length: ModelIDLength.Short,
			nullable: true,
		},

		customerServiceContactID: {
			type: "text",
			length: ModelIDLength.Short,
			nullable: true,
		},

		primaryContactID: {
			type: "text",
			length: ModelIDLength.Short,
			nullable: true,
		},

		//#endregion
	},
	indices: [
		inferColumnIndexConfig<Organization>("legalName"),
		inferColumnIndexConfig<Organization>("sanitizedLegalName"),
		inferColumnIndexConfig<Organization>("form499ID"),
		inferColumnIndexConfig<Organization>("frn"),
		inferColumnIndexConfig<Organization>("providerID"),
		inferColumnIndexConfig<Organization>("EIN"),
	],
	relations: {
		primaryContact: {
			type: "many-to-one",
			nullable: true,
			target: $PointOfContact.tableName,
			joinColumn: {
				name: "primary_contact_id",
				referencedColumnName: "id",
			},
		},
		customerServiceContact: {
			type: "many-to-one",
			nullable: true,
			target: $PointOfContact.tableName,
			joinColumn: {
				name: "customer_service_contact_id",
				referencedColumnName: "id",
			},
		},
		dcAgent: {
			type: "many-to-one",
			nullable: true,
			target: $PointOfContact.tableName,
			joinColumn: {
				name: "dc_agent_id",
				referencedColumnName: "id",
			},
		},
		dcAgentOrganization: {
			type: "many-to-one",
			nullable: true,
			target: $Organization.tableName,
			joinColumn: {
				name: "dc_agent_organization_id",
				referencedColumnName: "id",
			},
		},
	},
})

/**
 * Pluck or create an organization ID.
 */
export function pluckOrCreateOrganizationID(input: Organization): string {
	if (input.id) return input.id

	return simpleSHA3(
		//---
		pick(input, ["sanitizedLegalName", "frn", "EIN", "form499ID"] as const)
	)
}
