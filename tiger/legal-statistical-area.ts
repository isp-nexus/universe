/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Describes the particular typology for each geographic entity.
 *
 * For legal entities, the LSAD reflects the term that appears in legal documentation pertaining to
 * the entity, such as a treaty, charter, legislation, resolution, or ordinance.
 *
 * For statistical entities, the LSAD is the term assigned by the Census Bureau or other agency
 * defining the entity.
 *
 * @title Legal/Statistical Area Description
 */
export enum LegalStatisticalAreaDescription {
	/**
	 * - American Indian Area
	 * - Congressional District
	 * - Consolidated City
	 * - County or Equivalent Feature,
	 * - County Subdivision
	 * - Economic Census Place
	 * - Elementary School District
	 * - Incorporated Place,
	 * - Local/Tribal Legislative District
	 * - Military Installation
	 * - Nation
	 * - Secondary School District,
	 * - Special School Administrative Area
	 * - Special-Purpose District
	 * - State Legislative District (Lower Chamber)
	 * - State Legislative District (Upper Chamber)
	 * - State or Equivalent Feature
	 * - Tribal Subdivision
	 * - Unified School District
	 * - Voting District
	 */
	Other = "00",
	/**
	 * County or Equivalent Feature.
	 */
	CityAndBorough = "03",
	/**
	 * County or Equivalent Feature.
	 */
	Borough = "04",
	/**
	 * County or Equivalent Feature.
	 */
	CensusArea = "05",
	/**
	 * County or Equivalent Feature.
	 */
	County = "06",
	/**
	 * County or Equivalent Feature.
	 */
	District = "07",
	/**
	 * County or Equivalent Feature, Economic Census Place.
	 */
	Island = "10",
	/**
	 * County or Equivalent Feature.
	 */
	Municipality = "12",
	/**
	 * County or Equivalent Feature.
	 */
	Municipio = "13",
	/**
	 * County or Equivalent Feature, Economic Census Place.
	 */
	Parish = "15",
	/**
	 * County Subdivision.
	 */
	Parrio = "20",
	/**
	 * County Subdivision, Economic Census Place.
	 */
	BoroughCounty = "21",
	/**
	 * County Subdivision.
	 */
	CCD = "22",
	/**
	 * County Subdivision.
	 */
	CensusSubArea = "23",
	/**
	 * County Subdivision.
	 */
	CensusSubDistrict = "24",
	/**
	 * Consolidated City, County or Equivalent Feature, County Subdivision, Economic Census Place,
	 * Incorporated Place.
	 */
	City = "25",
	CountySuffixCountySubdivision = "26",
	DistrictSuffixCountySubdivision = "27",
	DistrictSuffixCountySubdivisionTribal = "28",
	PrecinctSuffixCountySubdivision = "29",
	PrecinctPrefixCountySubdivision = "30",
	GoreSuffixCountySubdivision = "31",
	GrantSuffixCountySubdivision = "32",
	LocationSuffixCountySubdivision = "36",
	MunicipalitySuffixEconomicCensusPlaceIncorporatedPlace = "37",
	PlantationSuffixCountySubdivision = "39",
	BarrioPuebloSuffixCountySubdivision = "41",
	PurchaseSuffixCountySubdivision = "42",
	TownSuffixCountySubdivisionEconomicCensusPlaceIncorporatedPlace = "43",
	TownshipSuffixCountySubdivisionEconomicCensusPlace = "44",
	TownshipPrefixCountySubdivision = "45",
	UtSuffixCountySubdivision = "46",
	VillageSuffixCountySubdivisionEconomicCensusPlaceIncorporatedPlace = "47",
	CharterTownshipSuffixCountySubdivisionEconomicCensusPlace = "49",
	SubbarrioSuffixSubMinorCivilDivision = "51",
	CityAndBoroughSuffixEconomicCensusPlaceIncorporatedPlace = "53",
	ComunidadSuffixCensusDesignatedPlace = "55",
	CdpSuffixCensusDesignatedPlaceEconomicCensusPlace = "57",
	ZonaUrbanaSuffixCensusDesignatedPlace = "62",
	RegionSuffixCensusRegion = "68",
	DivisionSuffixCensusDivision = "69",
	UgaSuffixUrbanGrowthArea = "70",
	CmsaConsolidatedMetropolitanStatisticalAreaAndMetropolitanStatisticalArea = "71",
	MsaConsolidatedMetropolitanStatisticalAreaAndMetropolitanStatisticalArea = "72",
	PrimaryMetropolitanStatisticalAreaPrimaryMetropolitanStatisticalArea = "73",
	NewEnglandCountyMetropolitanAreaNewEnglandCountyMetropolitanArea = "74",
	UrbanizedAreaSuffixUrbanArea = "75",
	UrbanClusterSuffixUrbanArea = "76",
	AlaskaNativeRegionalCorporationSuffixAlaskaNativeRegionalCorporation = "77",
	HawaiianHomeLandSuffixHawaiianHomeLand = "78",
	AnvsaSuffixAlaskaNativeVillageStatisticalArea = "79",
	TdsaSuffixTribalDesignatedStatisticalArea = "80",
	ColonySuffixAmericanIndianArea = "81",
	CommunitySuffixAmericanIndianAreaTribalSubdivision = "82",
	JointUseAreaSuffixAmericanIndianJointUseArea = "83",
	PuebloSuffixAmericanIndianArea = "84",
	RancheriaSuffixAmericanIndianArea = "85",
	ReservationSuffixAmericanIndianAreaCountySubdivision = "86",
	ReserveSuffixAmericanIndianArea = "87",
	OtsaSuffixOklahomaTribalStatisticalArea = "88",
	TrustLandSuffixAmericanIndianArea = "89",
	JointUseOtsaSuffixAmericanIndianJointUseArea = "90",
	RanchSuffixAmericanIndianArea = "91",
	SdtsaSuffixStateDesignatedTribalStatisticalArea = "92",
	IndianVillageSuffixAmericanIndianArea = "93",
	VillageSuffixAmericanIndianArea = "94",
	IndianCommunitySuffixAmericanIndianArea = "95",
	IndianReservationSuffixAmericanIndianArea = "96",
	IndianRancheriaSuffixAmericanIndianArea = "97",
	IndianColonySuffixAmericanIndianArea = "98",
	PuebloDeAmericanIndianArea = "99",
	PuebloOfAmericanIndianArea = "9C",
	RanchReservationSuffixAmericanIndianArea = "9D",
	RancheriaReservationSuffixAmericanIndianArea = "9E",
	RanchesSuffixAmericanIndianArea = "9F",
	BalanceOfCountyEconomicCensusPlace = "B1",
	BalanceOfParishEconomicCensusPlace = "B2",
	BalanceOfBoroughEconomicCensusPlace = "B3",
	BalanceOfCensusAreaEconomicCensusPlace = "B4",
	TownBalanceEconomicCensusPlace = "B5",
	TownshipBalanceEconomicCensusPlace = "B6",
	CharterTownshipBalanceEconomicCensusPlace = "B7",
	BalanceOfEconomicCensusPlace = "B8",
	BlockGroupPrefixBlockGroup = "BG",
	BalanceOfIslandEconomicCensusPlace = "BI",
	BlockPrefixTabulationBlock = "BK",
	BalanceIncorporatedPlace = "BL",
	CongressionalDistrictAtLargeActualTextCongressionalDistrict = "C1",
	CongressionalDistrictPrefixCongressionalDistrict = "C2",
	ResidentCommissionerDistrictAtLargeActualTextCongressionalDistrict = "C3",
	DelegateDistrictAtLargeActualTextCongressionalDistrict = "C4",
	NoRepresentativeActualTextCongressionalDistrict = "C5",
	ConsolidatedGovernmentBalanceIncorporatedPlace = "CB",
	ConsolidatedGovernmentSuffixConsolidatedCityEconomicCensusPlace = "CG",
	CorporationSuffixIncorporatedPlace = "CN",
	CommercialRegionSuffixCommercialRegion = "CR",
	CensusTractPrefixCensusTract = "CT",
	TribalBlockGroupPrefixTribalBlockGroup = "IB",
	TribalCensusTractPrefixTribalCensusTract = "IT",
	WardPrefixStateLegislativeDistrictUpperChamber = "L1",
	SenatorialDistrictSuffixStateLegislativeDistrictUpperChamber = "L2",
	AssemblyDistrictPrefixStateLegislativeDistrictLowerChamber = "L3",
	GeneralAssemblyDistrictPrefixStateLegislativeDistrictLowerChamber = "L4",
	StateLegislativeDistrictPrefixStateLegislativeDistrictLowerChamber = "L5",
	StateLegislativeSubdistrictPrefixStateLegislativeDistrictLowerChamber = "L6",
	DistrictStateLegislativeDistrictLowerChamberStateLegislativeDistrictUpperChamber = "L7",
	StateHouseDistrictPrefixStateLegislativeDistrictLowerChamber = "LL",
	StateSenateDistrictPrefixStateLegislativeDistrictUpperChamber = "LU",
	CsaSuffixCombinedStatisticalArea = "M0",
	MetroAreaSuffixMetropolitanAndMicropolitanStatisticalArea = "M1",
	MicroAreaSuffixMetropolitanAndMicropolitanStatisticalArea = "M2",
	MetroDivisionSuffixMetropolitanDivision = "M3",
	CombinedNectaSuffixCombinedNewEnglandCityAndTownArea = "M4",
	MetropolitanNectaSuffixNewEnglandCityAndTownMetropolitanAndMicropolitanStatisticalArea = "M5",
	MicropolitanNectaSuffixNewEnglandCityAndTownMetropolitanAndMicropolitanStatisticalArea = "M6",
	NectaDivisionSuffixNewEnglandCityAndTownDivision = "M7",
	MetropolitanGovernmentBalanceEconomicCensusPlaceIncorporatedPlace = "MB",
	MetropolitanGovernmentSuffixConsolidatedCityEconomicCensusPlaceIncorporatedPlace = "MG",
	MetroGovernmentSuffixConsolidatedCity = "MT",
	SuperPumaPrefixPublicUseMicrodataArea_1Area = "P1",
	PumaPrefixPublicUseMicrodataArea_5Or_10Area = "P5",
	AreaSuffixTribalSubdivision = "T1",
	ChapterSuffixTribalSubdivision = "T2",
	SegmentSuffixTribalSubdivision = "T3",
	AdministrativeAreaSuffixTribalSubdivision = "TA",
	AdditionSuffixTribalSubdivision = "TB",
	CountyDistrictPrefixTribalSubdivision = "TC",
	TazPrefixTrafficAnalysisZone = "TZ",
	UnifiedGovernmentBalanceIncorporatedPlace = "UB",
	UrbanCountySuffixEconomicCensusPlaceIncorporatedPlace = "UC",
	UnifiedGovernmentSuffixConsolidatedCityEconomicCensusPlaceIncorporatedPlace = "UG",
	VotingDistrictPrefixVotingDistrict = "V1",
	VotingDistrictSuffixVotingDistrict = "V2",
	Zcta3SuffixZipCodeTabulationAreaThreeDigit = "Z3",
	Zcta5SuffixZipCodeTabulationAreaFiveDigit = "Z5",
}
