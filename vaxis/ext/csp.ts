/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Generates a pseudo-random 16-byte, 32-character string, suitable for CSP nonces.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues Mozilla documentation.}
 */
export function generateNonce(): string {
	const array = new Uint8Array(16)

	crypto.getRandomValues(array)

	return Array.from(array, (byte) =>
		byte
			// Convert byte to a hexadecimal.
			.toString(16)
			// Represent each byte with two digits.
			.padStart(2, "0")
	).join("")
}
