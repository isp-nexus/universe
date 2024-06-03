/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { JSONSchemaID, TemporalProperties } from "@isp.nexus/core"
import type { Tagged } from "type-fest"
import type { PointOfContact } from "../PointOfContact.js"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { CountryISO2 } from "@isp.nexus/spatial"

/**
 * Valid phone number, in E.164 format.
 *
 * @type string
 * @title E.164 Phone Number
 * @pattern ^\+[1-9]\d{1,14}$
 */
export type PhoneNumber = Tagged<string, "PhoneNumber">

/**
 * Tagged type for valid mobile phone numbers.
 *
 * @type string
 * @title E.164 Mobile Phone Number
 * @pattern ^\+[1-9]\d{1,14}$
 * @TJS-ignore
 */
export type MobilePhoneNumber = Tagged<string, "MobilePhoneNumber">

export const $PhoneContact = JSONSchemaID("PhoneContact")
export type $PhoneContact = typeof $PhoneContact

/**
 * An contact method via phone.
 *
 * @title Phone Contact Method
 * @public
 * @requires {@linkcode CountryISO2}
 */
export interface PhoneContact extends TemporalProperties {
	/**
	 * The ID of the phone contact.
	 *
	 * @format uuid
	 * @title ID
	 */
	id?: string

	/**
	 * The ID of the last contact to verify the email.
	 *
	 * @title Last Verified By
	 */
	lastVerifiedByID?: string

	/**
	 * The parent contact.
	 */
	pointOfContact?: PointOfContact

	/**
	 * The E.164 formatted phone number.
	 *
	 * @type string
	 * @format e164
	 * @maxLength 16
	 * @minLength 1
	 */
	subscriberNumber: PhoneNumber

	/**
	 * The date and time the contact method was verified.
	 *
	 * @type string
	 * @title Verified At
	 * @format date-time
	 */
	verifiedAt?: Date
}
