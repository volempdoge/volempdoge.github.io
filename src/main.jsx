import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// The build prerenders the page into #root and fills #cv-data (scripts/prerender.mjs);
// the dev server serves the template with its placeholders.
const root = document.getElementById('root');
const raw = document.getElementById('cv-data').textContent.trim();
const data = raw.startsWith('{') ? JSON.parse(raw) : { now: new Date().toISOString(), commit: null };

if (root.firstElementChild) hydrateRoot(root, <App {...data} />);
else createRoot(root).render(<App {...data} />);
