/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * @title Entity Classification
 *
 * One or more classes which apply to the entity.
 */
export enum OrganizationClassification {
	/**
	 * @title Incumbent Local Exchange Carrier
	 *
	 * Typically reserved for telephone companies that were in existence when the Telecommunications Act of 1996 was enacted.
	 */
	IncumbentLocalExchangeCarrier = "ILEC",

	/**
	 * @title Competitive Local Exchange Carrier
	 *
	 * A carrier that competes with the ILEC in a given market.
	 */
	CompetitiveLocalExchangeCarrier = "CLEC",

	/**
	 * @title Universal Service Fund Contributor
	 *
	 * An entity that contributes to the Universal Service Fund, which supports
	 * telecommunications services in rural and underserved areas.
	 */
	UniversalServiceFundContributor = "USF_CONTRIBUTOR",

	/**
	 * @title Inter-exchange Carrier
	 *
	 * A carrier that provides long-distance telecommunications services.
	 */
	InterExchange = "INTEREXCHANGE",

	/**
	 * @title Toll Reseller
	 *
	 * A company that resells long-distance services.
	 */
	TollReseller = "TOLL_RESELLER",

	/**
	 * @title State or Local Agency
	 *
	 * A state or local government agency that provides telecommunications services,
	 * such as a municipal broadband network.
	 */
	StateOrLocalAgency = "STATE_OR_LOCAL_AGENCY",

	/**
	 * @title Private Sector Company
	 */
	PrivateSectorCompany = "PRIVATE_SECTOR",

	/**
	 * @title Non-Profit Organization
	 */
	NonProfit = "NON_PROFIT",

	/**
	 * @title Cooperative (Co-Op)
	 */
	Cooperative = "COOPERATIVE",

	/**
	 * @title Municipal Carrier
	 */
	Municipal = "MUNICIPAL",

	/**
	 * @title Rural Carrier
	 */
	Rural = "RURAL",

	/**
	 * @title Other Carrier
	 *
	 * A carrier that does not fit into the ILEC or CLEC categories, possibly
	 * because we lack information about their classification.
	 */
	Other = "OTHER",

	/**
	 * @title DC Agent
	 *
	 * An agent in Washington DC who can accept service of process and official notices for the
	 * company.
	 */
	DCAgent = "DC_AGENT",
}
