import { useSyncExternalStore } from 'react';

// Router minimo basato sull'hash: funziona su qualsiasi hosting statico
// e dà un indirizzo a ogni pagina, compresa quella pubblica del Cittadino (#/cittadino).

export interface Rotta {
  path: string;
  parti: string[];
  query: URLSearchParams;
}

function leggi(): Rotta {
  const h = window.location.hash.replace(/^#/, '') || '/';
  const [p, q] = h.split('?');
  const parti = p.split('/').filter(Boolean).map(decodeURIComponent);
  return { path: `/${parti.join('/')}`, parti, query: new URLSearchParams(q ?? '') };
}

let corrente = leggi();
const ascoltatori = new Set<() => void>();
window.addEventListener('hashchange', () => {
  corrente = leggi();
  ascoltatori.forEach((f) => f());
});

export function useRotta(): Rotta {
  return useSyncExternalStore(
    (cb) => {
      ascoltatori.add(cb);
      return () => ascoltatori.delete(cb);
    },
    () => corrente,
  );
}

export function vai(to: string) {
  const h = `#${to}`;
  if (window.location.hash !== h) window.location.hash = h;
}

export function href(to: string): string {
  return `#${to}`;
}

/** Aggiorna un parametro della query senza aggiungere voci inutili alla cronologia. */
export function setQuery(chiave: string, valore: string | null) {
  const r = leggi();
  if (valore === null) r.query.delete(chiave);
  else r.query.set(chiave, valore);
  const q = r.query.toString();
  window.history.replaceState(null, '', `#${r.path}${q ? `?${q}` : ''}`);
  corrente = leggi();
  ascoltatori.forEach((f) => f());
}
