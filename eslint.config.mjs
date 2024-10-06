/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { createESLintPackageConfig } from "@sister.software/eslint-config"

// @ts-check

/**
 * ESLint configuration for the ISP Nexus monorepo.
 */
const SisterSoftwareUniverseESLintConfig = createESLintPackageConfig({
	copyrightHolder: "OpenISP, Inc.",
	packageTitle: "ISP Nexus",
	spdxLicenseIdentifier: "AGPL-3.0",
	overrides: {
		ignores: [
			// ---
			"**/dist/**",
			"**/*.json",
			"site/docs/api/**",
			"**/.docusaurus/**",
			"**/out/**",
			"**/node_modules/**",
		],
	},
})

export default SisterSoftwareUniverseESLintConfig
