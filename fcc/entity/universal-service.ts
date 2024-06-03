/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Universal Service Fund (USF) utilities.
 */

import { Tagged } from "type-fest"

/**
 * A unique identifier for the Form 499 submission. Typically present for telecommunications
 * providers and other entities that pay into the Universal Service Fund.
 *
 * @type integer
 * @title FCC Registration Number
 */
export type Form499ID = Tagged<number, "Form499ID">
