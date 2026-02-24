import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Easter Egg E — for the curious developer 🧙
console.log(
  '%c🧙 One does not simply inspect the source code…',
  'color: #d4a017; font-size: 18px; font-weight: bold;',
);
console.log(
  '%c…but I see you\'re curious. Well met, traveler.',
  'color: #a07840; font-size: 13px; font-style: italic;',
);
console.log(
  '%cBuilt with React  •  Hono  •  Cloudflare Workers',
  'color: #6b7280; font-size: 11px;',
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
