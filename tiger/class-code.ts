/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Defines the current class of a geographic entity. These codes can be found in the TIGER/Line
 * products, gazetteer files, and other products.
 *
 * @title MAF/TIGER Feature Class Code
 */
export enum TIGERClassCode {
	/**
	 * A prominent elevation rising above the surrounding level of the Earth's surface.
	 */
	MountainPeakOrSummit = "C3022",

	/**
	 * An area of dry or relatively dry land surrounded by water or low wetland. (including
	 * archipelago, atoll, cay, hammock, hummock, isla, isle, key, moku, and rock)
	 */
	Island = "C3023",

	/**
	 * An embankment flanking a stream or other flowing water feature to prevent overflow.
	 */
	Levee = "C3024",

	/**
	 * A durable, permanent structure, extending into a body of water, built to protect a shoreline
	 * from erosion, to form a protected coastal marina/harbor, or to create stable channels for
	 * navigation. Unlike piers and docks, water does not flow under it. Alternatively referred to as
	 * a groyne, groin, seawall, or bulwark.
	 */
	JettyBreakwater = "C3025",

	/**
	 * An area from which commercial minerals are or were removed from the Earth; not including an
	 * oilfield or gas field.
	 */
	QuarryOpenPitMine = "C3026",

	/**
	 * A barrier built across the course of a stream to impound water and/or control water flow.
	 */
	Dam = "C3027",

	/**
	 * An expanded paved area at the end of a street used by vehicles for turning around. The
	 * placement of addressed structures located along the street may wrap around the end of the
	 * cul-de-sac.
	 */
	CulDeSac = "C3061",

	/**
	 * A circular intersection allowing for continuous movement of traffic at the meeting of roadways,
	 * when the circle is represented as a point.
	 */
	TrafficCircle = "C3062",

	/**
	 * A movable barrier across a road.
	 */
	Gate = "C3066",

	/**
	 * A structure or barrier where a fee is collected for using a road.
	 */
	TollBooth = "C3067",

	/**
	 * A manmade structure, higher than its diameter, generally used for observation, storage, or
	 * electronic transmission.
	 */
	Tower = "C3071",

	/**
	 * A manmade structure, higher than its diameter, used to transmit light and possibly sound
	 * generally to aid in navigation.
	 */
	LighthouseBeacon = "C3074",

	/**
	 * One or more manmade structures, used for liquid or gas storage or for distribution activities.
	 */
	TankFarm = "C3075",

	/**
	 * A facility where power is generated from the wind.
	 */
	WindmillFarm = "C3076",

	/**
	 * A facility where power is generated from the sun.
	 */
	SolarFarm = "C3077",

	/**
	 * A manmade structure to educate, commemorate, or memorialize an event, person, or feature.
	 */
	MonumentMemorial = "C3078",

	/**
	 * A locational marker or monument placed on or near a boundary line to preserve and identify the
	 * location of the boundary line on the ground.
	 */
	BoundaryMonumentPoint = "C3079",

	/**
	 * A point on the ground whose position (horizontal or vertical) is known and can be used as a
	 * base for additional survey work.
	 */
	SurveyControlPoint = "C3080",

	/**
	 * A point that identifies the location and name of a locality (e.g., crossroad, community,
	 * populated place or locale) that usually does not have a formally established boundary.
	 */
	LocalityPoint = "C3081",

	/**
	 * A point that serves as the core of an Alaska Native village and is used in defining Alaska
	 * Native village statistical areas.
	 */
	AlaskaNativeVillageOfficialPoint = "C3085",

	/**
	 * This feature represents sovereign states recognized by the U.S. Department of State. For Census
	 * Bureau purposes, the area for which the decennial census is conducted, which is the United
	 * States, Puerto Rico, and the Island Areas (American Samoa, Guam, the Commonwealth of the
	 * Northern Mariana Islands, and the U.S. Virgin Islands). The feature may also include other
	 * sovereign states such as Canada and Mexico, but currently does not do so.
	 */
	Nation = "G1000",

	/**
	 * A grouping of states and the District of Columbia for the presentation of census data. The
	 * United States is subdivided into four Census Regions—Northeast, South, Midwest, and West.
	 */
	CensusRegion = "G1100",

	/**
	 * A grouping of states and the District of Columbia that is a subdivision of the four Census
	 * Regions.
	 */
	CensusDivision = "G1200",

	/**
	 * A legally defined state- or federally recognized reservation and/or off-reservation trust land
	 * entity (excluding statistical American Indian and Alaska Native areas).
	 */
	AmericanIndianArea = "G2100",

	/**
	 * A legal area held in trust for the benefit of Native Hawaiians by the state of Hawaii, pursuant
	 * to the Hawaiian Homes Commission Act of 1920, as amended.
	 */
	HawaiianHomeLand = "G2120",

	/**
	 * A statistical area that represents the more densely settled portion of Alaska Native villages
	 * (ANVs), which constitute associations, bands, clans, communities, groups, tribes, or villages
	 * recognized pursuant to the Alaska Native Claims Settlement Act of 1971 (Public Law 92-203).
	 */
	AlaskaNativeVillageStatisticalArea = "G2130",

	/**
	 * A statistical entity identified and delineated by the Census Bureau in consultation with
	 * federally recognized American Indian tribes that have no current reservation, but had a former
	 * reservation in Oklahoma.
	 */
	OklahomaTribalStatisticalArea = "G2140",

	/**
	 * A statistical geographic entity identified and delineated for the Census Bureau by a
	 * state-appointed liaison for a state-recognized American Indian tribe that does not currently
	 * have a reservation and/or lands in trust.
	 */
	StateDesignatedTribalStatisticalArea = "G2150",

	/**
	 * A statistical geographic entity identified and delineated for the Census Bureau by a federally
	 * recognized American Indian tribe that does not currently have a reservation and/or
	 * off-reservation trust land.
	 */
	TribalDesignatedStatisticalArea = "G2160",

	/**
	 * An area administered jointly and/or claimed by two or more American Indian tribes.
	 */
	AmericanIndianJointUseArea = "G2170",

	/**
	 * Corporate entities with legal boundaries established to conduct both business and nonprofit
	 * affairs of Alaska Natives pursuant to the Alaska Native Claims Settlement Act of 1972 (Public
	 * Law 92-203). There are twelve geographically defined ANRCs and they are all within and cover
	 * most of the State of Alaska (the Annette Island Reserve—an American Indian reservation—is
	 * excluded from any ANRC).
	 */
	AlaskaNativeRegionalCorporation = "G2200",

	/**
	 * Administrative subdivisions of federally recognized American Indian reservations,
	 * off-reservation trust lands, or Oklahoma tribal statistical areas (OTSAs). These entities are
	 * internal units of self-government or administration that serve social, cultural, and/or
	 * economic purposes for the American Indians on the reservations, off-reservation trust lands, or
	 * OTSAs.
	 */
	TribalSubdivision = "G2300",

	/**
	 * A relatively small and permanent statistical subdivision of a federally recognized American
	 * Indian reservation and/or off-reservation trust land, delineated by American Indian tribal
	 * participants or the Census Bureau for the purpose of presenting demographic data.
	 */
	TribalCensusTract = "G2400",

	/**
	 * A cluster of census blocks within a single tribal census tract delineated by American Indian
	 * tribal participants or the Census Bureau for the purpose of presenting demographic data.
	 */
	TribalBlockGroup = "G2410",

	/**
	 * A grouping of adjacent metropolitan and/or micropolitan statistical areas that have a degree of
	 * economic and social integration, as measured by commuting.
	 */
	CombinedStatisticalArea = "G3100",

	/**
	 * An area containing a substantial population nucleus together with adjacent communities having a
	 * high degree of economic and social integration with that core, as measured by commuting. Each
	 * area is defined using whole counties and equivalents.
	 */
	MetropolitanMicropolitanStatisticalArea = "G3110",

	/**
	 * A county or grouping of counties that is a subdivision of a Metropolitan Statistical Area
	 * containing an urbanized area with a population of 2.5 million or more.
	 */
	MetropolitanDivision = "G3120",

	/**
	 * A grouping of adjacent New England city and town areas that have a degree of economic and
	 * social integration, as measured by commuting.
	 */
	CombinedNewEnglandCityTownArea = "G3200",

	/**
	 * An area containing a substantial population nucleus together with adjacent communities having a
	 * high degree of economic and social integration with that core, as measured by commuting. Each
	 * area is defined using Minor Civil Divisions (MCDs) in New England.
	 */
	NewEnglandCityTownMetropolitanMicropolitanStatisticalArea = "G3210",

	/**
	 * A grouping of cities and towns in New England that is a subdivision of a New England City and
	 * Town Area containing an urbanized area with a population of 2.5 million or more.
	 */
	NewEnglandCityTownDivision = "G3220",

	/**
	 * For the 2020 Census, an urban area will comprise a densely developed core of census blocks that
	 * meet minimum housing unit density requirements, along with adjacent territory containing
	 * non-residential urban land uses as well as other lower density territory included to link
	 * outlying densely settled territory with the densely settled core. To qualify as an urban area,
	 * the territory identified according to the criteria must encompass at least 2,000 housing units
	 * or at least 5,000 persons.
	 */
	UrbanArea = "G3500",

	/**
	 * The primary governmental divisions of the United States. The District of Columbia is treated as
	 * a statistical equivalent of a state for census purposes, as are Puerto Rico, American Samoa,
	 * Guam, the Commonwealth of the Northern Mariana Islands, and the U.S. Virgin Islands.
	 */
	StateEquivalentFeature = "G4000",

	/**
	 * The primary division of a state or state equivalent area. The primary divisions of 48 states
	 * are termed County, but other terms are used such as Borough in Alaska, Parish in Louisiana, and
	 * Municipio in Puerto Rico. This feature includes independent cities, which are incorporated
	 * places that are not part of any county.
	 */
	CountyEquivalentFeature = "G4020",

	/**
	 * The primary divisions of counties and equivalent features for the reporting of Census Bureau
	 * data. The subtypes of this feature are Minor Civil Division, Census County Division/Census
	 * Subarea, and Unorganized Territory. This feature includes independent places, which are
	 * incorporated places that are not part of any county subdivision.
	 */
	CountySubdivision = "G4040",

	/**
	 * A subdivision of the three major islands in the U.S. Virgin Islands (USVI). The estates have
	 * legally defined boundaries and are much smaller in area than the Census Subdistricts (USVI
	 * county subdivisions), but do not necessarily nest within these districts.
	 */
	Estate = "G4050",

	/**
	 * Legally defined divisions (subbarrios) of minor civil divisions (barrios-pueblo and barrios) in
	 * Puerto Rico.
	 */
	SubMinorCivilDivision = "G4060",

	/**
	 * A legal entity incorporated under state law to provide general-purpose governmental services to
	 * a concentration of population. Incorporated places are generally designated as a city, borough,
	 * municipality, town, village, or, in a few instances, have a different legal description.
	 */
	IncorporatedPlace = "G4110",

	/**
	 * An incorporated place that has merged governmentally with a county or minor civil division, but
	 * one or more of the incorporated places continues to function within the consolidation. It is a
	 * place that contains additional separately incorporated places.
	 */
	ConsolidatedCity = "G4120",

	/**
	 * A statistical area that is defined for a named concentration of population and is the
	 * statistical counterpart of an incorporated place.
	 */
	CensusDesignatedPlace = "G4210",

	/**
	 * The lowest level of geographic area for presentation of some types of Economic Census data. It
	 * includes incorporated places, consolidated cities, census designated places (CDPs), minor civil
	 * divisions (MCDs) in selected states, and balances of MCDs or counties. An incorporated place,
	 * CDP, MCD, or balance of MCD qualifies as an economic census place if it contains 2,500 or more
	 * residents, or 2,500 or more jobs, according to the most current data available.
	 */
	EconomicCensusPlace = "G4300",

	/**
	 * Relatively permanent statistical subdivisions of a County or equivalent feature delineated by
	 * local participants as part of the Census Bureau's Participant Statistical Areas Program.
	 */
	CensusTract = "G5020",

	/**
	 * A cluster of census blocks having the same first digit of their four-digit identifying numbers
	 * within a Census Tract. For example, block group 3 (BG 3) within a Census Tract includes all
	 * blocks numbered from 3000 to 3999.
	 */
	BlockGroup = "G5030",

	/**
	 * The lowest-order census defined statistical area. It is an area, such as a city block, bounded
	 * primarily by physical features but sometimes by invisible city or property boundaries. A
	 * tabulation block boundary does not cross the boundary of any other geographic area for which
	 * the Census Bureau tabulates data. The subtypes of this feature are Count Question Resolution
	 * (CQR), current, and tabulation census.
	 */
	TabulationBlock = "G5040",

	/**
	 * The 435 areas from which people are elected to the U.S. House of Representatives. Additional
	 * equivalent features exist for state equivalents with nonvoting delegates or no representative.
	 * The subtypes of this feature are 111th, 113th, 114th, 115th, 116th, 117th, and 118th
	 * Congressional Districts, plus subsequent Congresses.
	 */
	CongressionalDistrict = "G5200",

	/**
	 * Areas established by a state or equivalent government from which members are elected to the
	 * upper or unicameral chamber of a state governing body. The upper chamber is the senate in a
	 * bicameral legislature, and the unicameral case is a single house legislature (Nebraska). The
	 * subtypes of this feature are legislative session year, such as 2010, 2012, 2014, 2016, 2017,
	 * 2018, and so forth, with the year indicating the vintage of the district.
	 */
	StateLegislativeDistrictUpperChamber = "G5210",

	/**
	 * Areas established by a state or equivalent government from which members are elected to the
	 * lower chamber of a state governing body. The lower chamber is the House of Representatives in a
	 * bicameral legislature. The subtypes of this feature are legislative session year, such as 2010,
	 * 2012, 2014, 2016, 2017, 2018, and so forth, with the year indicating the vintage of the
	 * district.
	 */
	StateLegislativeDistrictLowerChamber = "G5220",

	/**
	 * The generic name for the geographic features, such as precincts, wards, and election districts,
	 * established by state, local, and tribal governments for the purpose of conducting elections.
	 */
	VotingDistrict = "G5240",

	/**
	 * A geographic area within which officials provide public elementary grade-level educational
	 * services for residents.
	 */
	ElementarySchoolDistrict = "G5400",

	/**
	 * A geographic area within which officials provide public secondary grade-level educational
	 * services for residents.
	 */
	SecondarySchoolDistrict = "G5410",

	/**
	 * A geographic area within which officials provide public educational services for all grade
	 * levels for residents.
	 */
	UnifiedSchoolDistrict = "G5420",

	/**
	 * Statistical geographic areas defined for the tabulation and dissemination of American Community
	 * Survey (ACS) and Puerto Rico Community Survey, Public Use Microdata Sample (PUMS) data, as well
	 * as ACS period estimates, and decennial census data. Nesting within states or equivalent
	 * entities, PUMAs cover the entirety of the United States, Puerto Rico, Guam, and the U.S. Virgin
	 * Islands.
	 */
	PublicUseMicrodataArea = "G6120",

	/**
	 * An area defined under state authority to manage urbanization that the U.S. Census Bureau
	 * includes in its products in agreement with an individual state.
	 */
	UrbanGrowthArea = "G6330",

	/**
	 * An approximate statistical-area representation of a U.S. Postal Service (USPS) 5-digit ZIP Code
	 * service area.
	 */
	ZIPCodeTabulationArea = "G6350",

	/**
	 * A grouping of municipios (county equivalents) defined by Puerto Rico officials for the purpose
	 * of presenting economic census statistical data.
	 */
	PlanningRegion = "G6400",

	/**
	 * A known, but nonspecific, hydrographic connection between two nonadjacent water features.
	 */
	Connector = "H1100",

	/**
	 * A standing body of water that is surrounded by land.
	 */
	LakePond = "H2030",

	/**
	 * An artificially impounded body of water.
	 */
	Reservoir = "H2040",

	/**
	 * An artificial body of water built to treat fouled water.
	 */
	TreatmentPond = "H2041",

	/**
	 * A body of water partly surrounded by land. [includes arm, bight, cove, and inlet]
	 */
	BayEstuaryGulfSound = "H2051",

	/**
	 * The great body of salt water that covers much of the Earth.
	 */
	OceanSea = "H2053",

	/**
	 * A body of ice moving outward and down slope from an area of accumulation; an area of relatively
	 * permanent snow or ice on the top or side of a mountain or mountainous area. [includes ice field
	 * and ice patch]
	 */
	Glacier = "H2081",

	/**
	 * A natural flowing waterway. [includes anabranch, awawa, branch, brook, creek, distributary,
	 * fork, kill, pup, rio, and run]
	 */
	StreamRiver = "H3010",

	/**
	 * A natural flowing waterway with an intricate network of interlacing channels.
	 */
	BraidedStream = "H3013",

	/**
	 * An artificial waterway constructed to transport water, to irrigate or drain land, to connect
	 * two or more bodies of water, or to serve as a waterway for watercraft. [includes lateral]
	 */
	CanalDitchAqueduct = "H3020",

	/**
	 * A building complex that contains multiple living quarters generally for which rent is paid.
	 */
	ApartmentBuildingComplex = "K1121",

	/**
	 * An area in which parking space for house trailers is rented, usually providing utilities and
	 * services.
	 */
	TrailerCourtMobileHomePark = "K1223",

	/**
	 * A point or area in which the population of military or merchant marine vessels at sea are
	 * assigned, usually being at or near the home port pier.
	 */
	CrewOfVesselLocation = "K1225",

	/**
	 * A facility providing housing for a number of persons employed as semi-permanent or seasonal
	 * laborers.
	 */
	HousingFacilityDormitoryForWorkers = "K1226",

	/**
	 * A facility providing transient lodging or living quarters, generally for some payment.
	 */
	HotelMotelResortSpaHostelYMCAOrYWCA = "K1227",

	/**
	 * An area used for setting up mobile temporary living quarters (camp) or holding a camp meeting,
	 * sometimes providing utilities and other amenities.
	 */
	Campground = "K1228",

	/**
	 * A facility providing low-cost or free living quarters established by a welfare or educational
	 * organization for the needy people of a district.
	 */
	ShelterMission = "K1229",

	/**
	 * A facility where the sick or injured may receive medical or surgical attention. [including
	 * infirmary]
	 */
	HospitalHospiceUrgentCareFacility = "K1231",

	/**
	 * A facility to house and provide care for the elderly.
	 */
	NursingHomeRetirementHomeHomeForTheAged = "K1233",

	/**
	 * A facility (correctional or non-correctional) where groups of juveniles reside; this includes
	 * training schools, detention centers, residential treatment centers and orphanages.
	 */
	JuvenileInstitution = "K1235",

	/**
	 * A facility that serves as a place for the confinement of adult persons in lawful detention,
	 * administered by a local (tribal, county, municipal, etc.) government.
	 */
	LocalJailDetentionCenter = "K1236",

	/**
	 * A facility that serves as a place for the confinement of adult persons in lawful detention,
	 * administered by the federal government or a state government.
	 */
	FederalPenitentiaryStatePrisonPrisonFarm = "K1237",

	/**
	 * A facility that serves as a place for the confinement of adult persons in lawful detention, not
	 * elsewhere classified or administered by a government of unknown jurisdiction.
	 */
	OtherCorrectionalInstitution = "K1238",

	/**
	 * An institution intended for residential use by those having a religious vocation.
	 */
	ConventMonasteryRectoryOtherReligiousGroupQuarters = "K1239",

	/**
	 * A place where employees are employed in federal, state, local, or tribal government.
	 */
	GovernmentalWorkplaces = "K2100",

	/**
	 * An area owned and/or occupied by the Department of Defense for use by a branch of the armed
	 * forces (such as the Army, Navy, Air Force, Marines, or Coast Guard), or a state owned area for
	 * the use of the National Guard.
	 */
	MilitaryInstallation = "K2110",

	/**
	 * A meeting place used by members of a community for social, cultural, or recreational purposes.
	 */
	CommunityCenter = "K2146",

	/**
	 * A place used by members of government (either federal, state, local, or tribal) for
	 * administration and public business.
	 */
	GovernmentCenter = "K2165",

	/**
	 * An exhibition hall or conference center with enough open space to host public and private
	 * business and social events.
	 */
	ConventionCenter = "K2167",

	/**
	 * A place or area set aside for recreation or preservation of a cultural or natural resource.
	 */
	Park = "K2180",

	/**
	 * Land under the jurisdiction of the National Park Service, including National Parks, most
	 * National Monuments, and certain other lands.
	 */
	NationalParkServiceLand = "K2181",

	/**
	 * Land under the jurisdiction of the U.S. Forest Service or other federal agency, excluding
	 * National Park Service land.
	 */
	NationalForestOtherFederalLand = "K2182",

	/**
	 * A place or area set aside for recreation or preservation of a cultural or natural resource and
	 * under the administration of an American Indian tribe.
	 */
	TribalParkForestRecreationArea = "K2183",

	/**
	 * A place or area set aside for recreation or preservation of a cultural or natural resource and
	 * under the administration of a state government.
	 */
	StateParkForestRecreationArea = "K2184",

	/**
	 * A place or area set aside for recreation or preservation of a cultural or natural resource and
	 * under the administration of a regional government.
	 */
	RegionalParkForestRecreationArea = "K2185",

	/**
	 * A place or area set aside for recreation or preservation of a cultural or natural resource and
	 * under the administration of a county government.
	 */
	CountyParkForestRecreationArea = "K2186",

	/**
	 * A place or area set aside for recreation or preservation of a cultural or natural resource and
	 * under the administration of a minor civil division (town/township) government.
	 */
	CountySubdivisionParkForestRecreationArea = "K2187",

	/**
	 * A place or area set aside for recreation or preservation of a cultural or natural resource and
	 * under the administration of a municipal government.
	 */
	IncorporatedPlaceParkForestRecreationArea = "K2188",

	/**
	 * A privately owned place or area set aside for recreation or preservation of a cultural or
	 * natural resource.
	 */
	PrivateParkForestRecreationArea = "K2189",

	/**
	 * A place or area set aside for recreation or preservation of a cultural or natural resource and
	 * under the administration of some other type of government or agency such as an independent park
	 * authority or commission.
	 */
	OtherParkForestRecreationArea = "K2190",

	/**
	 * An official facility of the U.S. Postal Service used for processing and distributing mail and
	 * other postal material.
	 */
	PostOffice = "K2191",

	/**
	 * A facility that houses equipment and personnel to fight fires and provide other assistance.
	 */
	FireDepartment = "K2193",

	/**
	 * A facility that is the headquarters for law enforcement officers.
	 */
	PoliceStation = "K2194",

	/**
	 * A facility in which literary, musical, artistic, or reference materials are kept for public
	 * use.
	 */
	Library = "K2195",

	/**
	 * A facility that houses the chief administrative offices of a local municipal government.
	 */
	CityTownHall = "K2196",

	/**
	 * A place of employment for wholesale, retail, or other trade.
	 */
	CommercialWorkplace = "K2300",

	/**
	 * A group of retail establishments within a planned subdivision sharing a common parking area.
	 */
	ShoppingCenterMajorRetailCenter = "K2361",

	/**
	 * One or more manufacturing establishments within an area zoned for fabrication, construction, or
	 * other similar trades.
	 */
	IndustrialBuildingIndustrialPark = "K2362",

	/**
	 * One or more structures containing employees performing business, clerical, or professional
	 * services.
	 */
	OfficeBuildingOfficePark = "K2363",

	/**
	 * An agricultural establishment where crops are grown and/or animals are raised.
	 */
	FarmVineyardWineryOrchard = "K2364",

	/**
	 * A place of employment not elsewhere classified or of unknown type.
	 */
	OtherEmploymentCenter = "K2366",

	/**
	 * A facility where one or more modes of transportation can be accessed by people or for the
	 * shipment of goods; examples of such a facility include marine terminal, bus station, train
	 * station, airport and truck warehouse.
	 */
	TransportationTerminal = "K2400",

	/**
	 * A place where privately owned, light-watercraft and/or houseboats are moored.
	 */
	Marina = "K2424",

	/**
	 * A platform built out from the shore into the water and supported by piles. This platform may
	 * provide access to ships and boats, or it may be used for recreational purposes.
	 */
	PierDock = "K2432",

	/**
	 * A manmade facility maintained for the use of aircraft. [including airstrip, landing field, and
	 * landing strip]
	 */
	AirportAirfield = "K2451",

	/**
	 * A place where travelers can board and exit rail transit lines, including associated ticketing,
	 * freight, and other commercial offices.
	 */
	TrainStationTrolleyMassTransitRailStation = "K2452",

	/**
	 * A place where travelers can board and exit mass motor vehicle transit, including associated
	 * ticketing, freight, and other commercial offices.
	 */
	BusTerminal = "K2453",

	/**
	 * A place where travelers can board and exit water transit or where cargo is handled, including
	 * associated ticketing, freight, and other commercial offices.
	 */
	MarineTerminal = "K2454",

	/**
	 * A place where an airplane equipped with floats for landing on or taking off from a body of
	 * water can debark and load.
	 */
	SeaplaneAnchorage = "K2455",

	/**
	 * The area of an airport adjusted to include whole tabulation blocks used for the delineation of
	 * urban areas.
	 */
	AirportStatisticalRepresentation = "K2457",

	/**
	 * A fairly level and usually paved expanse used by airplanes for taking off and landing at an
	 * airport.
	 */
	RunwayTaxiway = "K2459",

	/**
	 * A fairly level and usually paved expanse used by helicopters for taking off and landing.
	 */
	HelicopterLandingPad = "K2460",

	/**
	 * An institution for post-secondary study, teaching, and learning. [including seminary]
	 */
	UniversityCollege = "K2540",

	/**
	 * An institution for preschool, elementary or secondary study, teaching, and learning.
	 */
	SchoolAcademy = "K2543",

	/**
	 * An attraction of historical, cultural, educational or other interest that provides information
	 * or displays artifacts.
	 */
	MuseumVisitorCenterCulturalCenterTouristAttraction = "K2545",

	/**
	 * A public or private facility designed for playing golf.
	 */
	GolfCourse = "K2561",

	/**
	 * A facility that offers entertainment, performances or sporting events. Examples include arena,
	 * auditorium, theater, stadium, coliseum, race course, theme park, fairgrounds and shooting
	 * range.
	 */
	AmusementCenter = "K2564",

	/**
	 * A place or area for burying the dead. [including burying ground and memorial garden]
	 */
	Cemetery = "K2582",

	/**
	 * A facility in which terrestrial and/or marine animals are confined within enclosures and
	 * displayed to the public for educational, preservation, and research purposes.
	 */
	Zoo = "K2586",

	/**
	 * A sanctified place or structure where people gather for religious worship; examples include
	 * church, synagogue, temple, and mosque.
	 */
	PlaceOfWorship = "K3544",

	/**
	 * A long tubular conduit or series of pipes, often underground, with pumps and valves for flow
	 * control, used to transport fluid (e.g., crude oil, natural gas), especially over great
	 * distances.
	 */
	Pipeline = "L4010",

	/**
	 * One or more wires, often on elevated towers, used for conducting high-voltage electric power.
	 */
	Powerline = "L4020",

	/**
	 * A conveyance that transports passengers or freight in carriers suspended from cables and
	 * supported by a series of towers.
	 */
	AerialTramwaySkiLift = "L4031",

	/**
	 * A man-made barrier enclosing or bordering a field, yard, etc., usually made of posts and wire
	 * or wood, used to prevent entrance, to confine, or to mark a boundary.
	 */
	FenceLine = "L4110",

	/**
	 * The line of highest elevation along a ridge.
	 */
	RidgeLine = "L4121",

	/**
	 * A very steep or vertical slope. [including bluff, crag, head, headland, nose, palisades,
	 * precipice, promontory, rim, and rimrock]
	 */
	CliffEscarpment = "L4125",

	/**
	 * A line defined as beginning at one location point and ending at another, where each of these
	 * points is usually in sight of the other and no structures are in proximity to the line. This
	 * includes straight-line, nonvisible, 180-degree extensions off the ends of a terminating linear
	 * feature.
	 */
	PointToPointLine = "L4130",

	/**
	 * A cadastral boundary line separating two distinct real property parcels or a Public Land Survey
	 * System or equivalent survey line.
	 */
	PropertyParcelLine = "L4140",

	/**
	 * The line that separates either land or Inland water from Coastal, Territorial or Great Lakes
	 * water. Where land directly borders Coastal, Territorial or Great Lakes water, the shoreline
	 * represents the Coastline. Where Inland water (such as a river) flows into Coastal, Territorial
	 * or Great Lakes water, the closure line separating the Inland water from the other class of
	 * water represents the Coastline.
	 */
	Coastline = "L4150",

	/**
	 * A nonvisible feature defining the route used to carry or convey people or cargo back and forth
	 * over a waterbody in a boat.
	 */
	FerryCrossing = "L4165",

	/**
	 * A legal/statistical boundary line that does not correspond to a shoreline or other visible
	 * feature on the ground.
	 */
	NonvisibleLinearLegalStatisticalBoundary = "P0001",

	/**
	 * The more-or-less permanent boundary between land and water for a water feature that exists
	 * year-round.
	 */
	PerennialShoreline = "P0002",

	/**
	 * The boundary between land and water (when water is present) for a water feature that does not
	 * exist year-round.
	 */
	IntermittentShoreline = "P0003",

	/**
	 * An edge that does not represent a legal/statistical boundary, and does not correspond to a
	 * shoreline or other visible feature on the ground. Many such edges bound area landmarks, while
	 * many others separate water features from each other (e.g., where a bay meets the ocean).
	 */
	OtherNonVisibleEdge = "P0004",

	/**
	 * A fixed rail line, generally visible from the surface, which carries any type of rail vehicle
	 * including railroad, off-street transit and mountain rail systems.
	 */
	RailFeature = "R1011",

	/**
	 * Primary roads are limited-access highways that connect to other roads only at interchanges and
	 * not at at-grade intersections. This category includes Interstate highways, as well as all other
	 * highways with limited access (some of which are toll roads). Limited-access highways with only
	 * one lane in each direction, as well as those that are undivided, are also included under
	 * S1100.
	 */
	PrimaryRoad = "S1100",

	/**
	 * Secondary roads are main arteries that are not limited access, usually in the U.S. highway,
	 * state highway, or county highway systems. These roads have one or more lanes of traffic in each
	 * direction, may or may not be divided, and usually have at-grade intersections with many other
	 * roads and driveways. They often have both a local name and a route number.
	 */
	SecondaryRoad = "S1200",

	/**
	 * Generally a paved non-arterial street, road, or byway that usually has a single lane of traffic
	 * in each direction. Roads in this feature class may be privately or publicly maintained. Scenic
	 * park roads would be included in this feature class, as would (depending on the region of the
	 * country) some unpaved roads.
	 */
	LocalNeighborhoodRoadRuralRoadCityStreet = "S1400",

	/**
	 * An unpaved dirt trail where a four-wheel drive vehicle is required. These vehicular trails are
	 * found almost exclusively in very rural areas. Minor, unpaved roads usable by ordinary cars and
	 * trucks belong in the S1400 category.
	 */
	VehicularTrail4WD = "S1500",

	/**
	 * A road that allows controlled access from adjacent roads onto a limited access highway, often
	 * in the form of a cloverleaf interchange.
	 */
	Ramp = "S1630",

	/**
	 * A road, usually paralleling a limited access highway, that provides access to structures and/or
	 * service facilities along the highway. These roads can be named and may intersect with other
	 * roads.
	 */
	ServiceDrive = "S1640",

	/**
	 * A path that is used for walking, being either too narrow for or legally restricted from
	 * vehicular traffic.
	 */
	WalkwayPedestrianTrail = "S1710",

	/**
	 * A pedestrian passageway from one level to another by a series of steps.
	 */
	Stairway = "S1720",

	/**
	 * A service road that does not generally have associated addressed structures and is usually
	 * unnamed. It is located at the rear of buildings and properties and is used for deliveries.
	 */
	Alley = "S1730",

	/**
	 * A road within private property that is privately maintained for service, extractive, or other
	 * purposes. These roads are often unnamed.
	 */
	PrivateRoadForServiceVehicles = "S1740",

	/**
	 * Internal U.S. Census Bureau use.
	 */
	InternalUSCensusBureauUse = "S1750",

	/**
	 * The main travel route for vehicles through a paved parking area. This may include unnamed roads
	 * through apartment/condominium/office complexes where pull-in parking spaces line the road.
	 */
	ParkingLotRoad = "S1780",

	/**
	 * A type of seasonal trail, created and marked in snow, primarily traveled by snowmobiles and dog
	 * sleds, and used to reach housing units and to connect communities.
	 */
	WinterTrail = "S1810",

	/**
	 * A path that is used for manual or small, motorized bicycles, being either too narrow for or
	 * legally restricted from vehicular traffic.
	 */
	BikePathOrTrail = "S1820",

	/**
	 * A path that is used for horses, being either too narrow for or legally restricted from
	 * vehicular traffic.
	 */
	BridlePath = "S1830",
}
