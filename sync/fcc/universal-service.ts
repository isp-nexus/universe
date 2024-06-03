/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { JSONSet, simpleSHA3, unserializeDate } from "@isp.nexus/core"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { FRN, Form499ID, isFRN } from "@isp.nexus/fcc"
import {
	EmailContactUtils,
	Organization,
	OrganizationClassification,
	PhoneContactUtils,
	PointOfContact,
	formatOrganizationName,
	parseContactName,
	sanitizeOrganizationName,
} from "@isp.nexus/mailwoman"
import { findPostalAddress } from "@isp.nexus/mailwoman/sdk"
import { dataSourcePathBuilder } from "@isp.nexus/sdk"
import * as csv from "csv"
import * as fs from "node:fs/promises"
import { normalizeDataCell } from "./CORESClient.js"

const RawFCCForm499FilingColumns = [
	"form499ID",
	"frn",
	"lastFiledAt",
	"usfContributor",
	"legalNameOfCarrier",
	"doingBusinessAs",
	"principalCommType",
	"holdingCompany",
	"managementCompany",
	"hqAddress",
	"customerInquiriesTelephone",
	"customerInquiriesAddress",
	"dcAgentDisplayName",
	"dcAgentOrganizationName",
	"dcAgentTelephone",
	"dcAgentEmailAddress",
	"dcAgentAddress",
] as const satisfies readonly string[]

export type RawFCCForm499FilingColumn = (typeof RawFCCForm499FilingColumns)[number]

export interface RawFCCForm499Filing {
	form499ID: Form499ID
	frn: string
	/**
	 * The date the form was last filed.
	 *
	 * @format date
	 */
	lastFiledAt: string
	usfContributor: string
	legalNameOfCarrier: string
	doingBusinessAs: string
	principalCommType: string
	holdingCompany: string
	managementCompany: string
	hqAddress: string
	customerInquiriesTelephone: string
	customerInquiriesAddress: string
	otherTradeName1: string
	dcAgentDisplayName: string
	dcAgentOrganizationName: string
	dcAgentTelephone: string
	dcAgentEmailAddress: string
	dcAgentAddress: string
}

export const $UniversalServiceFundCache = ServiceRepository.register(async () => {
	const logger = ConsoleLogger.withPrefix("USF Service")
	const byForm499ID = new Map<Form499ID, RawFCCForm499Filing>()
	const byFormFRN = new Map<FRN, RawFCCForm499Filing>()
	const dataPath = dataSourcePathBuilder("fcc", "usf", "index.tsv")

	logger.info(`Parsing ${dataPath}...`)

	const records = await fs.readFile(dataPath, "utf8").then(
		(contents) =>
			csv
				.parse(contents, {
					columns: RawFCCForm499FilingColumns as unknown as string[],
					relax_column_count_less: true,
					delimiter: "\t",
				})
				.toArray() as Promise<RawFCCForm499Filing[]>
	)

	for (const record of records) {
		byForm499ID.set(record.form499ID, record)
	}

	for (const currentRecord of records) {
		const frn = parseInt(currentRecord.frn, 10)

		if (!isFRN(frn)) {
			logger.debug(`Skipping record with no FRN: ${currentRecord.legalNameOfCarrier}`)
			continue
		}

		const previousMatchingRecord = byFormFRN.get(frn)

		if (previousMatchingRecord) {
			const previousMatchingRecordFilingDate = new Date(previousMatchingRecord.lastFiledAt)
			const currentRecordFilingDate = new Date(currentRecord.lastFiledAt)

			if (previousMatchingRecordFilingDate > currentRecordFilingDate) {
				continue
			}
		}

		byFormFRN.set(frn, currentRecord)
	}

	/**
	 * Recursively searches for a replacement filing for a given Form 499 ID.
	 *
	 * Handles cycles and other edge cases.
	 */
	const findFilingByID = (filingID: Form499ID): RawFCCForm499Filing | null => {
		return byForm499ID.get(filingID!) || null
	}

	const findByFRN = (frn: FRN): RawFCCForm499Filing | null => {
		const result = byFormFRN.get(frn)

		if (!result) return null

		return findFilingByID(result.form499ID)
	}

	return {
		findFilingByID,
		findByFRN,
		logger,
		[Symbol.asyncDispose]: async () => {
			byForm499ID.clear()
			byFormFRN.clear()
		},
		toString: (): string => "USF Cache",
	}
})

export async function supplementOrganization(usfFiling: RawFCCForm499Filing): Promise<Partial<Organization>> {
	//#region Address Parsing

	const headquartersAddress = await findPostalAddress(usfFiling.hqAddress)
		.then((address) => address[0]!)
		.catch(() => null)

	//#endregion

	const classifications = new JSONSet<OrganizationClassification>()

	if (usfFiling?.usfContributor === "TRUE") {
		classifications.add(OrganizationClassification.UniversalServiceFundContributor)
	}

	if (usfFiling?.principalCommType.includes("Incumbent")) {
		classifications.add(OrganizationClassification.IncumbentLocalExchangeCarrier)
	} else if (usfFiling?.principalCommType.includes("CLEC")) {
		classifications.add(OrganizationClassification.CompetitiveLocalExchangeCarrier)
	}

	if (usfFiling?.principalCommType.includes("Interexchange")) {
		classifications.add(OrganizationClassification.InterExchange)
	}

	if (usfFiling?.principalCommType.includes("Toll Reseller")) {
		classifications.add(OrganizationClassification.TollReseller)
	}

	const customerServiceContact: PointOfContact = {
		id: "CS" + simpleSHA3([usfFiling.frn, usfFiling.form499ID]).slice(2),
		origin: "USF CS",
		givenName: "Customer Service",
		phoneContactMethods: [PhoneContactUtils.from(usfFiling.customerInquiriesTelephone)!].filter(Boolean),
	}

	const dcAgentName = parseContactName(normalizeDataCell(usfFiling.dcAgentDisplayName))
	const dcAgentNameSanitized = [dcAgentName?.familyName, dcAgentName?.givenName].filter(Boolean).join(" ")

	const dcAgentOrgLegalName = formatOrganizationName(usfFiling.dcAgentOrganizationName)
	const dcAgentOrgLegalNameSanitized = dcAgentOrgLegalName ? sanitizeOrganizationName(dcAgentOrgLegalName) : null

	let dcAgentOrganization: Organization | null = null
	let dcAgent: PointOfContact | null = null

	if (dcAgentNameSanitized) {
		dcAgent = {
			origin: `USF DC`,
			id: "DCA" + simpleSHA3([dcAgentNameSanitized]).slice(3),
			givenName: `Unnamed DC Agent ${usfFiling.form499ID}`,
			...dcAgentName,
			phoneContactMethods: [PhoneContactUtils.from(usfFiling.dcAgentTelephone)!].filter(Boolean),
			emailContactMethods: [EmailContactUtils.from(usfFiling.dcAgentEmailAddress)!].filter(Boolean),
			postalAddress: await findPostalAddress(usfFiling.dcAgentAddress)
				.then((address) => address[0]!)
				.catch(() => null),
		}
	}

	if (dcAgentOrgLegalNameSanitized) {
		dcAgentOrganization = {
			id: "DC" + simpleSHA3([dcAgentOrgLegalNameSanitized]).slice(2),
			classifications: new Set([OrganizationClassification.DCAgent]),
			sanitizedLegalName: dcAgentOrgLegalNameSanitized,
			legalName: dcAgentOrgLegalName || dcAgentOrgLegalNameSanitized,
			primaryContact: dcAgent,
		}
	}

	const supplementalRegistration = {
		// Note that the provided FRN may be outdated, while the filing can offer a more recent one.
		form499ID: usfFiling.form499ID,
		form499FiledAt: unserializeDate(usfFiling.lastFiledAt),
		doingBusinessAs: formatOrganizationName(normalizeDataCell(usfFiling.doingBusinessAs)),
		holdingCompany: formatOrganizationName(normalizeDataCell(usfFiling.holdingCompany)),
		headquartersAddressID: headquartersAddress?.id,
		customerServiceContact,
		dcAgent,
		dcAgentID: dcAgent?.id,
		dcAgentOrganization,
		dcAgentOrganizationID: dcAgentOrganization?.id,
		classifications,
	} as const satisfies Partial<Organization>

	return supplementalRegistration
}
