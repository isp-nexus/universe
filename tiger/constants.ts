/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/* eslint-disable @typescript-eslint/no-shadow */
import { TIGERClassCode } from "./class-code.js"
import { TIGERFunctionalStatus } from "./functional-status.js"
import {
	FIPSBlockCode,
	FIPSBlockGroupCode,
	FIPSCongressionalDistrictCode,
	FIPSCountyCode,
	FIPSCountySubDivisionCode,
	FIPSPlaceCode,
	FIPSTractCode,
	GeoIDPart,
} from "./geoid.js"
import { LegalStatisticalAreaDescription } from "./legal-statistical-area.js"
import { FIPSStateCode } from "./state.js"

/**
 * A code indicating the classification of the block, i.e. urban or rural.
 *
 * @title TIGER Geographic Classification
 *
 * @minLength 1
 * @maxLength 1
 */
export enum TIGERGeographicClassification {
	Urban = "U",
	Rural = "R",
}

/**
 * @title Land/Water Block Type
 *
 * A code indicating the type of feature represented by the land/water block.
 */
export enum LandWaterBlockType {
	/**
	 * Block is land.
	 */
	Land = "L",
	/**
	 * Block is water.
	 */
	Water = "W",
}

/**
 * @title TIGER Property
 */
export enum TIGERProperty {
	/**
	 * @title Geographic Identifier
	 */
	GeoID = "GEOID",
	/**
	 * @title Display Name
	 */
	DisplayName = "display_name",
	/**
	 * @title Urban/Rural Code
	 */
	UrbanRuralCode = "urban_rural_code",
	/**
	 * @title Urban Area Code
	 */
	UrbanizedAreaCode = "urbanized_area_code",
	/**
	 * @title Land Area (square meters)
	 */
	LandAreaSqm = "land_area_sqm",
	/**
	 * @title Water Area (square meters)
	 */
	WaterAreaSqm = "water_area_sqm",
	/**
	 * @title Housing Unit Count
	 */
	HousingUnitCount = "housing_unit_count",
	/**
	 * @title Population Count
	 */
	Population = "population",
	/**
	 * @title Functional Status
	 */
	FunctionalStatus = "functional_status",
	/**
	 * @title Centroid Latitude
	 */
	CentroidLatitude = "latitude",
	/**
	 * @title Centroid Longitude
	 */
	CentroidLongitude = "longitude",
	/**
	 * @title Legal/Statistical Area Description
	 */
	LegalStatisticalAreaDescription = "legal_statistical_area_description",
	/**
	 * @title MAF/TIGER Feature Class Code
	 */
	ClassCode = "class_code",
}

/**
 * Properties common to all Census.
 */
export interface TIGERPropertyRecord<GeoID extends string = string> {
	/**
	 * @title Geographic Identifier
	 */
	[TIGERProperty.GeoID]: GeoID

	/**
	 * @title State FIPS Code.
	 */
	[GeoIDPart.State]: FIPSStateCode

	/**
	 * @title County
	 */
	[GeoIDPart.County]: FIPSCountyCode

	/**
	 * @title County Sub Division
	 */
	[GeoIDPart.CountySubDivision]: FIPSCountySubDivisionCode

	/**
	 * @title Tract
	 */
	[GeoIDPart.Tract]: FIPSTractCode

	/**
	 * @title Place
	 */
	[GeoIDPart.Place]: FIPSPlaceCode

	/**
	 * @title Congressional District
	 */
	[GeoIDPart.CongressionalDistrict]: FIPSCongressionalDistrictCode

	/**
	 * @title Block
	 */
	[GeoIDPart.Block]: FIPSBlockCode

	/**
	 * @title Block Group
	 */
	[GeoIDPart.BlockGroup]: FIPSBlockGroupCode

	/**
	 * Urban/Rural Code.
	 *
	 * @title Urban/Rural Code
	 *
	 * @minLength 1
	 * @maxLength 1
	 */
	[TIGERProperty.UrbanRuralCode]: TIGERGeographicClassification

	/**
	 * A code indicating a specific urban area, such as a specific city, or a specific region of
	 * cities.
	 *
	 * For example, 23824 references Detroit, MI. 63217 references the region of New York City, Jersey
	 * City, and Newark.
	 *
	 * @title Urban Area Code
	 * @minLength 5
	 * @maxLength 5
	 */
	[TIGERProperty.UrbanizedAreaCode]: string

	/**
	 * Land Area in square meters.
	 *
	 * @type integer
	 * @title Land Area
	 * @minimum 0
	 */
	[TIGERProperty.LandAreaSqm]: number

	/**
	 * Water Area in square meters.
	 *
	 * @type integer
	 * @title Water Area
	 * @minimum 0
	 */
	[TIGERProperty.WaterAreaSqm]: number

	/**
	 * The tabulated block's housing unit count.
	 *
	 * Note: This is the number of housing units in the block, not the number of people.
	 *
	 * @type integer
	 * @title Housing Units
	 * @minimum 0
	 */
	[TIGERProperty.HousingUnitCount]: number

	/**
	 * The tabulated block's population count.
	 *
	 * @type integer
	 * @title Population Count
	 * @minimum 0
	 */
	[TIGERProperty.Population]: number

	/**
	 * @title Legal/Statistical Area Description
	 */
	[TIGERProperty.LegalStatisticalAreaDescription]: LegalStatisticalAreaDescription

	/**
	 * @title MAF/TIGER Feature Class Code
	 */
	[TIGERProperty.ClassCode]: TIGERClassCode

	/**
	 * Functional Status.
	 *
	 * @title Functional Status
	 * @minLength 1
	 * @maxLength 1
	 * @pattern ^[A-Z]$
	 */
	[TIGERProperty.FunctionalStatus]: TIGERFunctionalStatus

	/**
	 * Longitude of the internal point.
	 *
	 * @title Centroid Longitude
	 */
	[TIGERProperty.CentroidLongitude]: number

	/**
	 * Latitude of the internal point.
	 *
	 * @title Centroid Latitude
	 */
	[TIGERProperty.CentroidLatitude]: number
}
