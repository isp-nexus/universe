/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Talisman metrics/identity module.
 */
declare module "talisman/metrics/identity.js" {
	export type SimilarityFn = (a: string | string[], b: string | string[]) => number

	/**
	 * Identity distance.
	 *
	 * @param {array | string} a - First sequence.
	 * @param {array | string} b - Second sequence.
	 * @param {number} - Distance between 0 & 1.
	 */
	export const distance: SimilarityFn

	/**
	 * Identity similarity.
	 *
	 * @param {array | string} a - First sequence.
	 * @param {array | string} b - Second sequence.
	 * @param {number} - Similarity between 0 & 1.
	 */
	export const similarity: SimilarityFn
}
