/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { JSONSchemaID, TemporalProperties } from "@isp.nexus/core"
import { FRN, ProviderID } from "@isp.nexus/fcc"
import type { Organization } from "../organization/Organization.js"
import { type PostalAddress } from "../postal/PostalAddress.js"
import type { EmailContact } from "./email/index.js"
import type { PhoneContact } from "./phone/PhoneContact.js"

export const $PointOfContact = JSONSchemaID("PointOfContact")
export type $PointOfContact = typeof $PointOfContact

/**
 * A specific person, customer, or representative of an organization that can be contacted.
 *
 * @title Point of Contact
 * @public
 *
 * @requires {@linkcode PostalAddress}
 * @requires {@linkcode EmailContact}
 * @requires {@linkcode PhoneContact}
 */
export interface PointOfContact extends TemporalProperties {
	/**
	 * The ID of the Point of Contact.
	 *
	 * @title ID
	 */
	id: string

	/**
	 * The given name of the person, i.e. their first name.
	 *
	 * @title Given Name
	 *
	 * @maxLength 255
	 */
	givenName?: string | null

	/**
	 * The middle name of the person, if any.
	 *
	 * @title Middle Name
	 *
	 * @maxLength 255
	 */
	middleName?: string | null

	/**
	 * The family name of the person, i.e. their last name.
	 *
	 * @title Family Name
	 * @maxLength 255
	 */
	familyName?: string | null

	/**
	 * @title Name Prefix
	 * A prefix, such as a title or honorific.
	 *
	 * @TJS-examples ["Mr.", "Ms.", "Dr."]
	 */
	prefix?: string | null

	/**
	 * @title Name Suffix
	 *
	 * A suffix, such as a professional designation.
	 *
	 * @TJS-examples ["PhD", "MD", "Esq."]
	 */
	suffix?: string | null

	/**
	 * The date of birth of the person.
	 *
	 * @type string
	 * @title Date of Birth
	 * @format date
	 */
	dateOfBirth?: Date | null

	/**
	 * The ID of the organization the person is associated with.
	 *
	 * @title Organization ID
	 */
	organizationID?: string | null

	/**
	 * An organization the person is associated with.
	 *
	 * @title Organization
	 */
	organization?: Organization | null

	/**
	 * The FRN of the organization the person is associated with, if any.
	 *
	 * @title Associated FCC Entity FRN
	 */
	associatedFCCEntityFRN?: FRN | null

	/**
	 * An FCC entity the person is associated with.
	 *
	 * @title Associated FCC Entity
	 */
	associatedFCCEntity?: Organization | null

	/**
	 * The provider ID the person is associated with, if any.
	 *
	 * @title Associated Provider ID
	 */
	associatedProviderID?: ProviderID | null

	/**
	 * Source of the person's data.
	 *
	 * @title Data Source
	 * @maxLength 255
	 */

	origin?: string | null

	/**
	 * The email contact methods for the individual.
	 *
	 * @title Email Contact Methods
	 * @TJS-type array
	 * @TJS-items.ref EmailContact
	 */
	emailContactMethods?: EmailContact[]

	/**
	 * The phone contact methods for the individual.
	 *
	 * @title Phone Contact Methods
	 * @TJS-type array
	 * @TJS-items.ref PhoneContact
	 */
	phoneContactMethods?: PhoneContact[]

	/**
	 * The postal addresses ID for the individual.
	 *
	 * @title Postal Address ID
	 */
	postalAddressID?: string | null

	/**
	 * The physical mailing address at which the person can be reached.
	 *
	 * @title Postal Address
	 */
	postalAddress?: PostalAddress | null
}
