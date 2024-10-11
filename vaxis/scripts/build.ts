/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill"
import { cleanDirectory } from "@isp.nexus/sdk"
import { packagePathBuilder } from "@isp.nexus/sdk/runtime/repo-paths"
import esbuild from "esbuild"
import FastGlob from "fast-glob"
import path from "node:path"

const packagePath = packagePathBuilder("vaxis")
const distPath = packagePath("dist")

const production = process.argv.includes("--production")
const watch = process.argv.includes("--watch")

/**
 * This plugin hooks into the build process to print errors in a format that the problem matcher in
 * Visual Studio Code can understand.
 */
const esbuildProblemMatcherPlugin: esbuild.Plugin = {
	name: "esbuild-problem-matcher",

	setup(build) {
		build.onStart(() => {
			console.log("[watch] build started")
		})
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`)
				if (location) {
					console.error(`    ${location.file}:${location.line}:${location.column}:`)
				}
			})
			console.log("[watch] build finished")
		})
	},
}

/**
 * For web extension, all tests, including the test runner, need to be bundled into a single module
 * that has a exported `run` function . This plugin bundles implements a virtual file
 * extensionTests.ts that bundles all these together.
 */
const testBundlePlugin: esbuild.Plugin = {
	name: "testBundlePlugin",
	setup(build) {
		build.onResolve({ filter: /[/\\]extensionTests\.ts$/ }, (args) => {
			if (args.kind === "entry-point") {
				return { path: path.resolve(args.path) }
			}
		})

		build.onLoad({ filter: /[/\\]extensionTests\.ts$/ }, async (_args) => {
			const testsRoot = packagePath("test", "suite").toString()
			const files = await FastGlob("*.test.{ts,tsx}", { cwd: testsRoot })

			return {
				contents: `export { run } from './mochaTestRunner.ts';` + files.map((f) => `import('./${f}');`).join(""),
				watchDirs: files.map((f) => path.dirname(path.resolve(testsRoot, f))),
				watchFiles: files.map((f) => path.resolve(testsRoot, f)),
			}
		})
	},
}

async function main() {
	await cleanDirectory(distPath)

	const ctx = await esbuild.context({
		entryPoints: [
			// ---
			{ in: packagePath("ext", "main.host.ts").toString(), out: "ext/main.host" },
			{ in: packagePath("web", "main.webview.tsx").toString(), out: "public/main.webview" },
			{ in: packagePath("test", "suite", "extensionTests.ts").toString(), out: "extensionTests" },
		],
		outExtension: {
			".js": ".cjs",
		},
		bundle: true,
		format: "cjs",
		minify: production,
		sourcemap: !production,
		sourcesContent: !production,
		platform: "browser",
		outdir: distPath.toString(),
		external: ["vscode"],
		logLevel: "silent",
		target: "esnext",

		banner: {
			js: [
				"/**",
				" * @copyright OpenISP, Inc",
				" * @license AGPL-3.0",
				" * @author Teffen Ellis, et al.",
				` * @createdAt ${new Date().toISOString()}`,
				" */",
				"",
				"/* eslint-disable */",
				"// @ts-nocheck",
				"",
			].join("\n"),
		},
		define: {
			global: "globalThis",
		},

		plugins: [
			NodeGlobalsPolyfillPlugin({
				process: true,
				buffer: true,
			}),
			testBundlePlugin,
			esbuildProblemMatcherPlugin /* add to the end of plugins array */,
		],
	} satisfies esbuild.BuildOptions)

	if (watch) {
		await ctx.watch()
	} else {
		await ctx.rebuild()
		await ctx.dispose()
	}
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
