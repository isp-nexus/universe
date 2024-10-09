/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import {
	APIClient,
	APIClientConfig,
	JSONSet,
	ModelIDLength,
	UserAgent,
	isUniformlyCased,
	simpleSHA3,
	unserializeDate,
} from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { FRN, isFRN } from "@isp.nexus/fcc"
import {
	EmailContactUtils,
	Organization,
	OrganizationClassification,
	PhoneContactUtils,
	formatOrganizationName,
	parseContactName,
	sanitizeOrganizationName,
	sanitizePostalAddress,
} from "@isp.nexus/mailwoman"
import { findPostalAddress } from "@isp.nexus/mailwoman/sdk"
import { dataSourcePathBuilder } from "@isp.nexus/sdk/reflection"
import { StateName } from "@isp.nexus/tiger"
import { isAxiosError } from "axios"
import { camelCase, capitalCase } from "change-case"
import { load } from "cheerio"
import * as fs from "node:fs/promises"
import { format } from "prettier"

const NormalizedStateNames = Object.values(StateName).map((state) => state.toUpperCase())

class HTMLParsingError extends Error {
	override name = "HTMLParsingError"
}

const caseInsensitiveInputPattern = /:|@|\(|\)|-/

/**
 * Removes excess newlines, tabs, and spaces from text.
 *
 * @internal
 */
export function normalizeDataCell(text: string | null | undefined): string | null {
	if (!text) return null

	const value = text
		.replaceAll("United States", "")
		.replaceAll(/\t|\n|/g, "")
		.replaceAll(/\s{2,}/g, " ")
		.trim()

	if (value.length === 0) return null

	if (!caseInsensitiveInputPattern.test(text) && isUniformlyCased(value)) {
		return capitalCase(value)
	}

	return value
}

function normalizeHeaderCell(text: string) {
	return camelCase(text.replace(/\W/g, ""))
}

/**
 * Represents an entity's unprocessed registration details.
 *
 * @internal
 */
export interface RawEntityRegistration {
	frn: FRN
	registrationDate: string | null
	lastUpdated: string | null
	entityName: string | null
	entityType: string | null
	classifications: JSONSet<OrganizationClassification> | null
	contactOrganization: string | null
	contactPosition: string | null
	contactName: string | null
	contactAddress: string | null
	contactEmail: string | null
	contactPhone: string | null
	contactFax: string | null
}

export const $CORESClient = ServiceRepository.register((abortController) => {
	const clientConfig = {
		displayName: "CORES",
		axios: {
			signal: abortController.signal,
			baseURL: "https://apps.fcc.gov",
			headers: {
				"User-Agent": UserAgent.iPadSafari,
			},
		},
	} as const satisfies APIClientConfig

	type CORESClientConfig = typeof clientConfig & { __brand?: any }

	return new APIClient<CORESClientConfig>(clientConfig)
})

export function createLocalRegistrationPath(frn: FRN) {
	return dataSourcePathBuilder("fcc", "registrations", frn.toString(), "index.json")
}

export async function parseLookupResponse(frn: FRN, htmlContent: string): Promise<Organization> {
	const $ = load(htmlContent)
	const tableRows = $("tbody tr")

	if (tableRows.length === 0) {
		throw new HTMLParsingError("No table rows found in response.")
	}

	const registration = Object.fromEntries(
		Array.from(tableRows, (row) => {
			const header = normalizeHeaderCell($(row).find("th").text())
			const data = normalizeDataCell($(row).find("td").text())

			return [header, data]
		})
	) as unknown as RawEntityRegistration

	const [legalName, doingBusinessAs] = registration.entityName?.split(/\sdba\s/i) || []

	const formattedOrganizationName = formatOrganizationName(legalName)

	if (!formattedOrganizationName) {
		throw new HTMLParsingError(`${frn}: No entity name found in response.`)
	}

	const sanitizedLegalName = sanitizeOrganizationName(formattedOrganizationName)
	const classifications = new Set<OrganizationClassification>()
	const primaryContactName = parseContactName(registration.contactName)

	const primaryContactIDPrefix =
		"P" +
		[(primaryContactName?.familyName || "").slice(0, 1), (primaryContactName?.givenName || "").slice(0, 1)]
			.join("")
			.toUpperCase()
			.padEnd(2, "ZZ")

	const primaryContactID =
		primaryContactIDPrefix +
		simpleSHA3(
			[primaryContactName?.familyName, primaryContactName?.givenName, sanitizedLegalName],
			ModelIDLength.Short * 4
		).slice(3)

	const entity: Organization = {
		id: "F" + simpleSHA3([sanitizedLegalName, frn]).slice(1),
		frn,
		legalName: formattedOrganizationName,
		sanitizedLegalName,
		classifications,
		doingBusinessAs: formatOrganizationName(doingBusinessAs),
		registeredAt: unserializeDate(registration.registrationDate),
		primaryContact: {
			origin: "FCC",
			id: primaryContactID,
			...primaryContactName,
			postalAddress: await findPostalAddress(sanitizePostalAddress(registration.contactAddress))
				.then((address) => address[0]!)
				.catch(() => null),
			phoneContactMethods: [PhoneContactUtils.from(registration.contactPhone)!].filter(Boolean),
			emailContactMethods: [EmailContactUtils.from(registration.contactEmail)!].filter(Boolean),
		},
	}

	const matchedEntityTypes = new Set<string>(
		(registration.entityType || "")
			.split(/\s?,\s?/)
			.map((entry) => entry.trim().toUpperCase())
			.filter(Boolean)
	)

	//#region Classification

	const normalizedEntityName = registration.entityName?.toUpperCase()

	if (matchedEntityTypes.has("NON-PROFIT")) {
		classifications.add(OrganizationClassification.NonProfit)
	}

	if (normalizedEntityName?.includes("COOP")) {
		classifications.add(OrganizationClassification.Cooperative)
	}

	if (matchedEntityTypes.has("PRIVATE")) {
		classifications.add(OrganizationClassification.PrivateSectorCompany)
	}

	if (normalizedEntityName?.includes("CITY")) {
		classifications.add(OrganizationClassification.Municipal)
	}

	if (normalizedEntityName?.includes("RURAL")) {
		classifications.add(OrganizationClassification.Rural)
	}
	if (normalizedEntityName && NormalizedStateNames.findIndex((state) => normalizedEntityName.includes(state)) !== -1) {
		classifications.add(OrganizationClassification.Municipal)
	}

	//#endregion

	// this.#logger.info(registration, `Registration details for ${frn}`)

	return entity
}

/**
 * Given an FRN, look up the entity's registration details via the FCC CORES website.
 *
 * @param frn The entity's FCC Registration Number.
 * @param skipCache Whether to skip the cache and download the file again.
 *
 * @returns The entity's registration details.
 */
export async function lookupEntityRegistration(frn: FRN | number, skipCache = false): Promise<Organization> {
	if (!isFRN(frn)) {
		throw ResourceError.from(417, `Invalid FRN: ${frn}`, "cores", "lookup")
	}

	const client = await $CORESClient
	client.logger.info(`Fetching registration details for ${frn}...`)

	const cachedFilePath = createLocalRegistrationPath(frn)

	if (!skipCache) {
		const cachedEntity = await fs
			.readFile(cachedFilePath, "utf8")
			.then((data) => JSON.parse(data) as Organization)
			.catch(() => null)

		if (cachedEntity) {
			client.logger.info(`Using cached ${frn}...`)
			return cachedEntity
		}
	}

	return client.axios
		.get<string>("/cores/searchDetail.do", {
			responseType: "text",
			params: {
				frn,
			},
		})
		.then(async (value) => {
			const htmlContent = await format(typeof value === "string" ? value : value.data, {
				parser: "html",
			})

			return parseLookupResponse(frn, htmlContent)
		})
		.catch((error: unknown): Organization => {
			if ((isAxiosError(error) && error.response?.status === 500) || error instanceof HTMLParsingError) {
				// Entity is unavailable for lookup.

				const entity: Organization = {
					frn,
					id: simpleSHA3([frn]),
					registeredAt: new Date(0),
					classifications: new Set([OrganizationClassification.Other]),
				}

				return entity
			}

			throw ResourceError.wrap(error, `Failed to fetch registration details for ${frn}`, "cores", "lookup", "failed")
		})
}
