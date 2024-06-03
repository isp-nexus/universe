/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Initialize the SpatiaLite extension.
 */
export class InitializeSpatialite1719863660273 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(/* sql */ `SELECT InitSpatialMetadata();`)
	}

	public async down(_queryRunner: QueryRunner): Promise<void> {}
}
