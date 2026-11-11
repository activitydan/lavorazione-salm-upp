// PROTOTIPO, da buttare. Ticket "Regole degli spazi su una pagina campione" della mappa CimiTera.
// Tre varianti di spaziatura sulla pagina campione Censimento › Avanzamento (e su tutte le altre tranne la home),
// switchable con ?spazi=A|B|C|oggi prima del "#" (esempio http://localhost:5190/?spazi=B#/censimento),
// con le frecce ← → o con la barra nera in basso.
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRotta } from '../../router';
import './prototipo-spazi.css';

export const PROTOTIPO_ATTIVO = import.meta.env.DEV;

type Variante = { chiave: string; nome: string; regole: string };
const VARIANTI: Variante[] = [
  { chiave: 'A', nome: 'Come la home', regole: 'pagina 20 / 38 / 24 · riquadri 16 · interni 16 · righe 10 · titolo e schede su due righe' },
  { chiave: 'B', nome: 'Compatta', regole: 'pagina 16 / 24 / 16 · riquadri 12 · interni 12 · righe 6 · titolo e schede su una riga' },
  { chiave: 'C', nome: 'Ariosa', regole: 'pagina 24 / 40 / 40 · riquadri 24 · interni 20 · righe 14 · titolo e schede su due righe' },
  { chiave: 'oggi', nome: 'Oggi', regole: 'pagina 24 / 28 / 48 larga al massimo 1640 · riquadri 14–18 · interni 18 · righe 10 · frase sotto il titolo' },
];

// --- stato nell'indirizzo ------------------------------------------------------------------------
const ascoltatori = new Set<() => void>();
const leggi = () => window.location.search;
function setVariante(chiave: string) {
  const p = new URLSearchParams(window.location.search);
  p.set('spazi', chiave);
  window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}${window.location.hash}`);
  ascoltatori.forEach((f) => f());
}
function useVariante() {
  const s = useSyncExternalStore((cb) => { ascoltatori.add(cb); return () => ascoltatori.delete(cb); }, leggi);
  const chiave = new URLSearchParams(s).get('spazi') ?? 'A';
  return VARIANTI.find((v) => v.chiave === chiave) ?? VARIANTI[0];
}

// --- misure della pagina, per vedere cosa cambia ---------------------------------------------------
type Misure = { primo: number; schermate: number };
function misura(): Misure | null {
  const content = document.querySelector<HTMLElement>('.content');
  const page = content?.querySelector<HTMLElement>('.page');
  if (!content || !page || page.classList.contains('page--home')) return null;
  const primo = page.querySelector<HTMLElement>('.card');
  const sopra = content.getBoundingClientRect().top;
  return {
    primo: primo ? Math.round(primo.getBoundingClientRect().top - sopra + content.scrollTop) : 0,
    schermate: Math.round((content.scrollHeight / content.clientHeight) * 10) / 10,
  };
}

export function BarraSpazi() {
  const variante = useVariante();
  const rotta = useRotta();
  const [misure, setMisure] = useState<Misure | null>(null);
  const i = VARIANTI.indexOf(variante);
  const cambia = (d: number) => setVariante(VARIANTI[(i + d + VARIANTI.length) % VARIANTI.length].chiave);

  useLayoutEffect(() => {
    if (!PROTOTIPO_ATTIVO || variante.chiave === 'oggi') delete document.documentElement.dataset.spazi;
    else document.documentElement.dataset.spazi = variante.chiave;
  }, [variante]);

  useEffect(() => {
    const aggiorna = () => setMisure(misura());
    const t = [100, 400, 1200].map((ms) => window.setTimeout(aggiorna, ms));
    window.addEventListener('resize', aggiorna);
    return () => { t.forEach(clearTimeout); window.removeEventListener('resize', aggiorna); };
  }, [variante, rotta.path, rotta.query.toString()]);

  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest('input, textarea, select, [contenteditable], .leaflet-container')) return;
      if (e.key === 'ArrowLeft') cambia(-1);
      if (e.key === 'ArrowRight') cambia(1);
    };
    window.addEventListener('keydown', tasto);
    return () => window.removeEventListener('keydown', tasto);
  });

  if (!PROTOTIPO_ATTIVO) return null;
  const stile: React.CSSProperties = {
    position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, maxWidth: 'calc(100vw - 24px)',
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 8px', borderRadius: 18,
    background: '#111', color: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,.35)', font: '600 13px system-ui, sans-serif',
  };
  const tasto: React.CSSProperties = { background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 4 };
  return (
    <div style={stile} role="toolbar" aria-label="Prototipo degli spazi">
      <button style={tasto} onClick={() => cambia(-1)} aria-label="Variante precedente"><ChevronLeft size={18} /></button>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, textAlign: 'center' }}>
        <span>{variante.chiave === 'oggi' ? 'Oggi' : `${variante.chiave} · ${variante.nome}`}</span>
        <span style={{ fontWeight: 400, fontSize: 11.5, color: '#bbb' }}>{variante.regole}</span>
        {misure && (
          <span style={{ fontWeight: 400, fontSize: 11.5, color: '#8fd18f' }}>
            primo riquadro a {misure.primo} px dalla barra in alto · pagina lunga {String(misure.schermate).replace('.', ',')} schermate
          </span>
        )}
      </span>
      <button style={tasto} onClick={() => cambia(1)} aria-label="Variante successiva"><ChevronRight size={18} /></button>
    </div>
  );
}
