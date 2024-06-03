DROP VIEW IF EXISTS parsed_provider;

DROP VIEW IF EXISTS grouped_provider;

DROP VIEW IF EXISTS combined_provider;

CREATE TEMP VIEW parsed_provider AS
SELECT
	holding_company,
	provider_name,
	provider_id,
	frn,
	dba_name,
	comparision_name,
	MAX(ilec_tag) AS ilec_tag,
	MAX(clec_tag) AS clec_tag,
	-- Association
	(comparision_name REGEXP 'ASSOCIATION|ASSN') AS association_tag,
	-- Telephone
	(comparision_name REGEXP 'TELEPHONE| PHONE') AS telephone_tag,
	-- Rural
	comparision_name LIKE '%RURAL%' AS rural_tag,
	-- Co-op
	(comparision_name REGEXP 'COOP|CO-OPERATIVE') AS coop_tag,
	-- Municipality
	(comparision_name REGEXP 'STATE|COUNTY|CITY|MUNICIPAL|UTILITY|TOWN|VILLAGE|BOROUGH|PARISH|TOWNSHIP|COUNTY') AS municipal_tag,
	-- State
	(
		comparision_name REGEXP 'ALASKA|ALABAMA|ARKANSAS|ARIZONA|CALIFORNIA|COLORADO|CONNECTICUT|DISTRICT OF COLUMBIA|DELAWARE|FLORIDA|GEORGIA|HAWAII|IOWA|IDAHO|ILLINOIS|INDIANA|KANSAS|KENTUCKY|LOUISIANA|MASSACHUSETTS|MARYLAND|MAINE|MICHIGAN|MINNESOTA|MISSOURI|MISSISSIPPI|MONTANA|NORTH CAROLINA|NORTH DAKOTA|NEBRASKA|NEW HAMPSHIRE|NEW JERSEY|NEW MEXICO|NEVADA|NEW YORK|OHIO|OKLAHOMA|OREGON|PENNSYLVANIA|RHODE ISLAND|SOUTH CAROLINA|SOUTH DAKOTA|TENNESSEE|TEXAS|UTAH|VIRGINIA|VERMONT|WASHINGTON|WISCONSIN|WEST VIRGINIA|WYOMING|AMERICAN SAMOA|JOHNSTON ATOLL|GUAM|VIRGIN ISLANDS|NORTHERN MARIANA ISLANDS|PUERTO RICO'
	) AS state_tag
FROM
	(
		SELECT
			*,
			-- Concatenate for later comparison
			concat (UPPER(provider_name), ' ', UPPER(holding_company)) AS comparision_name,
			-- Doing-business-as name
			CASE
				WHEN UPPER(provider_name) LIKE '% DBA %' THEN
				-- Extract the DBA name
				TRIM(SUBSTR (provider_name, INSTR (UPPER(provider_name), 'DBA') + 3))
				ELSE NULL
			END AS dba_name
		FROM
			(
				SELECT
					replace (replace (replace (replace (p.holding_company, '.', ''), ',', ''), '/', ''), '  ', ' ') AS holding_company,
					replace (replace (replace (replace (p.provider_name, '.', ''), ',', ''), '/', ''), '  ', ' ') AS provider_name,
					p.provider_id,
					p.frn,
					-- Incumbent Local Exchange Carrier
					CASE UPPER(p.operation_type)
						WHEN "ILEC" THEN TRUE
						ELSE FALSE
					END AS ilec_tag,
					-- Competitive Local Exchange Carrier
					CASE UPPER(p.operation_type)
						WHEN "NON-ILEC" THEN TRUE
						ELSE FALSE
					END AS clec_tag
				FROM
					bdc.providers_base AS p
			)
	)
GROUP BY
	provider_id,
	holding_company,
	frn
ORDER BY
	provider_id,
	holding_company,
	provider_name;

CREATE TEMP VIEW grouped_provider AS
SELECT
	holding_company,
	provider_id,
	comparision_name,
	MAX(ilec_tag) AS ilec_tag,
	MAX(clec_tag) AS clec_tag,
	MAX(association_tag) AS association_tag,
	MAX(telephone_tag) AS telephone_tag,
	MAX(rural_tag) AS rural_tag,
	MAX(coop_tag) AS coop_tag,
	MAX(municipal_tag) AS municipal_tag,
	MAX(ilec_tag) IS FALSE
	AND MAX(state_tag) AS state_tag,
	json_object (
		'id',
		provider_id,
		'holdingCompany',
		holding_company,
		'frns',
		json_group_array (DISTINCT frn),
		'divisionsByFRN',
		json_group_object (frn, provider_name),
		'tags',
		json (
			printf (
				'[%s]',
				concat_ws (
					',',
					iif (ilec_tag, json_quote ('ilec'), NULL),
					iif (clec_tag, json_quote ('clec'), NULL),
					iif (association_tag, json_quote ('association'), NULL),
					iif (telephone_tag, json_quote ('telephone'), NULL),
					iif (rural_tag AND NOT ilec_tag, json_quote ('rural'), NULL),
					iif (coop_tag AND NOT ilec_tag, json_quote ('coop'), NULL),
					iif (municipal_tag AND NOT ilec_tag, json_quote ('municipal'), NULL),
					iif (state_tag AND NOT ilec_tag, json_quote ('state'), NULL)
				)
			)
		),
		'doingBusinessAsByFRN',
		json_patch ("{}", json_group_object (frn, dba_name))
	) as provider_json
FROM
	parsed_provider
GROUP BY
	provider_id,
	holding_company
ORDER BY
	provider_id,
	holding_company,
	provider_name;

CREATE TEMP VIEW combined_provider AS
SELECT
	grouped.holding_company,
	grouped.provider_id,
	grouped.comparision_name,
	bdcp.claimed_record_count,
	bdcp.state_record_count,
	bdcp.technology_codes,
	grouped.ilec_tag,
	grouped.clec_tag,
	grouped.association_tag,
	grouped.telephone_tag,
	grouped.rural_tag,
	grouped.coop_tag,
	grouped.municipal_tag,
	grouped.state_tag,
	json_patch (
		grouped.provider_json,
		json_object (
			'claimedRecordCount',
			bdcp.claimed_record_count,
			'claimedRecordCountByState',
			json (bdcp.state_record_count),
			'technologyCodes',
			json (bdcp.technology_codes)
		)
	) as provider_json
FROM
	grouped_provider AS grouped
	INNER JOIN bdc.bdc_provider bdcp ON grouped.provider_id = bdcp.provider_id
WHERE
	bdcp.provider_id IS NOT NULL;


CREATE VIRTUAL TABLE parsed_provider_fts USING fts5 (
	holding_company,
	provider_name,
	provider_id,
	frn,
	dba_name,
	tokenize = 'trigram'
);

INSERT INTO parsed_provider_fts (
	holding_company,
	provider_name,
	provider_id,
	frn,
	dba_name
)
SELECT
	holding_company,
	provider_name,
	provider_id,
	frn,
	dba_name
FROM
	parsed_provider;

-- Now we can search for providers using the FTS table
SELECT DISTINCT provider_id FROM parsed_provider_fts WHERE parsed_provider_fts MATCH 'verizon' ORDER BY rank;

-- And with a sub-select, we can get the full provider information
-- SELECT * FROM combined_provider WHERE provider_id IN (SELECT DISTINCT provider_id FROM parsed_provider_fts WHERE parsed_provider_fts MATCH 'verizon');


CREATE VIRTUAL TABLE usac_fts USING fts5 (
	spin,
	provider_name,
	tokenize = 'trigram'
);

INSERT INTO usac_fts (
	spin,
	provider_name
)
SELECT
	"SPIN",
	"Service Provider Name"
FROM
	usac_raw;

-- Like before, we can search for providers using the FTS table
SELECT DISTINCT spin, provider_name FROM usac_fts WHERE usac_fts MATCH 'verizon';

-- Nearly done. Here's how we match the USAC data with the provider data
SELECT * FROM combined_provider WHERE provider_id IN (
	SELECT DISTINCT provider_id FROM usac_fts WHERE usac_fts MATCH 'verizon'
);

-- Finally, we combine the USAC data with the provider data in a single view
CREATE VIEW provider_usac AS
SELECT
	p.provider_id,
	p.holding_company,
	p.claimed_record_count,
	p.state_record_count,
	p.technology_codes,
	p.ilec_tag,
	p.clec_tag,
	p.association_tag,
	p.telephone_tag,
	p.rural_tag,
	p.coop_tag,
	p.municipal_tag,
	p.state_tag,
	p.provider_json,
	u."SPIN"
FROM
	combined_provider AS p
	INNER JOIN


-- SELECT json_patch ("{}", json_object(
-- 	'providerName', "Service Provider Name",
-- 	'dbaBySPIN', iif("Doing Business As" AND "Doing Business As" IS NOT "Service Provider Name", json_group_object("SPIN", "Doing Business As"), NULL),
-- 	'doingBusinessAs', iif("Doing Business As", json_group_array("Doing Business As"), NULL),
-- 	'spinIDs', json_group_array("SPIN")
-- )) as usac_json, * from spin GROUP BY upper("Service Provider Name") ORDER BY upper("Service Provider Name") DESC;

SELECT "Service Provider Name", from spin GROUP BY upper("Service Provider Name") ORDER BY upper("Service Provider Name") DESC;
