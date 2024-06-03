/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Twilio-related functions for our SMS API
 */

import { MobilePhoneNumber, ParsedPersonName, parseContactName } from "@isp.nexus/mailwoman"
import { AdminLevel1Abbreviation } from "@isp.nexus/tiger"

export interface TwilioAddons {
	/**
	 * The status of the request.
	 */
	status: "successful" | "failed"

	/**
	 * The message associated with the request.
	 */
	message: string | null

	/**
	 * The code associated with the request.
	 */
	code: string | null

	/**
	 * The result of Twilio's addons.
	 */
	results?: {
		twilio_caller_name: TwilioCallerNameAddonBody
	}
}

export interface TwilioCallerNameAddonBody {
	/**
	 * The status of the request.
	 */
	status: "successful" | "failed"

	/**
	 * The SID associated with the request.
	 */
	request_sid: string

	message: null
	code: null

	/**
	 * Caller name information.
	 */

	result: {
		/**
		 * The phone number associated with the caller.
		 */
		phone_number: string
		caller_name: {
			/**
			 * The caller's full name, delimited by a comma.
			 */
			caller_name: string

			/**
			 * The caller's type.
			 */
			caller_type: "CONSUMER" | "BUSINESS" | "UNKNOWN"

			/**
			 * The error code, if any.
			 */
			error_code: string | null
		}
	}
}

export interface TwilioSMSReplyAddons {
	twilio_caller_name: TwilioCallerNameAddonBody
}

export function parseTwilioSMSReplyAddons(serializedAddons: string): TwilioAddons {
	return JSON.parse(serializedAddons)
}

/**
 * The body of an incoming Twilio SMS reply
 */
export interface TwilioSMSReplyBody {
	/**
	 * The SID of the Twilio account that sent the SMS
	 */
	AccountSid: string

	/**
	 * The add-ons to the SMS
	 *
	 * @format json
	 */
	AddOns: string

	/**
	 * The API version used
	 */
	ApiVersion: string

	/**
	 * The body of the SMS
	 */
	Body: string

	/**
	 * The phone number the SMS was sent from
	 */
	From: string

	/**
	 * The city the SMS was sent from
	 */
	FromCity: string

	/**
	 * The country the SMS was sent from
	 */
	FromCountry: string

	/**
	 * The state the SMS was sent from
	 */
	FromState: string

	/**
	 * The ZIP code the SMS was sent from
	 */
	FromZip: string

	/**
	 * The SID of the message
	 */
	MessageSid: string

	/**
	 * The SID of the messaging service
	 */

	MessagingServiceSid: string

	/**
	 * The number of media files attached to the SMS
	 */
	NumMedia: string

	/**
	 * The number of segments the SMS was broken into
	 */
	NumSegments: string

	/**
	 * The SID of the SMS message
	 */
	SmsMessageSid: string

	/**
	 * The SID of the SMS
	 */
	SmsSid: string

	/**
	 * The status of the SMS
	 */
	SmsStatus: string

	/**
	 * The phone number the SMS was sent to
	 */
	To: string

	/**
	 * The city the SMS was sent to
	 */
	ToCity: string

	/**
	 * The country the SMS was sent to
	 */
	ToCountry: string

	/**
	 * The state the SMS was sent to
	 */
	ToState: string

	/**
	 * The ZIP code the SMS was sent to
	 */
	ToZip: string
}

export interface TwilioSMSPartyInfo extends ParsedPersonName {
	/**
	 * E.164 formatted phone number the SMS was sent from.
	 */
	phoneNumber: MobilePhoneNumber

	/**
	 * Geo-location information available for the party member.
	 */
	geoLocation: TwilioSMSGeoInfo
}

/**
 * Geo-location information available for each party in a Twilio SMS.
 */
interface TwilioSMSGeoInfo {
	/**
	 * City, town, or village associated with the SMS party member.
	 */
	locality: string | null

	/**
	 * The country the SMS was sent from.
	 */
	country: string | null

	/**
	 * The state the SMS was sent from.
	 */
	stateAbbreviation: AdminLevel1Abbreviation | null
}

interface TwilioSMSReplyBodyParsed {
	raw: TwilioSMSReplyBody
	/**
	 * The body of the SMS.
	 */
	body: string

	senderType: "CONSUMER" | "BUSINESS" | "UNKNOWN"

	sender: TwilioSMSPartyInfo
	recipient: TwilioSMSPartyInfo
}

export async function parseTwilioSMSReplyBody(input: TwilioSMSReplyBody): Promise<TwilioSMSReplyBodyParsed> {
	const addonsBody = parseTwilioSMSReplyAddons(input.AddOns)

	const callerAddon = addonsBody.results?.twilio_caller_name.result.caller_name

	const senderType = callerAddon?.caller_type || "UNKNOWN"
	const callerName = parseContactName(callerAddon?.caller_name)

	const sender: TwilioSMSPartyInfo = {
		...callerName,
		phoneNumber: input.From as MobilePhoneNumber,
		geoLocation: {
			locality: input.FromCity,
			country: input.FromCountry,
			stateAbbreviation: (input.FromState || null) as AdminLevel1Abbreviation | null,
		},
	}

	const recipient: TwilioSMSPartyInfo = {
		phoneNumber: input.To as MobilePhoneNumber,
		geoLocation: {
			locality: input.ToCity,
			country: input.ToCountry,
			stateAbbreviation: (input.ToState || null) as AdminLevel1Abbreviation | null,
		},
	}

	return {
		raw: input,
		body: input.Body,
		senderType,
		sender,
		recipient,
	}
}
