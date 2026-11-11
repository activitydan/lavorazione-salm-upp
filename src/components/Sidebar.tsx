import {
  BarChart3, ClipboardList, Download, LayoutDashboard, Search, Settings, UserRound, Wrench,
} from 'lucide-react';
import { setUi, useStore } from '../data/store';
import { useDatiCimitero } from '../data/selectors';
import { href, useRotta, vai } from '../router';
import { Logo } from './Logo';
import { CampanellaAlert } from './Topbar';
import { SidebarPrototipo, usePrototipoMenu } from './prototipo-menu/PrototipoMenu';

// La Mappa non è nel menu: si apre da "Apri la mappa" sulla Dashboard (e dalla ricerca o dalla legenda)
const VOCI = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/censimento', label: 'Censimento', icon: ClipboardList },
  { path: '/ricerca', label: 'Ricerca', icon: Search },
  { path: '/anagrafe', label: 'Anagrafe', icon: UserRound },
  { path: '/manutenzioni', label: 'Manutenzioni', icon: Wrench },
  { path: '/report', label: 'Report', icon: BarChart3 },
  { path: '/esportazioni', label: 'Esportazioni', icon: Download },
];

// PROTOTIPO "Struttura del menu": con ?menu=A|B|C il menu lo disegna il prototipo
export function Sidebar() {
  return usePrototipoMenu() ? <SidebarPrototipo /> : <SidebarOggi />;
}

function SidebarOggi() {
  const rotta = useRotta();
  const aperta = useStore((s) => s.ui.menuMobile);
  const { manutenzioni } = useDatiCimitero();
  const aperte = manutenzioni.filter((m) => m.stato === 'aperta').length;
  const attivo = (p: string) => (p === '/' ? rotta.path === '/' : rotta.path.startsWith(p));
  const chiudi = () => setUi({ menuMobile: false });

  return (
    <>
      <div className={`sidebar-backdrop ${aperta ? 'is-open' : ''}`} onClick={chiudi} />
      <aside className={`sidebar ${aperta ? 'is-open' : ''}`} aria-label="Menu principale">
        <a className="sidebar__brand" href={href('/')} onClick={chiudi}>
          <Logo dark size={36} corto />
        </a>
        <nav className="sidebar__nav">
          {VOCI.map((v) => {
            const conteggio = v.path === '/manutenzioni' ? aperte : 0;
            return (
              <a
                key={v.path}
                href={href(v.path)}
                className={`nav-item ${attivo(v.path) ? 'is-active' : ''}`}
                onClick={chiudi}
                title={conteggio ? `${v.label}: ${conteggio} aperte` : v.label}
                aria-label={conteggio ? `${v.label}, ${conteggio} aperte` : undefined}
              >
                {/* numero sull'icona, come sulla campanella degli alert */}
                <i className="nav-item__ico">
                  <v.icon size={21} />
                  {conteggio > 0 && <b className="icon-btn__dot" aria-hidden="true">{conteggio}</b>}
                </i>
                <span>{v.label}</span>
              </a>
            );
          })}
          <div className="nav-sep">Configurazione</div>
          <a href={href('/impostazioni')} className={`nav-item ${attivo('/impostazioni') ? 'is-active' : ''}`} onClick={chiudi} title="Impostazioni">
            <Settings size={21} />
            <span>Impostazioni</span>
          </a>
        </nav>
        <div className="sidebar__foot">
          <button className="user-chip" onClick={() => { chiudi(); vai('/impostazioni'); }} title="Ufficio Cimiteri · Amministratore">
            <span className="avatar avatar--sm" style={{ background: '#0A2F55' }}>UC</span>
            <span className="user-chip__txt">
              <b>Ufficio Cimiteri</b>
              <span>Amministratore</span>
            </span>
          </button>
          <CampanellaAlert nelMenu />
        </div>
      </aside>
    </>
  );
}
