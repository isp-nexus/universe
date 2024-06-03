-- @copyright OpenISP, Inc.
-- @license AGPL-3.0
-- @author Teffen Ellis, et al.
-- @file TIGER SQLite3 Database Initialization Script

PRAGMA auto_vacuum = FULL;
PRAGMA synchronous = FULL;
PRAGMA locking_mode = EXCLUSIVE;
PRAGMA page_size = 4096;
PRAGMA cache_size = 10000;

SELECT load_extension('/opt/homebrew/opt/libspatialite/lib/mod_spatialite.dylib');
SELECT InitSpatialMetadata();

--#region US States

CREATE TABLE "us_state" (
	"state_code" text(2) PRIMARY KEY NOT NULL,
	"abbreviation" text NOT NULL,
	"display_name" text NOT NULL
);

SELECT AddGeometryColumn('us_state', 'GEOM', 4326, 'MultiPolygon', 2, 1);
SELECT CreateSpatialIndex('us_state', 'GEOM');


CREATE UNIQUE INDEX "idx_us_state_code" ON "us_state" (
	"state_code"
);

CREATE UNIQUE INDEX "idx_us_state_abbreviation" ON "us_state" (
	"abbreviation"
);

CREATE UNIQUE INDEX "idx_us_state_display_name" ON "us_state" (
	"display_name"
);

--#endregion

--#region Tracts

CREATE TABLE "tract" (
	"GEOID" text(11) PRIMARY KEY NOT NULL,
	"state_code" text(2) NOT NULL,
	"county_code" text(3) NOT NULL,
	"county_sub_division_code" text(5) NOT NULL,
	"tract_code" text(6) NOT NULL
);

SELECT AddGeometryColumn('tract', 'GEOM', 4326, 'MultiPolygon', 2, 1);
SELECT CreateSpatialIndex('tract', 'GEOM');

--#endregion


--#region Tabulated Blocks

CREATE TABLE "tabblock20" (
	"GEOID" text(15) PRIMARY KEY NOT NULL,
	"state_code" text(2) NOT NULL,
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
	"population" integer NOT NULL
);

SELECT AddGeometryColumn('tabblock20', 'GEOM', 4326, 'MultiPolygon', 2, 1);
SELECT CreateSpatialIndex('tabblock20', 'GEOM');


CREATE UNIQUE INDEX "idx_tabblock20_geoid" ON "tabblock20" (
	"GEOID"
);

CREATE INDEX "idx_tabblock20_state_code" ON "tabblock20" (
	"state_code"
);

CREATE INDEX "idx_tabblock20_county_code" ON "tabblock20" (
	"county_code"
);

CREATE INDEX "idx_tabblock20_county_sub_division_code" ON "tabblock20" (
	"county_sub_division_code"
);

CREATE INDEX "idx_tabblock20_tract_code" ON "tabblock20" (
	"tract_code"
);

CREATE INDEX "idx_tabblock20_block_group_code" ON "tabblock20" (
	"block_group_code"
);

CREATE INDEX "idx_tabblock20_block_code" ON "tabblock20" (
	"block_code"
);

CREATE INDEX "idx_tabblock20_urbanized_area_code" ON "tabblock20" (
	"urbanized_area_code"
);

CREATE INDEX "idx_tabblock20_urban_rural_code" ON "tabblock20" (
	"urban_rural_code"
);

CREATE INDEX "idx_tabblock20_housing_unit_count" ON "tabblock20" (
	"housing_unit_count"
);

CREATE INDEX "idx_tabblock20_land_area_sqm" ON "tabblock20" (
	"land_area_sqm"
);

CREATE INDEX "idx_tabblock20_water_area_sqm" ON "tabblock20" (
	"water_area_sqm"
);

CREATE INDEX "idx_tabblock20_population" ON "tabblock20" (
	"population"
);

CREATE INDEX "idx_tabblock20_state_code_county_code" ON "tabblock20" (
	"state_code",
	"county_code"
);

CREATE INDEX "idx_tabblock20_state_code_county_code_tract_code" ON "tabblock20" (
	"state_code",
	"county_code",
	"tract_code"
);

CREATE INDEX "idx_tabblock20_state_code_county_code_tract_code_block_group_code" ON "tabblock20" (
	"state_code",
	"county_code",
	"tract_code",
	"block_group_code"
);

CREATE INDEX "idx_tabblock20_state_code_county_code_tract_code_block_group_code_block_code" ON "tabblock20" (
	"state_code",
	"county_code",
	"tract_code",
	"block_group_code",
	"block_code"
);

--#endregion




