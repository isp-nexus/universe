/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

export type CSPDirective = [string, string[]]

export interface DocumentProps {
	children?: React.ReactNode
	links?: React.ReactNode
	baseHref: string
	csp: CSPDirective[]
	nonce: string
}

export const WebviewDocument: React.FC<DocumentProps> = ({ baseHref, csp, links, children }) => {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
				<meta name="theme-color" content="#FF0B80" />

				<meta
					httpEquiv="Content-Security-Policy"
					content={csp.map(([directive, values]) => `${directive} ${values.join(" ")}`).join("; ")}
				/>

				<base href={baseHref} />

				{links}

				<title>ISP Nexus</title>
			</head>
			<body>
				<div id="root"></div>

				{children}
				<noscript>You need to enable JavaScript to run this app.</noscript>
			</body>
		</html>
	)
}
