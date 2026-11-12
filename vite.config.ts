import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Scrive l'elenco dei file della build: il service worker li tiene sul telefono per il lavoro senza rete. */
function elencoPerIlTelefono(): Plugin {
  return {
    name: 'cimitera-precache',
    apply: 'build',
    generateBundle(_, bundle) {
      const file = Object.keys(bundle).filter((f) => !f.endsWith('.map')).map((f) => `./${f}`);
      this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(file) });
    },
  };
}

// base relativa: la build funziona da qualsiasi cartella o sottocartella del server
export default defineConfig({
  base: './',
  plugins: [react(), elencoPerIlTelefono()],
  server: { port: 5180, host: true },
  preview: { port: 5181, host: true },
  build: { chunkSizeWarningLimit: 1600 },
});
