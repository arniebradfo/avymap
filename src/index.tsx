import { createRoot } from 'react-dom/client';
import App from './components/App';

// CSS //
import 'sanitize.css';
import './styles/base.css';

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
