/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file USPS delivery address parsing
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { isStateLevelAbbreviation } from "@isp.nexus/tiger"
import { lookupDirectionalAbbreviation, pluckDirectionalName } from "./directional.js"
import { isPOBox } from "./po-box.js"
import { $PostalAddress, PostalAddress, PostalAddressPart } from "./PostalAddress.js"
import { SanitizedPostalAddress } from "./sanitize.js"
import { parseHouseNumberRange, StreetNumberPatterns } from "./street.js"
import { lookupStreetSuffix } from "./suffix.js"
import { pluckUnitDesignator } from "./unit.js"
import { pluckStateZIPCode } from "./zipcode.js"

export class AddressParsingError extends Error {
	override name = "AddressParsingError"
}

/**
 * Partitions a formatted address into segments for parsing.
 *
 * @internal
 * @see {@linkcode parseFormattedAddress} for parsing the segments.
 */
export function partitionFormattedAddress(formattedAddress: string, delimiter = /(PO BOX [\d-]+)|[,\n]/): string[] {
	// We split the address into a list of segments, e.g. comma or new-line delimited.
	const addressSegments = formattedAddress
		.split(delimiter)
		// Remove excess whitespace.
		.map((text) => text?.trim())
		// Remove empty segments.
		.filter(Boolean)

	return addressSegments
}

/**
 * Given a formatted address, attempts to parse out the known parts for a US address.
 *
 * This function is a best-effort attempt to parse a formatted address into its constituent parts,
 * not necessarily CASS-certified.
 *
 * @category Postal
 * @param formattedAddress - The mostly formatted address to parse.
 *
 * @returns The parsed address
 * @throws If input cannot be parsed to a state level.
 */
export function parseFormattedAddress(formattedAddress: SanitizedPostalAddress): PostalAddress {
	const postalAddress: PostalAddress = {
		$schema: $PostalAddress["url"],
		id: null as any,
		GEOM: null as any,
		[PostalAddressPart.FormattedAddress]: formattedAddress,
		[PostalAddressPart.SanitizedAddress]: formattedAddress,
	}

	let partitionCount = 1
	const partiallyPartitioned = partitionFormattedAddress(formattedAddress)
	let currentPartition: string | undefined

	/**
	 * Coarse partitions are the first pass at parsing the address.
	 */
	const coarsePartitions: string[] = []
	/**
	 * Unknown partitions are the second pass at parsing the address.
	 */
	const unknownPartitions: string[] = []

	if (partiallyPartitioned[0] && isPOBox(partiallyPartitioned[0])) {
		// We're starting with a PO Box, so let's parse that out first.
		postalAddress[PostalAddressPart.POBox] = partiallyPartitioned[0]

		partiallyPartitioned.shift()
	}

	//#region Coarse parsing

	while ((currentPartition = partiallyPartitioned.pop())) {
		// Check if the current partition is a state abbreviation.
		if (!postalAddress[PostalAddressPart.AdminLevel1] && isStateLevelAbbreviation(currentPartition)) {
			postalAddress[PostalAddressPart.AdminLevel1] = currentPartition
			// That may be the end of the address, but we'll keep looking for more.

			continue
		}

		if (!postalAddress[PostalAddressPart.PostalCode]) {
			// Check if the current partition is a ZIP code, possibly with a state abbreviation...
			const pairResult = pluckStateZIPCode(currentPartition)

			if (pairResult) {
				postalAddress[PostalAddressPart.PostalCode] = pairResult.zipCode

				if (pairResult.stateAbbreviation) {
					postalAddress[PostalAddressPart.AdminLevel1] = pairResult.stateAbbreviation
				}

				continue
			}
		}

		if (!postalAddress[PostalAddressPart.Locality]) {
			// We haven't found a locality yet, so let's try to find one.
			if (!postalAddress[PostalAddressPart.PostalCode] && partitionCount === 1) {
				partitionCount++
				// Despite not finding a ZIP code, we've only got one partition.
				// We'll try to break up the partition into smaller segments and try again.
				partiallyPartitioned.push(...partitionFormattedAddress(currentPartition, /\s/))

				continue
			}

			// Otherwise, we'll just assume the current partition is the locality!
			postalAddress[PostalAddressPart.Locality] = currentPartition
			continue
		}

		if (!postalAddress[PostalAddressPart.SecondaryAddressDesignator]) {
			// Check if the current partition is a unit designator, e.g. "APT" or "STE".
			const unitMatch = pluckUnitDesignator(currentPartition)

			if (unitMatch) {
				postalAddress[PostalAddressPart.SecondaryAddressDesignator] = currentPartition

				continue
			}
		}

		coarsePartitions.push(currentPartition)
	}

	//#endregion

	//#region Fine parsing

	// Our remaining paritions may be too coarse, so we'll refine them and try again.
	const refinedPartitions = coarsePartitions.flatMap((coarseSegment) => {
		return partitionFormattedAddress(coarseSegment, /\s/)
	})

	// The next loop anticipates that we may need to refine the partitions further.
	while ((currentPartition = refinedPartitions.pop())) {
		if (!postalAddress[PostalAddressPart.StreetSuffixAbbreviation]) {
			const matchedStreetSuffix = lookupStreetSuffix(currentPartition)

			if (matchedStreetSuffix) {
				postalAddress[PostalAddressPart.StreetSuffixAbbreviation] = matchedStreetSuffix.abbreviation
				continue
			}
		}

		if (!postalAddress[PostalAddressPart.DirectionalAbbreviation]) {
			// Check if the current partition is a directional, e.g. "N" or "SW".
			const directional = pluckDirectionalName(currentPartition)

			if (directional) {
				postalAddress[PostalAddressPart.DirectionalAbbreviation] = lookupDirectionalAbbreviation(directional)

				continue
			}
		}

		unknownPartitions.push(currentPartition)
	}

	//#endregion

	//#region Street parsing

	const streetNumberPartitions: string[] = []
	const streetNamePartitions: string[] = []

	// We'll try to determine if the current partition is a street number or name.
	while ((currentPartition = unknownPartitions.pop())) {
		if (streetNamePartitions.length) {
			// Build up a stack of street name partitions.
			streetNamePartitions.push(currentPartition)
			continue
		}

		const whole = StreetNumberPatterns.Real.test(currentPartition)
		const fractional = StreetNumberPatterns.Fractional.test(currentPartition)
		const rational = StreetNumberPatterns.Rational.test(currentPartition)
		const range = StreetNumberPatterns.HouseRange.test(currentPartition)

		if (whole || fractional || rational || range) {
			// Something numeric, let's add it to the number stack.
			streetNumberPartitions.push(currentPartition)
			continue
		}

		streetNamePartitions.push(currentPartition)
	}

	if (!postalAddress[PostalAddressPart.StreetName] && streetNamePartitions.length) {
		// We've got a street name, so let's join the partitions together.
		postalAddress[PostalAddressPart.StreetName] = streetNamePartitions.join(" ")
	}

	if (!postalAddress[PostalAddressPart.StreetNumber] && streetNumberPartitions.length) {
		// We've got a street number, so let's join the partitions together.
		postalAddress[PostalAddressPart.StreetNumber] = streetNumberPartitions.join(" ")
	}
	//#endregion

	const [rangeFirst, rangeLast] = parseHouseNumberRange(postalAddress[PostalAddressPart.StreetNumber]) || []

	postalAddress[PostalAddressPart.RangeFirst] = rangeFirst
	postalAddress[PostalAddressPart.RangeLast] = rangeLast

	if (!postalAddress[PostalAddressPart.AdminLevel1]) {
		ConsoleLogger.warn(`Could not determine US state abbreviation: ${formattedAddress}`)
	}

	return postalAddress
}
