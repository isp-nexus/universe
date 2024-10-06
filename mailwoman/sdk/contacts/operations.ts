/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Service for managing point of contact information.
 */

import { pick } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import type { EmailContact, PhoneContact, PointOfContact } from "@isp.nexus/mailwoman"
import { matchOne } from "@isp.nexus/sdk"
import { FindOptionsWhere } from "typeorm"
import { EmailContactSchema, pluckOrCreateEmailID } from "./EmailContactSchema.js"
import { PhoneContactSchema, pluckOrCreatePhoneID } from "./PhoneContactEntity.js"
import { PointOfContactSchema } from "./PointOfContactEntity.js"
import { $ContactsDataSource } from "./data-source.js"

//#region Email Operations

export async function isKnownEmailContact({ id, deliversTo }: Partial<EmailContact>): Promise<boolean> {
	const dataSource = await $ContactsDataSource

	const emailRepository = dataSource.getRepository(EmailContactSchema)

	return emailRepository
		.findOne({
			select: ["id"],
			where: matchOne<EmailContact>([
				// ---
				{ id },
				{ deliversTo },
			]),
		})
		.then((result) => !!result)
}

/**
 * Upsert an email contact.
 */
export async function upsertEmailContact(nextEmailContact: EmailContact | null | undefined): Promise<string | null> {
	if (!nextEmailContact) return null
	// const columns = pick(emailContact, [
	// 	"id",
	// 	"deliversTo",
	// 	"verifiedAt",
	// 	"lastVerifiedByID",
	// ] as const satisfies readonly (keyof EmailContact)[])

	const dataSource = await $ContactsDataSource
	const emailRepository = dataSource.getRepository(EmailContactSchema)

	nextEmailContact.id = pluckOrCreateEmailID(nextEmailContact)

	const exists = await isKnownEmailContact(nextEmailContact)

	if (exists) {
		await emailRepository.update({ id: nextEmailContact.id }, nextEmailContact)
	} else {
		await emailRepository.insert(nextEmailContact)
	}

	return nextEmailContact.id
}

//#endregion

//#region Phone Operations

export async function isKnownPhoneContact({ id, subscriberNumber }: Partial<PhoneContact>): Promise<boolean> {
	const dataSource = await $ContactsDataSource

	const phoneRepository = dataSource.getRepository(PhoneContactSchema)

	return phoneRepository
		.findOne({
			select: ["id"],
			where: matchOne<PhoneContact>([
				// ---
				{ id },
				{ subscriberNumber },
			]),
		})
		.then((result) => !!result)
}

/**
 * Upsert an email contact.
 */
export async function upsertPhoneContact(nextPhoneContact: PhoneContact | null | undefined): Promise<string | null> {
	if (!nextPhoneContact) return null

	const columns = pick(nextPhoneContact, [
		"id",
		"subscriberNumber",
		"verifiedAt",
		"lastVerifiedByID",
	] as const satisfies readonly (keyof PhoneContact)[])

	columns.id = pluckOrCreatePhoneID(nextPhoneContact)

	const dataSource = await $ContactsDataSource
	const phoneRepository = dataSource.getRepository(PhoneContactSchema)

	const exists = await isKnownPhoneContact(columns)

	const qb = phoneRepository.createQueryBuilder().useTransaction(true)

	if (exists) {
		await qb.update().set(columns).where({ id: columns.id }).execute()
	} else {
		await qb.insert().values(columns).execute()
	}

	return columns.id
}

//#endregion

//#region Contact Operations

export async function isKnownPointOfContact({ id }: Partial<PointOfContact>): Promise<boolean> {
	const dataSource = await $ContactsDataSource

	const pointOfContactRepository = dataSource.getRepository(PointOfContactSchema)

	const where: FindOptionsWhere<PointOfContact>[] = []

	if (id) {
		where.push({ id })
	}

	if (!where.length) {
		throw ResourceError.from(400, "Point of contact must have an ID or dataSource", "isKnownPointOfContact")
	}

	return pointOfContactRepository
		.findOne({
			select: ["id"],
			where,
		})
		.then((result) => !!result)
}

/**
 * Upsert a point of contact.
 */
export async function upsertPointOfContact(pointOfContact: PointOfContact | null | undefined): Promise<string | null> {
	if (!pointOfContact) return null

	if (!pointOfContact.origin) {
		throw ResourceError.from(400, "Point of contact must have a data source", "upsertPointOfContact")
	}

	const dataSource = await $ContactsDataSource
	const pointOfContactRepo = dataSource.getRepository(PointOfContactSchema)
	const { emailContactMethods, phoneContactMethods, ...columns } = pointOfContact
	await pointOfContactRepo.save(columns)

	for (const emailContact of pointOfContact.emailContactMethods || []) {
		emailContact.id = pluckOrCreateEmailID(emailContact)
		emailContact.lastVerifiedByID = pointOfContact.id
		await upsertEmailContact(emailContact)
	}

	for (const phoneContact of pointOfContact.phoneContactMethods || []) {
		phoneContact.id = pluckOrCreatePhoneID(phoneContact)
		phoneContact.lastVerifiedByID = pointOfContact.id
		await upsertPhoneContact(phoneContact)
	}

	return pointOfContact.id
}

//#endregion
