/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { TemporalColumnOptions } from "@isp.nexus/core"
import { $PostalAddress, type PostalAddress, PostalAddressPart } from "@isp.nexus/mailwoman"
import { EntitySchema, EntitySchemaOptions } from "typeorm"

const AddressColumnsOptions = {
	[PostalAddressPart.FormattedAddress]: {
		type: "text",
		nullable: true,
		unique: true,
	},

	[PostalAddressPart.AdminLevel1]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.PostalCode]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.Locality]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.StreetName]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.DirectionalAbbreviation]: {
		type: "text",
		length: 2,
		nullable: true,
	},

	[PostalAddressPart.StreetSuffixAbbreviation]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.StreetNumber]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.RangeFirst]: {
		type: "int",
		nullable: true,
	},

	[PostalAddressPart.RangeLast]: {
		type: "int",
		nullable: true,
	},

	[PostalAddressPart.SecondaryAddressDesignator]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.PostalFloor]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.POBox]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.GooglePlaceID]: {
		type: "text",
		unique: true,
		nullable: true,
	},

	[PostalAddressPart.PlusCode]: {
		type: "text",
		nullable: true,
	},

	[PostalAddressPart.FabricID]: {
		type: "int",
		unique: true,
		nullable: true,
	},

	[PostalAddressPart.H3Cell]: {
		type: "text",
		length: 15,
		nullable: true,
	},

	[PostalAddressPart.Accuracy]: {
		type: "int",
		nullable: true,
	},

	GEOID: {
		type: "text",
		nullable: true,
	},

	id: {
		primary: true,
		type: "text",
	},

	[PostalAddressPart.SanitizedAddress]: {
		type: "text",
		nullable: true,
		unique: true,
	},
} as const satisfies EntitySchemaOptions<PostalAddress>["columns"]

/**
 * @internal
 */
export const PostalAddressSchema = new EntitySchema<PostalAddress>({
	name: $PostalAddress.tableName,
	columns: {
		...AddressColumnsOptions,

		GEOM: {
			type: "blob",
			nullable: true,
			spatialFeatureType: "Point",
		},

		FOOTPRINT: {
			type: "blob",
			nullable: true,
			spatialFeatureType: "MultiPolygon",
		},
		...TemporalColumnOptions,
	},
	indices: [
		{
			columns: [PostalAddressPart.FormattedAddress],
			unique: true,
		},
		{
			columns: [PostalAddressPart.SanitizedAddress],
			unique: true,
		},
		{
			columns: [PostalAddressPart.AdminLevel1],
		},
		{
			columns: [PostalAddressPart.PostalCode],
		},
		{
			columns: [PostalAddressPart.Locality],
		},
		{
			columns: [PostalAddressPart.GooglePlaceID],
		},
		{
			columns: [PostalAddressPart.PlusCode],
		},
		{
			columns: [PostalAddressPart.FabricID],
			unique: true,
		},
		{
			columns: [PostalAddressPart.H3Cell],
		},
		{
			columns: ["GEOID"],
		},
	],
})

/**
 * Default column selections for TIGER tabulated block entities.
 *
 * @internal
 */
export const PostalAddressColumns = Object.keys(AddressColumnsOptions) as Array<keyof typeof AddressColumnsOptions>
