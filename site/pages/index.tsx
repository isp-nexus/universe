/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import Layout from "@theme/Layout"

export default function TeaserHome() {
	return (
		<Layout title="Home">
			<div id="teaser">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					style={{ width: "80dvmin", mixBlendMode: "plus-lighter", color: "hsla(210.78, 100 %, 70.25 %, 0.64)" }}
				>
					<path
						fill="hsl(225.78, 100%, 10.25%)"
						d="M2.282 7.43V1.725h.572l4.004 3.993V1.725h.572V7.43zM8.57 7.43l2.384-2.853L8.57 1.725h5.148l-2.383 2.852 2.383 2.853z"
					/>
					<path
						fill="hsl(225.78, 100%, 10.25%)"
						stroke="hsl(225.78, 100%, 10.25%)"
						d="M6.93 9.07v2.622c-.04.606-.277 1.127-.648 1.497-.371.37-.874.586-1.426.586a2.07 2.07 0 0 1-2.074-2.067V9.07H6.93ZM12.055 8.96c.368 0 .691.19.927.48.178.22.309.494.377.8h-1.82v1.628c-.031.54-.2 1.002-.468 1.33-.236.287-.551.465-.905.465-.37 0-.698-.193-.939-.485a1.925 1.925 0 0 1-.38-.796h1.819v-1.627c.032-.538.203-1 .474-1.326.24-.29.559-.47.92-.47Z"
					/>
				</svg>
			</div>
		</Layout>
	)
}
