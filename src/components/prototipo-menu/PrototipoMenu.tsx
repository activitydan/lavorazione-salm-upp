// PROTOTIPO, da buttare. Ticket "Struttura del menu" della mappa CimiTera.
// La variante e il ruolo stanno nella parte dell'indirizzo prima di "#" (?menu=B&ruolo=operatore),
// così restano uguali mentre si naviga tra le pagine.
import { useState, useSyncExternalStore, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { setUi, useStore } from '../../data/store';
import { useDatiCimitero } from '../../data/selectors';
import { href, useRotta, vai } from '../../router';
import { Logo } from '../Logo';
import { CampanellaAlert } from '../Topbar';
import { Tabs } from '../ui';
import { VARIANTI, VOCI_TELEFONO, type Ruolo, type Voce } from './varianti';

export const PROTOTIPO_ATTIVO = import.meta.env.DEV;

// --- stato nell'indirizzo ------------------------------------------------------------------------
const ascoltatori = new Set<() => void>();
const leggiParametri = () => window.location.search;
function setParametro(chiave: string, valore: string) {
  const p = new URLSearchParams(window.location.search);
  p.set(chiave, valore);
  window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}${window.location.hash}`);
  ascoltatori.forEach((f) => f());
}
function useParametri() {
  const s = useSyncExternalStore((cb) => { ascoltatori.add(cb); return () => ascoltatori.delete(cb); }, leggiParametri);
  const p = new URLSearchParams(s);
  const chiave = p.get('menu') ?? 'A';
  const ruolo: Ruolo = p.get('ruolo') === 'operatore' ? 'operatore' : 'amministratore';
  return { chiave, ruolo, variante: VARIANTI.find((v) => v.chiave === chiave) ?? null };
}
const CHIAVI = [...VARIANTI.map((v) => v.chiave), 'oggi'];

function useTelefono() {
  const mq = '(max-width: 760px)';
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(mq); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => window.matchMedia(mq).matches,
  );
}

/** true quando il menu va disegnato dal prototipo invece che dal menu di oggi */
export function usePrototipoMenu() {
  const { variante } = useParametri();
  return PROTOTIPO_ATTIVO && variante !== null;
}

// --- menu laterale --------------------------------------------------------------------------------
export function SidebarPrototipo() {
  const rotta = useRotta();
  const { variante, ruolo } = useParametri();
  const telefono = useTelefono();
  const aperta = useStore((s) => s.ui.menuMobile);
  const operatori = useStore((s) => s.db.operatori);
  const { manutenzioni } = useDatiCimitero();
  const aperte = manutenzioni.filter((m) => m.stato === 'aperta').length;
  const chiudi = () => setUi({ menuMobile: false });
  if (!variante) return null;

  const percorso = (p: string) => p.split('?')[0];
  const attivo = (v: Voce) => {
    const p = percorso(v.path);
    const corrisponde = (x: string) => (x === '/' ? rotta.path === '/' : rotta.path.startsWith(x));
    return corrisponde(p) || (v.attivoAnche ?? []).some(corrisponde);
  };
  const gruppi = telefono
    ? [{ titolo: 'Sul campo', voci: VOCI_TELEFONO }]
    : variante.gruppi
        .map((g) => ({ ...g, voci: g.voci.filter((v) => ruolo === 'amministratore' || !v.soloAdmin) }))
        .filter((g) => g.voci.length > 0);
  const nome = ruolo === 'amministratore' ? 'Ufficio Cimiteri' : (operatori[0]?.nome ?? 'Operatore');

  return (
    <>
      <div className={`sidebar-backdrop ${aperta ? 'is-open' : ''}`} onClick={chiudi} />
      <aside className={`sidebar ${aperta ? 'is-open' : ''}`} aria-label="Menu principale">
        <a className="sidebar__brand" href={href(telefono ? '/mappa' : '/')} onClick={chiudi}>
          <Logo dark size={36} corto />
        </a>
        <nav className="sidebar__nav">
          {gruppi.map((g, i) => (
            <div key={g.titolo ?? i} style={{ display: 'contents' }}>
              {g.titolo && <div className="nav-sep">{g.titolo}</div>}
              {g.voci.map((v) => {
                const conteggio = v.conteggio === 'manutenzioni' ? aperte : 0;
                return (
                  <a key={v.path} href={href(v.path)} className={`nav-item ${attivo(v) ? 'is-active' : ''}`} onClick={chiudi} title={v.label}>
                    <i className="nav-item__ico">
                      <v.icon size={21} />
                      {conteggio > 0 && <b className="icon-btn__dot" aria-hidden="true">{conteggio}</b>}
                    </i>
                    <span>{v.label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar__foot">
          <button className="user-chip" onClick={() => setParametro('ruolo', ruolo === 'amministratore' ? 'operatore' : 'amministratore')} title="Cambia ruolo">
            <span className="avatar avatar--sm" style={{ background: ruolo === 'amministratore' ? '#0A2F55' : (operatori[0]?.colore ?? '#2F6FB3') }}>
              {nome.split(' ').map((x) => x[0]).slice(0, 2).join('')}
            </span>
            <span className="user-chip__txt">
              <b>{nome}</b>
              <span>{ruolo === 'amministratore' ? 'Amministratore' : 'Operatore'}</span>
            </span>
          </button>
          <CampanellaAlert nelMenu />
        </div>
      </aside>
    </>
  );
}

// --- pagine nuove (segnaposto) --------------------------------------------------------------------
export function PaginaPrototipo({ path, altrimenti }: { path: string; altrimenti: React.ReactNode }) {
  const { variante } = useParametri();
  const pagina = PROTOTIPO_ATTIVO ? variante?.pagine[path] : undefined;
  const [scheda, setScheda] = useState(0);
  useEffect(() => setScheda(0), [path]);
  if (!pagina) return <>{altrimenti}</>;
  const s = pagina.schede[Math.min(scheda, pagina.schede.length - 1)];
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title"><h1>{pagina.titolo}</h1></div>
      </div>
      {pagina.schede.length > 1 && (
        <Tabs value={String(scheda)} onChange={(v) => setScheda(Number(v))} tabs={pagina.schede.map((x, i) => ({ id: String(i), label: x.nome }))} />
      )}
      <div className="card card--pad" style={{ maxWidth: 720 }}>
        <p className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Pagina segnaposto del prototipo</p>
        <h2 style={{ margin: '8px 0' }}>{s.nome}</h2>
        <p>{s.contenuto}</p>
        <p className="muted mt-8">Arriva da oggi: <b>{s.daOggi ?? 'niente, è nuova'}</b></p>
        {s.link && (
          <button className="btn btn--sm mt-8" onClick={() => vai(s.link!)}>Apri la pagina di oggi <ArrowRight size={14} /></button>
        )}
      </div>
    </div>
  );
}

// --- nota sulle pagine che esistono già -----------------------------------------------------------
export function NotaPrototipo() {
  const rotta = useRotta();
  const { variante } = useParametri();
  const nota = PROTOTIPO_ATTIVO ? variante?.note[rotta.path] : undefined;
  if (!nota) return null;
  return (
    <div className="callout" style={{ margin: '12px 20px 0', borderStyle: 'dashed' }}>
      <FlaskConical size={16} /> {nota}
    </div>
  );
}

// --- barra in basso per cambiare variante e ruolo ------------------------------------------------
export function BarraPrototipo() {
  const { chiave, ruolo, variante } = useParametri();
  const i = Math.max(0, CHIAVI.indexOf(chiave));
  const cambia = (d: number) => setParametro('menu', CHIAVI[(i + d + CHIAVI.length) % CHIAVI.length]);

  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest('input, textarea, select, [contenteditable], .leaflet-container'))) return;
      if (e.key === 'ArrowLeft') cambia(-1);
      if (e.key === 'ArrowRight') cambia(1);
    };
    window.addEventListener('keydown', tasto);
    return () => window.removeEventListener('keydown', tasto);
  });

  if (!PROTOTIPO_ATTIVO) return null;
  const stile: React.CSSProperties = {
    position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 999,
    background: '#111', color: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,.35)', font: '600 13px system-ui, sans-serif',
  };
  const tasto: React.CSSProperties = { background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 4 };
  const pill = (on: boolean): React.CSSProperties => ({
    border: 0, borderRadius: 999, padding: '4px 10px', cursor: 'pointer', font: 'inherit',
    background: on ? '#fff' : 'transparent', color: on ? '#111' : '#bbb',
  });
  return (
    <div style={stile} role="toolbar" aria-label="Prototipo del menu">
      <button style={tasto} onClick={() => cambia(-1)} aria-label="Variante precedente"><ChevronLeft size={18} /></button>
      <span style={{ minWidth: 150, textAlign: 'center' }}>{variante ? `${variante.chiave} · ${variante.nome}` : 'Menu di oggi'}</span>
      <button style={tasto} onClick={() => cambia(1)} aria-label="Variante successiva"><ChevronRight size={18} /></button>
      <span style={{ width: 1, height: 18, background: '#444', margin: '0 4px' }} />
      <button style={pill(ruolo === 'amministratore')} onClick={() => setParametro('ruolo', 'amministratore')}>Amministratore</button>
      <button style={pill(ruolo === 'operatore')} onClick={() => setParametro('ruolo', 'operatore')}>Operatore</button>
    </div>
  );
}
