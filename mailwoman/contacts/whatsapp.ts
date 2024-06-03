/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

// /**
//  * An contact method via WhatsApp.
//  *
//  * @title WhatsApp Contact Method
//  * @public
//  */
// export interface WhatsAppContactMethod {
// 	/**
// 	 * The JSON schema URL for this schema.
// 	 *
// 	 * @ignore
// 	 */
// 	readonly $schema: JSONSchemaID<"mailwoman", "whats-app-contact-method">
// 	/**
// 	 * A unique identifier to the parent contact.
// 	 *
// 	 * @format urn
// 	 */
// 	contactID?: string

// 	/**
// 	 * The discriminator for the WhatsApp contact method.
// 	 *
// 	 * @title Kind
// 	 */
// 	kind: "whatsapp"
// 	/**
// 	 * The E.164 formatted phone number with country code.
// 	 *
// 	 * @title Phone Number
// 	 */
// 	value: string

// 	/**
// 	 * The date and time the contact method was verified.
// 	 *
// 	 * @title Verification Timestamp
// 	 * @format date-time
// 	 */
// 	verifiedAt?: string
// }
