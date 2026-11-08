import * as React from 'react';
import './Nav.css';

// ASSETS
import logo from '../assets/AvyMap-Logo.svg';
import legend from '../assets/AvyMap-Map-Slope-Legend.svg';
import angleGraph from '../assets/AvyMap-Percentage-of-Avalanches-by-Slope-Angle.svg';
import bradfordDigitalLogo from '../assets/bradford-digital-ogo-32x60.svg';
import menuIcon from '../assets/icons/icon_Menu.svg';
import xIcon from '../assets/icons/icon_X.svg';

type NavProps = {
	flowArrows?: boolean,
	onFlowArrowsChange?: (flowArrows: boolean) => void
};

class Nav extends React.Component<NavProps> {

	state: {
		isOpen: boolean,
	} = {
		isOpen: false,
	}

	constructor(props: any) {
		super(props)
	}

	public render() {
		return (
			<article className="nav">
				<button
					className="nav__button button--round button--overlay"
					onClick={this.openMenu.bind(this)}
					>
					<img alt="Menu" src={menuIcon} className="icon"/>
				</button>
				<div className={'nav__menu ' + (this.state.isOpen ? 'open' : 'closed') }>

					<header className="menu__header menu__column">

						<button
							className="nav__close-button button--round button--transparent"
							onClick={this.closeMenu.bind(this)}
							>
							<img alt="Close" src={xIcon} className="icon"/>
						</button>

						<h1 className="logo" ><img
							className="logo__img"
							alt="AvyMap"
							src={logo}
							height="31"
							width="64"
						/></h1>

					</header>

					<section className="avy-info">

						<section className="menu__column">

							<h2 className="avy-info__title meta-text">Map Slope Legend</h2>
							<img alt="Slope angle color representation legend" src={legend}/>

							<label className="setting-toggle">
								<input
									type="checkbox"
									className="setting-toggle__input"
									checked={!!this.props.flowArrows}
									onChange={e => this.props.onFlowArrowsChange?.(e.target.checked)}
								/>
								<span className="setting-toggle__switch" aria-hidden="true"></span>
								<span className="setting-toggle__label">Animated flow arrows</span>
							</label>

						</section>
						<hr className="avy-info__horizontal-rule"/>
						<section className="menu__column">

							<h2 className="avy-info__title meta-text">Percentage of Avalanches <br/>by Slope Angle</h2>
							<img alt="Graph of avalanche percentage by slope angle" src={angleGraph}/>
							<p>
								76% of human triggered avalanches occur on slopes that are 34°–45°,
								and 96% occur between slopes that are 30°–50°.
								Peak activity (8%) occurs at slopes of 39°.
							</p>

						</section>

					</section>

					<footer className="menu__footer menu__column">

						<p>
							<img className="footer__logo" alt="bradford.digital logo" src={bradfordDigitalLogo} height="30" width="16"/>
							AvyMaps v 0.2.0 - Alpha
							<br/>
							&copy; {new Date().getFullYear()}&nbsp;
							<a href="https://bradford.digital">bradford.digital</a>
						</p>
					</footer>

				</div>
			</article>
		);
	}

	public openMenu() {
		this.setState({
			isOpen: true
		})
	}

	public closeMenu() {
		this.setState({
			isOpen: false
		})
	}

	public toggleMenu() {
		this.setState({
			isOpen: !this.state.isOpen,
		})
	}

}

export default Nav;
