import * as React from 'react';
import './App.css';
import Nav from './Nav';
import AvyMap from './AvyMap';

const flowArrowsKey = 'avymap.flowArrows';

class App extends React.Component {

	state = {
		flowArrows: readSetting(flowArrowsKey)
	};

	constructor(props: any) {
		super(props)
		this.setFlowArrows = this.setFlowArrows.bind(this);
	}

	public render() {
		return (
			<div className="app">
				<Nav flowArrows={this.state.flowArrows} onFlowArrowsChange={this.setFlowArrows}></Nav>
				<AvyMap flowArrows={this.state.flowArrows}></AvyMap>
			</div>
		);
	}

	setFlowArrows(flowArrows: boolean) {
		this.setState({ flowArrows });
		try { localStorage.setItem(flowArrowsKey, String(flowArrows)); } catch { /* storage unavailable */ }
	}

}

function readSetting(key: string): boolean {
	try { return localStorage.getItem(key) === 'true'; } catch { return false; }
}

export default App;
