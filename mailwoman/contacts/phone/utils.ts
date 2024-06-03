/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { PhoneResult, phone } from "phone"
import { MobilePhoneNumber, PhoneContact, PhoneNumber } from "./PhoneContact.js"
import { USPhoneData } from "./data.js"

/**
 * Tagged type for valid phone numbers.
 *
 * @internal
 */
export type TaggedPhoneResult<T extends PhoneNumber | MobilePhoneNumber = PhoneNumber> = PhoneResult & {
	phoneNumber: T
}

/**
 * Type-predicate determining if the input is a valid mobile phone number.
 */
export function isMobileNumber(input: string, country?: string): input is MobilePhoneNumber
export function isMobileNumber(input: PhoneResult, country?: string): input is TaggedPhoneResult<MobilePhoneNumber>
export function isMobileNumber(input: unknown, country = USPhoneData.alpha3): input is MobilePhoneNumber {
	if (!input) return false

	switch (typeof input) {
		case "string":
			return phone(input, { country }).isValid
		case "object":
			if ("isValid" in input) return Boolean(input.isValid)
	}

	return false
}

/**
 * Given an input containing a phone number, parses it into a structured object.
 */
export function parsePhoneNumberInput(input: string, country = USPhoneData.alpha3): PhoneResult {
	let normalizedInput = input.replace(/[^0-9+]/g, "")

	if (country === USPhoneData.alpha3 && !normalizedInput.startsWith(USPhoneData.country_code)) {
		// This helps us trim excess characters from the input.
		normalizedInput = `+${USPhoneData.country_code}${normalizedInput}`.slice(0, 12)
	}

	const result = phone(normalizedInput, { country, validateMobilePrefix: false })

	return result
}

const randomPhoneNumberDigit = () => Math.floor(Math.random() * 10)

/**
 * Creates string of digits length, such as part of a phone number.
 */
function generateDigits(length: number): string {
	return Array.from({ length }, randomPhoneNumberDigit).join("")
}

/**
 * Generates a random area code for a mobile US phone number.
 */
function randomUSMobileAreaCode(): string {
	const randomIndex = Math.floor(Math.random() * USPhoneData.mobile_begin_with.length)
	const mobileAreaCode = USPhoneData.mobile_begin_with[randomIndex]!

	return mobileAreaCode
}

/**
 * Generates a random mobile phone number, not necessarily deliverable.
 */
export function generateRandomMobileNumber(): MobilePhoneNumber {
	const areaCode = randomUSMobileAreaCode()
	const suffix = generateDigits(4)

	const result = parsePhoneNumberInput([areaCode, "555", suffix].join(""))

	if (!isMobileNumber(result)) {
		throw new Error(`Failed to generate a valid mock phone number: ${result.phoneNumber}`)
	}

	return result.phoneNumber
}

/**
 * Given an input containing a phone number, parses it into a contact method.
 */
export function from(input: unknown, pointOfContactID?: string): PhoneContact | undefined {
	if (!input) return undefined
	if (typeof input !== "string") return undefined

	const result = parsePhoneNumberInput(input)

	if (!result.isValid) {
		return undefined
	}

	const phoneContact: PhoneContact = {
		lastVerifiedByID: pointOfContactID,
		verifiedAt: undefined,
		subscriberNumber: result.phoneNumber as PhoneNumber,
	}

	return phoneContact
}
