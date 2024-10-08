/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Geocode an address.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { castToPostalAddressFeature, PostalAddressPart } from "@isp.nexus/mailwoman"
import { $GoogleGeocoder, printGeoFeatureAsTable } from "@isp.nexus/mailwoman/sdk"
import { CommandHandler, copyToClipboard } from "@isp.nexus/sdk"
import { CommandBuilder } from "yargs"
export const command = "geocode [geocoder-input]"
export const describe = "Geocode an address."

interface CommandArgs {
	"geocoder-input": string
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	"geocoder-input": {
		describe: "A formatted address, geographic coordinates, or Google Place ID.",
		type: "string",
		alias: ["i"],
	},
}

export const handler: CommandHandler<CommandArgs> = async (args) => {
	const geocoder = await $GoogleGeocoder

	ConsoleLogger.info(`Geocoding: ${args.geocoderInput}`)

	const postalAddresses = await geocoder.geocode(args.geocoderInput)

	const [postalAddress] = postalAddresses

	if (!postalAddress) {
		throw ResourceError.from(500, `\`${args.geocoderInput}\`: Geocoding failed.`)
	}

	const feature = castToPostalAddressFeature(postalAddress)

	const placeID = postalAddress[PostalAddressPart.GooglePlaceID]

	if (placeID) {
		ConsoleLogger.info(`Fetching place details for \`${placeID}\`...`)
		const placeDetails = await geocoder.placeDetails(placeID)

		Object.assign(feature.properties, placeDetails)
	}

	await copyToClipboard(feature)

	ConsoleLogger.info("GeoJSON copied to clipboard.")
	ConsoleLogger.info(printGeoFeatureAsTable(feature), "GeoJSON")
}
