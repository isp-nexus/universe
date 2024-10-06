/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import type { SidebarsConfig } from "@docusaurus/plugin-content-docs"
import typedocSidebar from "./api/typedoc-sidebar.cjs"

/**
 * Given a TypeDoc generated sidebar, recursively removes './' prefixes from all item identifiers.
 */
function fixSidebarItems(sidebarConfig: SidebarsConfig): SidebarsConfig {
	return JSON.parse(
		JSON.stringify(sidebarConfig, (key, value) => {
			if (key === "id" && typeof value === "string") {
				return value.replace(/^\.\//, "")
			}
			return value
		})
	)
}

const sidebars = {
	apiSidebar: [
		{
			type: "category",
			label: "Packages",
			link: {
				type: "doc",
				id: "index",
			},
			collapsed: false,
			collapsible: false,
			items: fixSidebarItems(typedocSidebar),
		},
	],
} satisfies SidebarsConfig

export default sidebars
