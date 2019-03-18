import * as React from 'react';
import './App.css';
import Nav from '../Nav/Nav';
import AvyMap from '../AvyMap/AvyMap';

class App extends React.Component {

	constructor(props: any) {
		super(props)
	}

	public render() {
		return (
			<div className="app">
				<Nav></Nav>
				<AvyMap></AvyMap>
			</div>
		);
	}

}

export default App;
