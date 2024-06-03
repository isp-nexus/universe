/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { FIPSBlockGeoID } from "../geoid.js"
import { FIPSStateCode } from "../state.js"
import { findGeoFeatureByBlockID, findIntersectingBlockFeatures } from "./state/block-operations.js"

const logger = ConsoleLogger.withPrefix("Test")

logger.info("Finding GEOID...")

const feature = await findGeoFeatureByBlockID("360470508041001" as FIPSBlockGeoID)
logger.info(`Found GEOID: ${feature.id}`)

logger.info("Querying bbox...")

const featureCollection = await findIntersectingBlockFeatures({
	geometry: {
		coordinates: [
			[
				[-73.9670917980573, 40.76218044745926],
				[-73.97280374010535, 40.76218044745926],
				[-73.97280374010535, 40.75820474114116],
				[-73.9670917980573, 40.75820474114116],
				[-73.9670917980573, 40.76218044745926],
			],
		],
		type: "Polygon",
	},
	stateCode: FIPSStateCode.NY,
})

logger.info(`Found ${featureCollection.features.length} features`)

await ServiceRepository.dispose()
