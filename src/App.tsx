import { lazy, Suspense, useEffect } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { EntraCome } from './components/EntraCome';
import { Modali, PannelloScheda } from './components/Modali';
import { paginaPermessa, paginaSoloComputer, Sidebar } from './components/Sidebar';
import { StrisciaRete } from './components/StrisciaRete';
import { Topbar, TopbarAgenzia } from './components/Topbar';
import { Empty, Toasts } from './components/ui';
import { Mark, Wordmark } from './components/Logo';
import { GrigliaParete } from './components/parete/GrigliaParete';
import { useUtente } from './data/selectors';
import { setUi, useStore } from './data/store';
import { useTelefono } from './lib/schermo';
import { useRotta, vai } from './router';
import { Dashboard } from './pages/Dashboard';
import { MappaPage } from './pages/MappaPage';

const RicercaPage = lazy(() => import('./pages/RicercaPage').then((m) => ({ default: m.RicercaPage })));
const SchedaPage = lazy(() => import('./pages/SchedaPage').then((m) => ({ default: m.SchedaPage })));
const CittadinoPage = lazy(() => import('./pages/CittadinoPage').then((m) => ({ default: m.CittadinoPage })));
const CensimentoPage = lazy(() => import('./pages/CensimentoPage').then((m) => ({ default: m.CensimentoPage })));
const RilievoPage = lazy(() => import('./pages/RilievoPage').then((m) => ({ default: m.RilievoPage })));
const IlluminazionePage = lazy(() => import('./pages/IlluminazionePage').then((m) => ({ default: m.IlluminazionePage })));
const OperazioniPage = lazy(() => import('./pages/OperazioniPage').then((m) => ({ default: m.OperazioniPage })));
const ConcessioniPage = lazy(() => import('./pages/ConcessioniPage').then((m) => ({ default: m.ConcessioniPage })));
const ManutenzioniPage = lazy(() => import('./pages/ManutenzioniPage').then((m) => ({ default: m.ManutenzioniPage })));
const ScadenzePage = lazy(() => import('./pages/ScadenzePage').then((m) => ({ default: m.ScadenzePage })));
const AmministrazionePage = lazy(() => import('./pages/AmministrazionePage').then((m) => ({ default: m.AmministrazionePage })));
const ImpostazioniPage = lazy(() => import('./pages/ImpostazioniPage').then((m) => ({ default: m.ImpostazioniPage })));
const AgenziaPage = lazy(() => import('./pages/AgenziaPage').then((m) => ({ default: m.AgenziaPage })));

function Pagina() {
  const r = useRotta();
  const utente = useUtente();
  const telefono = useTelefono();

  if (!paginaPermessa(r.path, utente.ruolo))
    return (
      <div className="page">
        <Empty titolo="Pagina riservata all'Amministratore" testo="Per aprirla cambia ruolo dal riquadro in fondo al menu." />
      </div>
    );
  if (telefono && paginaSoloComputer(r.path))
    return (
      <div className="page">
        <Empty
          titolo="Questa pagina si usa dal computer"
          testo="Sul telefono ci sono il lavoro sul campo e la consultazione: mappa, ricerca, rilievo, manutenzioni e verifiche."
          azione={<button className="btn btn--primary" onClick={() => vai('/mappa')}><MapIcon size={16} />Vai alla Mappa</button>}
        />
      </div>
    );

  switch (r.parti[0]) {
    case undefined:
      return <Dashboard />;
    case 'mappa':
      return <MappaPage />;
    case 'ricerca':
      return <RicercaPage />;
    case 'scheda':
      return <SchedaPage id={r.parti[1] ?? ''} />;
    case 'censimento':
      return <CensimentoPage />;
    case 'rilievo':
      return <RilievoPage />;
    case 'concessioni':
      return <ConcessioniPage />;
    case 'illuminazione-votiva':
      return <IlluminazionePage />;
    case 'operazioni':
      return <OperazioniPage />;
    case 'manutenzioni':
      return <ManutenzioniPage />;
    case 'scadenze':
      return <ScadenzePage />;
    case 'amministrazione':
      return <AmministrazionePage />;
    case 'impostazioni':
      return <ImpostazioniPage />;
    default:
      return (
        <div className="page">
          <h1>Pagina non trovata</h1>
          <p className="muted mt-8">L'indirizzo non corrisponde a nessuna sezione di CimiTera.</p>
        </div>
      );
  }
}

function Caricamento({ errore }: { errore?: string | null }) {
  return (
    <div className="splash">
      <Mark size={84} />
      <Wordmark firma />
      {errore ? <p className="callout callout--danger">{errore}</p> : <div className="spinner" />}
    </div>
  );
}

export function App() {
  const pronto = useStore((s) => s.pronto);
  const errore = useStore((s) => s.errore);
  const sessione = useStore((s) => s.sessione);
  const telefono = useTelefono();
  const r = useRotta();

  useEffect(() => {
    setUi({ menuMobile: false, parete: null, modale: null });
    if (r.parti[0] !== 'mappa' && r.parti[0] !== undefined) setUi({ pannello: false });
  }, [r.path]);

  // sul telefono la pagina iniziale è la Mappa: la Dashboard ha le statistiche, che restano sul computer
  useEffect(() => {
    if (sessione && sessione.ruolo !== 'agenzia' && telefono && r.path === '/') vai('/mappa');
  }, [sessione, telefono, r.path]);

  if (!pronto || errore) return <Caricamento errore={errore} />;

  // pagina pubblica del Cittadino: ha un suo indirizzo, senza menu e senza ingresso
  if (r.parti[0] === 'cittadino')
    return (
      <Suspense fallback={<Caricamento />}>
        <CittadinoPage />
      </Suspense>
    );

  if (!sessione) return <EntraCome />;

  // l'agenzia funebre: solo il suo calendario, le sue pratiche e le sue richieste
  if (sessione.ruolo === 'agenzia')
    return (
      <div className="app">
        <Sidebar />
        <div className="main">
          <TopbarAgenzia />
          <div className="content-wrap">
            <main className="content">
              <Suspense fallback={<div className="page"><div className="spinner" /></div>}>
                <AgenziaPage />
              </Suspense>
            </main>
          </div>
        </div>
        <Toasts />
      </div>
    );

  const piena = r.parti[0] === 'mappa';
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <StrisciaRete />
        <Topbar />
        <div className="content-wrap">
          <main className={`content ${piena ? 'content--full' : ''}`}>
            <Suspense fallback={<div className="page"><div className="spinner" /></div>}>
              <Pagina />
            </Suspense>
          </main>
          <PannelloScheda />
        </div>
      </div>
      <Modali />
      <GrigliaParete />
      <Toasts />
    </div>
  );
}
