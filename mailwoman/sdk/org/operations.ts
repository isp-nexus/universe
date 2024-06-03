/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { FRN } from "@isp.nexus/fcc"
import { Organization } from "@isp.nexus/mailwoman"
import { matchOne } from "@isp.nexus/sdk"
import { $ContactsDataSource } from "../contacts/data-source.js"
import { upsertPointOfContact } from "../contacts/operations.js"
import { upsertPostalAddress } from "../postal/operations.js"
import { OrganizationSchema } from "./OrganizationSchema.js"

const logger = ConsoleLogger.withPrefix("Organization")

/**
 * Find an entity by its FRN.
 */
export async function findEntityByFRN(frn: FRN): Promise<Organization | null> {
	const dataSource = await $ContactsDataSource

	return dataSource.getRepository(OrganizationSchema).findOne({
		select: ["id"],
		where: { frn },
	})
}

/**
 * Predicate to determine if an FRN is known, i.e. has synchronized with our database.
 */
export async function findOrganizationID(org: Partial<Organization>): Promise<string | null> {
	const dataSource = await $ContactsDataSource

	const orgRepository = dataSource.getRepository(OrganizationSchema)

	return orgRepository
		.findOne({
			select: ["id"],
			where: matchOne<Organization>([
				{ id: org.id },
				{ frn: org.frn },
				{ form499ID: org.form499ID },
				{ sanitizedLegalName: org.sanitizedLegalName },
			]),
		})
		.then((result) => result?.id ?? null)
}

/**
 * Save an entity to the database.
 */
export async function upsertOrganization(nextOrg: Organization): Promise<string> {
	const dataSource = await $ContactsDataSource

	if (nextOrg.primaryContact) {
		nextOrg.primaryContact.organizationID = nextOrg.id

		nextOrg.primaryContactID = await upsertPointOfContact(nextOrg.primaryContact)
	}

	if (nextOrg.customerServiceContact) {
		nextOrg.customerServiceContact.organizationID = nextOrg.id

		nextOrg.customerServiceContactID = await upsertPointOfContact(nextOrg.customerServiceContact)
	}

	if (nextOrg.dcAgentOrganization) {
		nextOrg.dcAgentOrganizationID = await upsertOrganization(nextOrg.dcAgentOrganization)
	}

	if (nextOrg.dcAgent) {
		nextOrg.dcAgent.organizationID = nextOrg.id
		nextOrg.dcAgent.associatedFCCEntityFRN = nextOrg.frn
		nextOrg.dcAgent.associatedProviderID = nextOrg.providerID
		nextOrg.dcAgentID = await upsertPointOfContact(nextOrg.dcAgent)
	}

	if (nextOrg.headquartersAddress) {
		nextOrg.headquartersAddressID = await upsertPostalAddress(nextOrg.headquartersAddress)
	}

	logger.info([nextOrg.legalName, nextOrg.frn, nextOrg.providerID].join(" | ") + " Saving Organization...")

	const exists = await findOrganizationID(nextOrg)

	const orgRepo = dataSource.getRepository(OrganizationSchema)
	const {
		// ---
		dcAgentOrganization,
		dcAgent,
		headquartersAddress,
		primaryContact,
		customerServiceContact,
		...columns
	} = nextOrg

	if (exists) {
		await orgRepo.update({ id: nextOrg.id }, columns)
	} else {
		await orgRepo.insert(columns)
	}

	return nextOrg.id
}
