/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Talisman metrics Monge-Elkan module.
 */
declare module "talisman/metrics/monge-elkan.js" {
	import { SimilarityFn } from "talisman/metrics/identity.js"

	/**
	 * Function computing the Monge-Elkan similarity.
	 *
	 * @param {function} similarity - Similarity function to use.
	 * @param {array | string} source - Source sequence.
	 * @param {array | string} target - Target sequence.
	 *
	 * @returns {number} - Monge-Elkan similarity.
	 */
	function mongeElkan(similarity: SimilarityFn, source: string | string[], target: string | string[]): number

	export default mongeElkan
}
