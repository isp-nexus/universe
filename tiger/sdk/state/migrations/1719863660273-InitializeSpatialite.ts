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

		await queryRunner.query(/*sql*/ `
		CREATE TABLE "tract" (
			"GEOID" text(11) PRIMARY KEY NOT NULL,
			"state_code" text(2) NOT NULL,
			"county_code" text(3) NOT NULL,
			"county_sub_division_code" text(5) NOT NULL,
			"tract_code" text(6) NOT NULL
		);`)

		await queryRunner.query(/*sql*/ `SELECT AddGeometryColumn('tract', 'GEOM', 4326, 'MultiPolygon', 2, 1);`)

		await queryRunner.query(/*sql*/ `
		CREATE TABLE "tabblock20" (
			"GEOID" text(15) PRIMARY KEY NOT NULL,
			"county_code" text(3) NOT NULL,
			"county_sub_division_code" text(5) NOT NULL,
			"tract_code" text(6) NOT NULL,
			"block_group_code" text(1) NOT NULL,
			"block_code" text(4) NOT NULL,
			"urbanized_area_code" text(5),
			"urban_rural_code" text(1),
			"housing_unit_count" integer NOT NULL,
			"land_area_sqm" integer NOT NULL,
			"water_area_sqm" integer NOT NULL,
			"population" integer NOT NULL);`)

		await queryRunner.query(/*sql*/ `SELECT AddGeometryColumn('tabblock20', 'GEOM', 4326, 'MultiPolygon', 2, 1);`)
	}

	public async down(_queryRunner: QueryRunner): Promise<void> {}
}
