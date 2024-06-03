/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import classNames from "classnames"
import { memo, useEffect, useState } from "react"
import "./style.css"

export interface SplashScreenProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode
	graceTime?: number
}

export const SplashScreen = memo<SplashScreenProps>(({ children = "Loading...", graceTime = 2_000 }) => {
	const [visible, setVisible] = useState(false)

	const content = typeof children === "string" ? <div className="loading-pulsar">{children}</div> : children

	useEffect(() => {
		const timer = setTimeout(() => setVisible(true), graceTime)
		return () => clearTimeout(timer)
	}, [graceTime])

	return (
		<div className={classNames("splash-screen", { visible })}>
			<div className="content">{content}</div>
		</div>
	)
})

SplashScreen.displayName = "SplashScreen"
