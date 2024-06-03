/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Geocoding service for converting between addresses and geographic positions.
 */

import { pick } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { isPostalAddressID, type PostalAddress, PostalAddressPart, sanitizePostalAddress } from "@isp.nexus/mailwoman"
import {
	GeoPoint,
	GeoPointInput,
	GooglePlaceID,
	H3Cell,
	isGooglePlaceID,
	isH3Cell,
	PointLiteral,
} from "@isp.nexus/spatial"
import { geometryToEWKH, geometryToSQL, wellKnownGeometryToGeoJSON } from "@isp.nexus/spatial/sdk"
import { FIPSStateCode, GeoIDPart, isStateAbbreviation, parseGeoID, TIGERBlockFeature } from "@isp.nexus/tiger"
import { findGeoFeatureByBlockID, findIntersectingBlockFeatures } from "@isp.nexus/tiger/sdk"
import { LRUCache } from "lru-cache"
import { FindOptionsWhere } from "typeorm"
import { $GoogleGeocoder } from "../google/index.js"
import { PostalAddressColumns, PostalAddressSchema } from "./PostalAddressSchema.js"
import { $PostalDataSource } from "./data-source.js"

const logger = ConsoleLogger.withPrefix("Postal")

export async function isKnownPostalAddress(postalAddress: Partial<PostalAddress>): Promise<boolean> {
	const dataSource = await $PostalDataSource

	const postalRepo = dataSource.getRepository(PostalAddressSchema)
	const { id } = postalAddress

	const where: FindOptionsWhere<PostalAddress>[] = []

	if (id) {
		where.push({ id })
	}
	if (postalAddress[PostalAddressPart.SanitizedAddress]) {
		where.push({ [PostalAddressPart.SanitizedAddress]: postalAddress[PostalAddressPart.SanitizedAddress] })
	}

	if (postalAddress[PostalAddressPart.FabricID]) {
		where.push({ [PostalAddressPart.FabricID]: postalAddress[PostalAddressPart.FabricID] })
	}

	if (postalAddress[PostalAddressPart.GooglePlaceID]) {
		where.push({ [PostalAddressPart.GooglePlaceID]: postalAddress[PostalAddressPart.GooglePlaceID] })
	}

	if (!where.length) {
		throw ResourceError.from(400, "No valid search criteria provided", "postal", "isKnownPostalAddress")
	}

	return postalRepo
		.findOne({
			select: ["id"],
			where,
		})
		.then((result) => !!result)
}

/**
 * Upsert a postal address.
 */
export async function upsertPostalAddress(nextPostalAddress: PostalAddress | null | undefined): Promise<string | null> {
	if (!nextPostalAddress) return null

	const columns = pick(nextPostalAddress, PostalAddressColumns)
	const { FOOTPRINT, GEOM } = nextPostalAddress

	const dataSource = await $PostalDataSource
	const exists = await isKnownPostalAddress(nextPostalAddress)

	const qb = dataSource.getRepository(PostalAddressSchema).createQueryBuilder().useTransaction(true)

	if (exists) {
		const query = qb
			.update()
			.set({
				...columns,
				GEOM: geometryToSQL(GEOM),
				FOOTPRINT: geometryToSQL(FOOTPRINT),
			})
			.where({ id: nextPostalAddress.id })

		await query.execute()
	} else {
		const query = qb.insert().values({
			...columns,
			GEOM: geometryToSQL(GEOM),
			FOOTPRINT: geometryToSQL(FOOTPRINT),
		})

		await query.execute()
	}

	return nextPostalAddress.id
}

const PostalAddressLookupCache = new LRUCache<string, PostalAddress>({
	max: 1000,
})

/**
 * Given a geographic coordinate, attempt to find a postal address.
 */
export function findPostalAddress(coordinate: GeoPointInput): Promise<PostalAddress[]>
/**
 * Given a H3 cell, attempt to find a postal address.
 */
export function findPostalAddress(cell: H3Cell): Promise<PostalAddress[]>
/**
 * Given a Google Place ID, attempt to find a postal address.
 */
export function findPostalAddress(placeID: GooglePlaceID): Promise<PostalAddress[]>
/**
 * Given a formatted address, attempt to find a postal address.
 */
export function findPostalAddress(formattedAddress: string): Promise<PostalAddress[]>
/**
 * Given a geographic coordinate, Google Place ID, or formatted address, attempt to find a postal
 * address.
 */
export async function findPostalAddress(input: unknown): Promise<PostalAddress[]>
export async function findPostalAddress(input: unknown): Promise<PostalAddress[]> {
	if (!input) throw ResourceError.from(400, "No input provided", "findPostalAddress")

	const cacheKey = JSON.stringify(input)
	const cachedAddress = PostalAddressLookupCache.get(cacheKey)

	if (cachedAddress) {
		logger.info(cachedAddress[PostalAddressPart.SanitizedAddress], "🗄️ Found cached postal address")
		return [cachedAddress]
	}

	const dataSource = await $PostalDataSource

	const query = dataSource
		.getRepository(PostalAddressSchema)
		//---
		.createQueryBuilder()
		.select(PostalAddressColumns)
		.addSelect("AsEWKB(GEOM)", "serializedGeometry")
		.limit(1)

	if (typeof input === "string") {
		if (isH3Cell(input)) {
			query.where({ [PostalAddressPart.H3Cell]: input })
		} else if (isGooglePlaceID(input)) {
			query.where({ [PostalAddressPart.GooglePlaceID]: input })
		} else if (isPostalAddressID(input)) {
			query.where({ id: input })
		} else {
			query.where({
				[PostalAddressPart.SanitizedAddress]: sanitizePostalAddress(input),
			})
		}
	} else {
		const geoPoint = GeoPoint.from(input)

		if (geoPoint) {
			query.where(/* sql*/ `Covers(GEOM, GeomFromEWKB(:ewkb))`).setParameter("ewkb", geometryToEWKH(geoPoint.toJSON()))
		}
	}

	const rows: PostalAddressRow[] = await query.execute()

	if (rows.length) {
		return rows.map((row) => {
			const address = parsePostalAddressFromRow(row)
			logger.info(address[PostalAddressPart.SanitizedAddress], "📍 Found existing postal address")

			PostalAddressLookupCache.set(cacheKey, address)

			return address
		})
	}

	const geocodedAddresses = await geocode(input)

	for (const geocodedAddress of geocodedAddresses) {
		await upsertPostalAddress(geocodedAddress)
		PostalAddressLookupCache.set(cacheKey, geocodedAddress)
	}

	return geocodedAddresses
}

/**
 * Given a postal address, attempt to find TIGER data to further refine the address.
 */
export async function findSupplementalTIGERData(postalAddress: PostalAddress): Promise<Partial<TIGERBlockFeature>> {
	logger.info(`Finding supplemental TIGER data for (${postalAddress[PostalAddressPart.SanitizedAddress]})...`)

	if (postalAddress.GEOID) {
		const parsedGeoID = parseGeoID(postalAddress.GEOID)

		if (parsedGeoID && parsedGeoID[GeoIDPart.Block]) {
			return findGeoFeatureByBlockID(parsedGeoID)
		}
	}

	const adminLevel1 = postalAddress[PostalAddressPart.AdminLevel1]

	if (!isStateAbbreviation(adminLevel1)) return {}

	const stateCode = FIPSStateCode[adminLevel1]
	const formattedAddress = postalAddress[PostalAddressPart.SanitizedAddress]

	const { features } = await findIntersectingBlockFeatures({
		geometry: postalAddress.GEOM,
		stateCode,
	})

	if (features.length === 0) {
		logger.warn(`No intersecting blocks found: (${formattedAddress})`)
		return {}
	}

	if (features.length > 1) {
		logger.warn(
			features.map((feature) => feature.id),
			`Multiple intersecting blocks found: (${formattedAddress})`
		)
		return {}
	}

	return features[0]!
}

/**
 * Given a geographic coordinate, Google Place ID, or formatted address, attempt to geocode the
 * address.
 */
export async function geocode(coordinate: GeoPointInput): Promise<PostalAddress[]>
export async function geocode(placeID: GooglePlaceID): Promise<PostalAddress[]>
export async function geocode(cell: H3Cell): Promise<PostalAddress[]>
export async function geocode(formattedAddress: string): Promise<PostalAddress[]>
export async function geocode(input: unknown): Promise<PostalAddress[]>
export async function geocode(input: unknown): Promise<PostalAddress[]> {
	const geocoder = await $GoogleGeocoder

	const baseAddresses = await geocoder.geocode(input)
	const postalAddresses = await Promise.all(
		baseAddresses.map(async (address) => {
			return findSupplementalTIGERData(address).then((supplementedTIGERData) => ({
				...address,
				GEOID: supplementedTIGERData?.id,
				...supplementedTIGERData?.properties,
			}))
		})
	)

	return postalAddresses
}

/**
 * @internal
 */
interface PostalAddressRow extends PostalAddress {
	/**
	 * @format hex
	 */
	serializedGeometry?: string
}

function parsePostalAddressFromRow({ serializedGeometry, ...row }: PostalAddressRow): PostalAddress {
	const address = row as PostalAddress

	if (serializedGeometry) {
		address.GEOM = wellKnownGeometryToGeoJSON<PointLiteral>(Buffer.from(serializedGeometry, "hex"))
	}

	return address
}
