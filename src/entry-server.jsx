import { renderToString } from 'react-dom/server';
import App from './App.jsx';

/** HTML of the page with its default settings; see scripts/prerender.mjs. */
export function render(data) {
  return renderToString(<App {...data} />);
}
