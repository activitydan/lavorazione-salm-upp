import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/nunito-sans';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import 'leaflet/dist/leaflet.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/map.css';
import './styles/pages.css';
import './styles/sections.css';
import './styles/spazi.css';
import { App } from './App';
import { avvia } from './data/store';

avvia();

// L'app si installa sul telefono e tiene i suoi file: così si apre anche senza rete.
// In sviluppo non si registra, per non servire file vecchi.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Service worker non registrato', e));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
