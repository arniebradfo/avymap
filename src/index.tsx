import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Map from './components/map/Map';
import './styles/base.css';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <Map />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
