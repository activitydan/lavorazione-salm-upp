import { useSyncExternalStore } from 'react';

// Sotto i 760 px l'app è la versione per telefono: solo campo e consultazione.
const TELEFONO = '(max-width: 760px)';

export function seTelefono(): boolean {
  return window.matchMedia(TELEFONO).matches;
}

export function useTelefono(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(TELEFONO);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    seTelefono,
  );
}
