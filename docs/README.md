# ISP Nexus Univeral Mono-Repo

![GitHub License](https://img.shields.io/github/license/isp-nexus/universe)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/isp-nexus/universe)

Welcome to the mono-repo for ISP Nexus. This repository contains all the packages that make up the Nexus platform.

A few features of the Nexus platform include:

- USPS-compatible address parsing and validation for FCC filings
- US Census data integration
- Broadband Label Parsing
- Cartographic tools for firmographic analysis
- Self-hosted map tile generation for custom maps

⚠️ **This repository is under active development and will be updated frequently.** ⚠️

## How can I use Nexus for broadband research?

To get started, you'll need a development environment and an understanding of TypeScript, Node, and SQL.

At the moment we recommend using macOS, or if you really know what you're doing, a \*nix environment.

## Pre-requisites

- A minimum 25 GB of free disk space, 100 GB for comfort when working with large datasets.
  - Brew (for macOS)
  - Xcode Command Line Tools
- Git
- SQLite >= 3.46.0
- DB Browser for SQLite >= **3.13.1**
- Spatialite >= 3.46.0
- Node (>= 22.5.1), preferrably [via NVM](https://github.com/nvm-sh/nvm)
- Yarn >= 4.5.0 (Enabled via `corepack enable`)
- VSCode
- QGIS

## Getting Started

Start by optionally [forking Nexus](https://github.com/isp-nexus/universe/fork) and cloning your repo:

```shell
git clone git@github.com:isp-nexus/universe.git
cd universe
```

Next, install the dependencies:

```shell
# If you're on macOS, you'll need to give Yarn a hint about where to find SQLite:
export npm_config_build_from_source=true
export npm_config_sqlite=`brew --prefix sqlite3`

yarn install
```

In a separate terminal, we'll compile the TypeScript and JSON schemas:

```shell
yarn schema:generate
```

Keep the terminal open and have the TypeScript compiler running in watch mode:

```shell
yarn compile --watch
```

You can now confirm that your environment is set up by running the Nexus REPL in a separate terminal:

```shell
yarn repl
```

If you see the Node.js prompt with the `nexus` object, you're ready to start using the Nexus platform.

For more information on how to use Nexus modules, please refer to the [documentation](https://open.isp.nexus/api/).

## License

ISP Nexus is primarily licensed under the AGPL-3.0 license. Generally,
this means that you can use the software for free, but you must share
any modifications you make to the software.

For more information on commercial usage licensing, please contact us at
`hello@isp.nexus`

Please refer to the `LICENSE` file in each package for more information.
