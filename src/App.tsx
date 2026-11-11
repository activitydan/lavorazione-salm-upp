import { lazy, Suspense, useEffect } from 'react';
import { Modali, PannelloScheda } from './components/Modali';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toasts } from './components/ui';
import { Mark, Wordmark } from './components/Logo';
import { GrigliaParete } from './components/parete/GrigliaParete';
import { setUi, useStore } from './data/store';
import { useRotta } from './router';
import { Dashboard } from './pages/Dashboard';
import { MappaPage } from './pages/MappaPage';
import { BarraPrototipo, NotaPrototipo, PaginaPrototipo } from './components/prototipo-menu/PrototipoMenu';

const RicercaPage = lazy(() => import('./pages/RicercaPage').then((m) => ({ default: m.RicercaPage })));
const SchedaPage = lazy(() => import('./pages/SchedaPage').then((m) => ({ default: m.SchedaPage })));
const QrPubblica = lazy(() => import('./pages/QrPubblica').then((m) => ({ default: m.QrPubblica })));
const CensimentoPage = lazy(() => import('./pages/CensimentoPage').then((m) => ({ default: m.CensimentoPage })));
const RilievoPage = lazy(() => import('./pages/RilievoPage').then((m) => ({ default: m.RilievoPage })));
const AnagrafePage = lazy(() => import('./pages/AnagrafePage').then((m) => ({ default: m.AnagrafePage })));
const ManutenzioniPage = lazy(() => import('./pages/ManutenzioniPage').then((m) => ({ default: m.ManutenzioniPage })));
const ReportPage = lazy(() => import('./pages/ReportPage').then((m) => ({ default: m.ReportPage })));
const EsportazioniPage = lazy(() => import('./pages/EsportazioniPage').then((m) => ({ default: m.EsportazioniPage })));
const ImpostazioniPage = lazy(() => import('./pages/ImpostazioniPage').then((m) => ({ default: m.ImpostazioniPage })));

function Pagina() {
  const r = useRotta();
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
    case 'anagrafe':
      return <AnagrafePage />;
    case 'manutenzioni':
      return <ManutenzioniPage />;
    case 'report':
      return <ReportPage />;
    case 'esportazioni':
      return <EsportazioniPage />;
    case 'impostazioni':
      return <ImpostazioniPage />;
    default:
      return (
        <PaginaPrototipo path={r.path} altrimenti={
          <div className="page">
            <h1>Pagina non trovata</h1>
            <p className="muted mt-8">L'indirizzo non corrisponde a nessuna sezione di SALM-APP.</p>
          </div>
        } />
      );
  }
}

function Caricamento({ errore }: { errore?: string | null }) {
  return (
    <div className="splash">
      <Mark size={84} />
      <Wordmark />
      {errore ? <p className="callout callout--danger">{errore}</p> : <div className="spinner" />}
    </div>
  );
}

export function App() {
  const pronto = useStore((s) => s.pronto);
  const errore = useStore((s) => s.errore);
  const r = useRotta();

  useEffect(() => {
    setUi({ menuMobile: false, parete: null, modale: null });
    if (r.parti[0] !== 'mappa' && r.parti[0] !== undefined) setUi({ pannello: false });
  }, [r.path]);

  if (!pronto || errore) return <Caricamento errore={errore} />;

  // vista pubblica del QR: niente menu, pensata per il telefono del visitatore
  if (r.parti[0] === 'qr')
    return (
      <Suspense fallback={<Caricamento />}>
        <QrPubblica id={r.parti[1] ?? ''} />
      </Suspense>
    );

  const piena = r.parti[0] === 'mappa';
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content-wrap">
          <main className={`content ${piena ? 'content--full' : ''}`}>
            {!piena && <NotaPrototipo />}
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
      <BarraPrototipo />
    </div>
  );
}
