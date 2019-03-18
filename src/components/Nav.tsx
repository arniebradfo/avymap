import * as React from 'react';
import './Nav.css';

// ASSETS
import logo from '../assets/AvyMap-Logo.svg';
import legend from '../assets/AvyMap-Map-Slope-Legend.svg';
import angleGraph from '../assets/AvyMap-Percentage-of-Avalanches-by-Slope-Angle.svg';
import bradfordDigitalLogo from '../assets/bradford-digital-ogo-32x60.svg';
import menuIcon from '../assets/icons/icon_Menu.svg';
import xIcon from '../assets/icons/icon_X.svg';


class Nav extends React.Component {

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
			<header className="nav">
				<button
					className="nav__button"
					onClick={this.openMenu.bind(this)}
					>
					<img alt="Menu" src={menuIcon} className="icon"/>
				</button>
				<nav className={'nav__menu ' + (this.state.isOpen ? 'open' : 'closed') }>

					<button
						className="nav-button"
						onClick={this.closeMenu.bind(this)}
						>
						<img alt="Close" src={xIcon} className="icon"/>
					</button>

					<h1><img
						className="logo"
						alt="AvyMap"
						src={logo}
						height="31"
						width="64"
					/></h1>

					<section className="avy-info">

						<h2>Map Slope Legend</h2>
						<img alt="Slope angle color representation legend" src={legend}/>

						<hr/>

						<h2>Percentage of Avalanches by Slope Angle</h2>
						<img alt="Graph of avalanche percentage by slope angle" src={angleGraph}/>
						<p>
							76% of human triggered avalanches occur on slopes that are 34°–45°,
							and 96% occur between slopes that are 30°–50°.
							Peak activity (8%) occurs at slopes of 39°.
						</p>

					</section>


					<p>
						<img alt="bradford.digital logo" src={bradfordDigitalLogo} height="30" width="16"/>
						AvyMaps v X.X.X - Alpha
						<br/>
						&copy; {new Date().getFullYear()}
						<a href="https://bradford.digital">bradford.digital</a>
					</p>

				</nav>
			</header>
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
