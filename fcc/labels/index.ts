/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Broadband Label utilities.
 *
 *   Broadband Labels are designed to provide clear, easy-to-understand, and accurate information
 *   about the cost and performance of high-speed internet services.
 *
 *   The labels are modeled after the FDA nutrition labels and are intended to help consumers
 *   comparison shop for the internet service plan that will best meet their needs and budget.
 *
 *   Internet service providers that offer home, or fixed, internet services, or mobile broadband
 *   plans are required to have a label for each service plan they offer.
 *
 *   Unique Identifier Each plan must be given a unique identifier to be included on the label.
 *
 *   The identifier should begin with either an “F” for fixed plans or an “M” for mobile plans,
 *   followed by the provider’s FCC Registration Number, and then a string of 15 alphanumeric
 *   characters identifying the specific plan, as chosen by the provider.
 *
 *   The identifier should appear on the label without spaces, e.g., “F0009876543123ABC456DEF789.”
 *   Identifiers must be unique to each plan and cannot be reused after a plan is discontinued.
 */

import { FRN, isFRN } from "../entity/frn.js"

/**
 * A single character prefix indicating the technology type of the plan.
 *
 * @title Plan Prefix
 * @see {@linkcode PlanTechnology}
 */
export type PlanPrefix = "F" | "M"

/**
 * The technology type of the plan, i.e. fixed or mobile broadband.
 *
 * @title Plan Technology
 */
export type PlanTechnology = "fixed" | "mobile"

/**
 * A mapping of plan prefixes to plan technologies.
 */
export const PlanPrefixToTechnology: ReadonlyMap<PlanPrefix, PlanTechnology> = new Map([
	["F", "fixed"],
	["M", "mobile"],
])

/**
 * A mapping of plan technologies to plan prefixes.
 */
export const PlanTechnologyToPrefix: ReadonlyMap<PlanTechnology, PlanPrefix> = new Map([
	["fixed", "F"],
	["mobile", "M"],
])

/**
 * Predicate to check if a string is a valid plan prefix.
 */
export function isPlanPrefix(input: string): input is PlanPrefix {
	return PlanPrefixToTechnology.has(input as PlanPrefix)
}

/**
 * Predicate to check if a string is a valid plan technology.
 */
export function isPlanTechnology(input: string): input is PlanTechnology {
	return PlanTechnologyToPrefix.has(input as PlanTechnology)
}

export interface ParsedPlanIdentifier {
	/**
	 * The FCC Registration Number (FRN) of the provider.
	 *
	 * @see {@linkcode isFRN} to check if a string is a valid FRN.
	 * @see {@linkcode createFRNURL} to create a URL to the FCC's CORES search page.
	 */
	frn: FRN
	/**
	 * The alpha-numeric unique identifier of the plan.
	 */
	planCode: string
	/**
	 * The technology type of the plan.
	 */
	technology: PlanTechnology
}

export function parseBroadbandLabelIdentifier(input: string): ParsedPlanIdentifier {
	const characters = [...input]
	const technologyPrefix = characters.shift()

	if (!technologyPrefix) {
		throw new Error("Plan identifier is missing technology prefix.")
	}

	if (!isPlanPrefix(technologyPrefix)) {
		throw new Error(`Invalid plan technology prefix: ${technologyPrefix}`)
	}

	const technology = PlanPrefixToTechnology.get(technologyPrefix)!
	const frn = parseInt(characters.splice(0, 10).join(""), 10)

	if (!isFRN(frn)) {
		throw new Error(`Invalid FCC Registration Number (FRN): ${frn}`)
	}

	const planCode = characters.join("")

	const parsedPlan: ParsedPlanIdentifier = {
		frn,
		planCode,
		technology,
	}

	return parsedPlan
}

/**
 * Formats a parsed plan into a string.
 */
export function formatPlanIdentifier(plan: ParsedPlanIdentifier): string {
	const technologyPrefix = PlanTechnologyToPrefix.get(plan.technology)!

	const frn = plan.frn.toString().padStart(10, "0")
	const identifier = `${technologyPrefix}${frn}${plan.planCode}`

	return identifier
}

export function pluckUniquePlanID(content: string): ParsedPlanIdentifier | null {
	const match = content.match(/[FM]\d{10}[A-Z0-9]{15}/)

	if (!match) return null

	return parseBroadbandLabelIdentifier(match[0])
}
