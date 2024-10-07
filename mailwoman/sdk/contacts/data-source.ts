/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Service for managing point of contact information.
 */

import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { DataSourceFile, dataSourcePathBuilder, NexusDataSource } from "@isp.nexus/sdk"
import { packageOutPathBuilder } from "@isp.nexus/sdk/reflection"
import { OrganizationSchema } from "../org/OrganizationSchema.js"
import { EmailContactSchema } from "./EmailContactSchema.js"
import { PhoneContactSchema } from "./PhoneContactEntity.js"
import { PointOfContactSchema } from "./PointOfContactEntity.js"

/**
 * Data source for managing contact information.
 *
 * @singleton
 */
export const $ContactsDataSource = ServiceRepository.register(() => {
	return new NexusDataSource({
		displayName: "Contacts",
		storagePath: dataSourcePathBuilder("contacts", DataSourceFile.SQLite3),
		migrations: packageOutPathBuilder("mailwoman", "sdk", "contacts", "migrations"),
		entities: [
			// ---
			EmailContactSchema,
			PhoneContactSchema,
			PointOfContactSchema,
			OrganizationSchema,
		],
	})
})
