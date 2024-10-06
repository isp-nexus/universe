/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import type { SidebarsConfig } from "@docusaurus/plugin-content-docs"
import typedocSidebar from "./docs/typedoc-sidebar.cjs"

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
			items: typedocSidebar,
		},
	],
} satisfies SidebarsConfig

export default sidebars
