/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import type * as Preset from "@docusaurus/preset-classic"
import type { Config } from "@docusaurus/types"
import { packagePathBuilder } from "@isp.nexus/sdk/reflection"
import type { PluginOptions as DocusaurusTypeDocPluginOptions } from "docusaurus-plugin-typedoc"
import { themes as prismThemes } from "prism-react-renderer"
import { EntryPointStrategy, TypeDocOptionMap } from "typedoc"

const config: Config = {
	title: "ISP Nexus",
	tagline: "Spatial firmographic software for telecom companies to managing risk and secure funding.",
	favicon: "img/favicon.ico",
	headTags: [
		{
			tagName: "meta",
			attributes: {
				"theme-color": "#00093b",
			},
		},
		{
			tagName: "link",
			attributes: {
				rel: "preconnect",
				href: "https://public.isp.nexus",
			},
		},
	],

	// Set the production url of your site here
	url: "https://open.isp.nexus",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "isp-nexus", // Usually your GitHub org/user name.
	projectName: "universe", // Usually your repo name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					path: "api",
					routeBasePath: "/api",
					sidebarPath: "./sidebars.ts",
					editUrl: "https://github.com/isp-nexus/universe/tree/main/packages/create-docusaurus/templates/shared/",
				},

				blog: false,
				theme: {
					customCss: [
						// ---
						"./src/css/fonts/IosevkaNexus.css",
						"./src/css/fonts/IosevkaNexusMono.css",
						"./src/css/theme-light.css",
						// "./src/css/theme-dark.css",
						"./src/css/markdown.css",
						"./src/css/custom.css",
						"./src/css/teaser.css",
					],
				},
				pages: {
					path: "pages",
				},
			} satisfies Preset.Options,
		],
	],
	plugins: [
		[
			"docusaurus-plugin-typedoc",

			// Options
			{
				cleanOutputDir: true,
				out: "api",
				entryPointStrategy: EntryPointStrategy.Packages as any,
				includeVersion: false,
				entryPoints: [
					//--
					packagePathBuilder("core"),
					packagePathBuilder("spatial"),
					packagePathBuilder("tiger"),
					packagePathBuilder("fcc"),
					packagePathBuilder("mailwoman"),
					packagePathBuilder("cartographer"),
					packagePathBuilder("sdk"),
				].map((builder) => builder.toString()),
				mergeReadme: true,
				indexFormat: "table",
				disableSources: true,
				groupOrder: ["Classes", "Interfaces", "Enums"],
				sidebar: {
					autoConfiguration: true,
					pretty: true,
				},

				textContentMappings: {
					"header.title": "{projectName} {version}",
					"header.docs": "Docs",
					"breadcrumbs.home": "{projectName} {version}",
					"title.indexPage": "API Reference",
					"title.memberPage": "{name}",
					"footer.text": "",
				},
				parametersFormat: "table",
				enumMembersFormat: "table",
				useCodeBlocks: true,

				excludeScopesInPaths: true,
			} satisfies Partial<DocusaurusTypeDocPluginOptions> & Partial<TypeDocOptionMap>,
		],
	],

	themeConfig: {
		colorMode: {
			defaultMode: "light",

			disableSwitch: true,
		},
		announcementBar: {
			content: "⚠️ This is a preview of the new ISP Nexus documentation. Please report any issues you find.",
			backgroundColor: "var(--ifm-color-primary-lightest)",
		},
		image: "img/docusaurus-social-card.png",
		navbar: {
			title: "ISP Nexus",
			logo: {
				alt: "Nexus logo",
				src: "img/icon-dark.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "apiSidebar",
					position: "left",
					label: "API",
				},
				{
					to: "license",
					label: "License",
					position: "left",
				},
				{
					to: "contributing",
					label: "Contributing",
					position: "left",
				},
				{
					to: "schema-store",
					label: "Schema Store",
					position: "left",
				},
				{
					href: "https://github.com/isp-nexus/universe",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Community",
					items: [
						{
							label: "Community Networks",
							href: "https://communitynets.org",
						},

						{
							label: "Broadband Commons",
							href: "https://bbcommons.org",
						},
					],
				},

				{
					title: "Resources",
					items: [
						{
							label: "FCC Broadband Map",
							href: "https://broadbandmap.fcc.gov",
						},

						{
							label: "FRN Lookup",
							// TODO: Update to our own FRN lookup tool
							href: "https://apps.fcc.gov/cores/advancedSearch.do?csfrToken=",
						},
					],
				},

				{
					title: "OpenISP",
					items: [
						{
							label: "LinkedIn",
							href: "https://www.linkedin.com/company/openisp-inc",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} OpenISP, Inc.`,
		},
		prism: {
			theme: prismThemes.okaidia,
			darkTheme: prismThemes.okaidia,
		},
	} satisfies Preset.ThemeConfig,
}

export default config
