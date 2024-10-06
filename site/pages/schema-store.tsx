/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import Layout from "@theme/Layout"
import { useEffect, useState } from "react"

type SchemaManifest = {
	[SchemaName: string]: string
}

const SCHEMA_STORE_URL = "https://schema.isp.nexus"

export default function SchemaStore() {
	const [schemaManifest, setSchemaManifest] = useState<SchemaManifest>()
	const [error, setError] = useState<Error>()

	useEffect(() => {
		fetch(new URL("/index.json", SCHEMA_STORE_URL))
			.then((response) => {
				if (!response.ok) {
					throw new Error("Failed to fetch schema manifest")
				}
				return response.json()
			})
			.then(setSchemaManifest)
			.catch(setError)
	}, [])

	return (
		<Layout title="Schema Store">
			<div className="container container--fluid margin-vert--lg">
				<div className="row mdxPageWrapper_---node_modules-@docusaurus-theme-classic-lib-theme-MDXPage-styles-module">
					<div className="col col--8">
						<article>
							<h1>Schema Store</h1>

							<p>
								ISP Nexus provides a schema store for common data formats used by federal government APIs. You can use
								these schemas to validate your data against the expected format, or to generate code for working with
								the data.
							</p>

							<p>
								However, the schema store is still under development and may drift from their respective authoritative
								sources. For more information, please reach out the OpenISP team.
							</p>

							<hr />

							{error ? (
								<p>{error.message}</p>
							) : schemaManifest ? (
								<ul>
									{Object.entries(schemaManifest).map(([schemaName, schemaPath]) => (
										<li key={schemaName}>
											<span>{schemaName}</span>

											<ul>
												<li>
													<a href={new URL(`${schemaPath}.json`, SCHEMA_STORE_URL).toString()}>JSON</a>
												</li>
												<li>
													<a href={new URL(`${schemaPath}.yaml`, SCHEMA_STORE_URL).toString()}>YAML</a>
												</li>
											</ul>
										</li>
									))}
								</ul>
							) : (
								<p>Fetching schema...</p>
							)}
						</article>
					</div>
				</div>
			</div>
		</Layout>
	)
}
