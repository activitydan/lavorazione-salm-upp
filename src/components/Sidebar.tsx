import { useEffect, useRef, useState } from 'react';
import {
  BarChart3, ClipboardCheck, ClipboardList, Download, LayoutDashboard, Map as MapIcon, MapPinPlus, Repeat, Search, Settings, ShieldCheck, UserRound, Wrench,
  type LucideIcon,
} from 'lucide-react';
import { esci, setUi, useStore } from '../data/store';
import { useUtente } from '../data/selectors';
import type { Ruolo } from '../data/types';
import { useTelefono } from '../lib/schermo';
import { href, useRotta } from '../router';
import { Logo } from './Logo';
import { CampanellaAlert } from './Topbar';

export interface VoceMenu {
  path: string;
  label: string;
  icon: LucideIcon;
  /** chi vede la voce; assente = Operatore e Amministratore */
  ruoli?: Ruolo[];
  conteggio?: 'manutenzioni';
  gruppo?: string;
  /** la pagina si usa solo dal computer */
  soloComputer?: boolean;
}

// Sul computer la Mappa non è nel menu: si apre da "Apri la mappa" sulla Dashboard.
export const VOCI_COMPUTER: VoceMenu[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ricerca', label: 'Ricerca', icon: Search },
  { path: '/censimento', label: 'Censimento', icon: ClipboardList },
  { path: '/manutenzioni', label: 'Manutenzioni', icon: Wrench, conteggio: 'manutenzioni' },
  { path: '/anagrafe', label: 'Anagrafe', icon: UserRound, soloComputer: true },
  { path: '/report', label: 'Report', icon: BarChart3, soloComputer: true },
  { path: '/esportazioni', label: 'Esportazioni', icon: Download, soloComputer: true },
  { path: '/amministrazione', label: 'Amministrazione', icon: ShieldCheck, ruoli: ['amministratore'], gruppo: 'Configurazione', soloComputer: true },
  { path: '/impostazioni', label: 'Impostazioni', icon: Settings, ruoli: ['amministratore'], gruppo: 'Configurazione', soloComputer: true },
];

// Sul telefono solo campo e consultazione, uguale per Operatore e Amministratore.
export const VOCI_TELEFONO: VoceMenu[] = [
  { path: '/mappa', label: 'Mappa', icon: MapIcon },
  { path: '/ricerca', label: 'Ricerca', icon: Search },
  { path: '/rilievo', label: 'Nuovo rilievo', icon: MapPinPlus },
  { path: '/manutenzioni', label: 'Manutenzioni', icon: Wrench, conteggio: 'manutenzioni' },
  { path: '/censimento?tab=verifiche', label: 'Verifiche', icon: ClipboardCheck },
];

function vocePer(path: string): VoceMenu | undefined {
  return VOCI_COMPUTER.find((x) => x.path !== '/' && path.startsWith(x.path));
}

/** true se il ruolo può aprire la pagina (le voci senza "ruoli" sono di tutti). */
export function paginaPermessa(path: string, ruolo: Ruolo): boolean {
  const v = vocePer(path);
  return !v?.ruoli || v.ruoli.includes(ruolo);
}

/** true se la pagina si usa solo dal computer (gestione e statistiche). */
export function paginaSoloComputer(path: string): boolean {
  return !!vocePer(path)?.soloComputer;
}

function RiquadroUtente({ chiudiMenu }: { chiudiMenu: () => void }) {
  const utente = useUtente();
  const [aperto, setAperto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAperto(false);
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, []);
  return (
    <div ref={ref} className="utente">
      <button className="user-chip" onClick={() => setAperto(!aperto)} title={`${utente.nome} · ${utente.etichettaRuolo}`} aria-haspopup="menu" aria-expanded={aperto}>
        <span className="avatar avatar--sm" style={{ background: utente.colore }}>{utente.sigla}</span>
        <span className="user-chip__txt">
          <b>{utente.nome}</b>
          <span>{utente.etichettaRuolo}</span>
        </span>
      </button>
      {aperto && (
        <div className="popover utente__pop" role="menu">
          <div className="utente__chi">
            <b>{utente.nome}</b>
            <span className="small muted">{utente.etichettaRuolo}</span>
          </div>
          <button className="popover__item" role="menuitem" onClick={() => { setAperto(false); chiudiMenu(); esci(); }}>
            <Repeat size={16} />
            <span className="grow">Cambia ruolo</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const rotta = useRotta();
  const telefono = useTelefono();
  const utente = useUtente();
  const aperta = useStore((s) => s.ui.menuMobile);
  const manutenzioni = useStore((s) => s.db.manutenzioni);
  // accanto a Manutenzioni: le mie, cioè quelle programmate e assegnate a me
  const aperte = utente.operatoreId ? manutenzioni.filter((m) => m.stato === 'programmata' && m.operatoriIds?.includes(utente.operatoreId!)).length : 0;
  const chiudi = () => setUi({ menuMobile: false });

  const voci = (telefono ? VOCI_TELEFONO : VOCI_COMPUTER).filter((v) => !v.ruoli || v.ruoli.includes(utente.ruolo));
  const attivo = (v: VoceMenu) => {
    const p = v.path.split('?')[0];
    // la Mappa si apre dalla Dashboard: mentre si è lì resta accesa la voce Dashboard
    return p === '/' ? rotta.path === '/' || (!telefono && rotta.path === '/mappa') : rotta.path.startsWith(p);
  };
  let gruppo: string | undefined;

  return (
    <>
      <div className={`sidebar-backdrop ${aperta ? 'is-open' : ''}`} onClick={chiudi} />
      <aside className={`sidebar ${aperta ? 'is-open' : ''}`} aria-label="Menu principale">
        <a className="sidebar__brand" href={href(telefono ? '/mappa' : '/')} onClick={chiudi}>
          <Logo dark size={36} />
        </a>
        <nav className="sidebar__nav">
          {voci.map((v) => {
            const conteggio = v.conteggio === 'manutenzioni' ? aperte : 0;
            const titolo = v.gruppo && v.gruppo !== gruppo ? v.gruppo : null;
            gruppo = v.gruppo;
            return (
              <div key={v.path} style={{ display: 'contents' }}>
                {titolo && <div className="nav-sep">{titolo}</div>}
                <a
                  href={href(v.path)}
                  className={`nav-item ${attivo(v) ? 'is-active' : ''}`}
                  onClick={chiudi}
                  title={conteggio ? `${v.label}: ${conteggio} assegnate a te` : v.label}
                  aria-label={conteggio ? `${v.label}, ${conteggio} assegnate a te` : undefined}
                >
                  {/* numero sull'icona, come sulla campanella degli alert */}
                  <i className="nav-item__ico">
                    <v.icon size={21} />
                    {conteggio > 0 && <b className="icon-btn__dot" aria-hidden="true">{conteggio}</b>}
                  </i>
                  <span>{v.label}</span>
                </a>
              </div>
            );
          })}
        </nav>
        <div className="sidebar__foot">
          <RiquadroUtente chiudiMenu={chiudi} />
          <CampanellaAlert nelMenu />
        </div>
      </aside>
    </>
  );
}
