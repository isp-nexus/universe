/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { EmailContact } from "./EmailContact.js"

export function from(input: unknown, pointOfContactID?: string): EmailContact | undefined {
	if (!input) return undefined
	if (typeof input !== "string") return undefined

	const normalizedInput = input.trim().toLowerCase()

	if (!EmailAddressPattern.test(input)) return undefined

	const emailContact: EmailContact = {
		lastVerifiedByID: pointOfContactID,
		deliversTo: normalizedInput,
	}

	return emailContact
}

/**
 * A pattern for matching email addresses.
 *
 * @see {@link https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression | StackOverflow}
 */
const EmailAddressPattern =
	// eslint-disable-next-line no-control-regex
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
