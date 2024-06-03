/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { JSONSchemaID, TemporalProperties } from "@isp.nexus/core"
import type { PointOfContact } from "../PointOfContact.js"

export const $EmailContact = JSONSchemaID("EmailContact")
export type $EmailContact = typeof $EmailContact

/**
 * An contact method via email.
 *
 * @public
 * @title Email Contact
 */
export interface EmailContact extends TemporalProperties {
	/**
	 * The ID of the email contact.
	 *
	 * @title ID
	 * @format uuid
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
	 *
	 * @title Point of Contact
	 */
	pointOfContact?: PointOfContact

	/**
	 * An email address
	 *
	 * @title Email Address
	 * @format email
	 */
	deliversTo: string

	/**
	 * The date and time the contact method was verified.
	 *
	 * @type string
	 * @title Verified At
	 * @format date-time
	 */
	verifiedAt?: Date

	/**
	 * The date and time the contact method was created.
	 *
	 * @type string
	 * @title Created At
	 * @format date-time
	 */
	createdAt?: Date

	/**
	 * The date and time the contact method was last updated.
	 *
	 * @type string
	 * @title Updated At
	 * @format date-time
	 */
	updatedAt?: Date
}
