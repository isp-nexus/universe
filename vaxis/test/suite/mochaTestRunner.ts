/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import "mocha/mocha"

mocha.setup({
	ui: "tdd",
	reporter: undefined,
})

export function run(): Promise<void> {
	return new Promise((c, e) => {
		try {
			// Run the mocha test
			mocha.run((failures) => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`))
				} else {
					c()
				}
			})
		} catch (err) {
			console.error(err)
			e(err)
		}
	})
}
