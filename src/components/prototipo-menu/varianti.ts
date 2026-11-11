// PROTOTIPO, da buttare. Ticket "Struttura del menu" della mappa CimiTera.
// Tre varianti del menu laterale sulla app vera, cambiabili con ?menu=A|B|C|oggi
// e con ?ruolo=amministratore|operatore. Le pagine nuove sono segnaposto che dicono
// cosa conterranno e da dove arriva il contenuto di oggi.
import {
  BarChart3, Bell, CalendarClock, ClipboardCheck, ClipboardList, Euro, FileText, Landmark, LayoutDashboard, Lightbulb,
  Map as MapIcon, MapPinPlus, ScrollText, Search, Settings, Users, Wrench, type LucideIcon,
} from 'lucide-react';

export type Ruolo = 'amministratore' | 'operatore';

export interface Voce {
  path: string;
  label: string;
  icon: LucideIcon;
  soloAdmin?: boolean;
  conteggio?: 'manutenzioni';
  /** altre pagine che accendono questa voce */
  attivoAnche?: string[];
}
export interface Gruppo { titolo?: string; voci: Voce[] }
export interface SchedaProto { nome: string; contenuto: string; daOggi?: string; link?: string }
export interface PaginaProto { titolo: string; schede: SchedaProto[] }
export interface Variante {
  chiave: string;
  nome: string;
  gruppi: Gruppo[];
  /** pagine nuove, segnaposto */
  pagine: Record<string, PaginaProto>;
  /** cosa cambia nelle pagine che esistono già */
  note: Record<string, string>;
}

// --- pagine nuove che più varianti condividono ---------------------------------------------------
const PRATICHE: PaginaProto = {
  titolo: 'Pratiche e operazioni',
  schede: [
    { nome: 'Pratiche', contenuto: 'Una pratica per ogni operazione cimiteriale: documenti, autorizzazioni, esito. Collegata a postazione e defunto.' },
    { nome: 'Agenda', contenuto: 'Funerali e operazioni del giorno e della settimana.' },
    { nome: 'Esumazioni', contenuto: 'Scadenzario delle esumazioni ordinarie (fine turno del campo comune) e finestra delle straordinarie, 1 ottobre – 30 aprile.' },
  ],
};

// --- Variante A: lista unica ---------------------------------------------------------------------
const A: Variante = {
  chiave: 'A',
  nome: 'Lista unica',
  gruppi: [
    {
      voci: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/censimento', label: 'Censimento', icon: ClipboardList },
        { path: '/ricerca', label: 'Ricerca', icon: Search },
        { path: '/manutenzioni', label: 'Manutenzioni', icon: Wrench, conteggio: 'manutenzioni' },
        { path: '/concessioni', label: 'Concessioni', icon: ScrollText },
        { path: '/illuminazione-votiva', label: 'Illuminazione votiva', icon: Lightbulb },
        { path: '/pratiche', label: 'Pratiche e operazioni', icon: FileText },
        { path: '/report', label: 'Report', icon: BarChart3 },
      ],
    },
    { titolo: 'Configurazione', voci: [{ path: '/impostazioni', label: 'Impostazioni', icon: Settings, soloAdmin: true }] },
  ],
  pagine: {
    '/concessioni': {
      titolo: 'Concessioni',
      schede: [
        { nome: 'Concessioni', contenuto: 'Contratti con concessionario, eredi, postazione, data del contratto e scadenza.', daOggi: 'Anagrafe › Concessionari' },
        { nome: 'Scadenze', contenuto: 'Concessioni in scadenza nei prossimi mesi, con rinnovo.', daOggi: 'Report › Scadenze concessioni, Esportazioni › Scadenze' },
        { nome: 'Pagamenti', contenuto: 'Canoni di concessione: avvisi pagoPA (simulati), pagati, da pagare, morosi.', daOggi: 'Report › Pagamenti (parte delle concessioni)' },
        { nome: 'Avvisi', contenuto: 'Avvisi di scadenza inviati tramite DAT (simulati): stampa, spedizione, notifica.' },
      ],
    },
    '/illuminazione-votiva': {
      titolo: 'Illuminazione votiva',
      schede: [
        { nome: 'Utenze', contenuto: 'Una utenza per lampada: postazione, defunto, chi la richiede, stato (attiva, sospesa, disdetta).' },
        { nome: 'Bollette', contenuto: 'Canone annuo e allaccio, elenco per la fatturazione.', daOggi: 'Report › Lampade votive, Esportazioni › Lampade votive' },
        { nome: 'Morosi', contenuto: 'Sollecito, diffida, distacco.', daOggi: 'Report › Pagamenti (utenze morose)' },
        { nome: 'Avvisi', contenuto: 'Avvisi di scadenza e solleciti inviati tramite DAT (simulati).' },
      ],
    },
    '/pratiche': PRATICHE,
  },
  note: {
    '/ricerca': 'Variante A · Ricerca riceve Anagrafe › Defunti (interruttore Schede / Defunti) e un solo pulsante Esporta. Le pagine Anagrafe ed Esportazioni spariscono.',
    '/censimento': 'Variante A · La scheda Operatori resta qui in sola lettura. Aggiungere e togliere operatori passa in Impostazioni.',
    '/report': 'Variante A · Restano solo Postazioni libere e Statistiche: Report diventa una pagina sola. Scadenze, Lampade votive e Pagamenti passano a Concessioni e Illuminazione votiva.',
    '/impostazioni': 'Variante A · Solo Amministratore. Riceve la gestione degli operatori e le durate delle concessioni.',
  },
};

// --- Variante B: gruppi per area -----------------------------------------------------------------
const B: Variante = {
  chiave: 'B',
  nome: 'Gruppi per area',
  gruppi: [
    {
      titolo: 'Cimitero',
      voci: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/ricerca', label: 'Ricerca', icon: Search },
        { path: '/censimento', label: 'Censimento', icon: ClipboardList },
        { path: '/manutenzioni', label: 'Manutenzioni', icon: Wrench, conteggio: 'manutenzioni' },
      ],
    },
    {
      titolo: 'Servizi',
      voci: [
        { path: '/concessioni', label: 'Concessioni', icon: ScrollText },
        { path: '/illuminazione-votiva', label: 'Illuminazione votiva', icon: Lightbulb },
        { path: '/pratiche', label: 'Pratiche e operazioni', icon: FileText },
      ],
    },
    {
      titolo: 'Scadenze e incassi',
      voci: [
        { path: '/scadenzario', label: 'Scadenzario', icon: CalendarClock },
        { path: '/pagamenti', label: 'Pagamenti', icon: Euro },
      ],
    },
    {
      titolo: 'Configurazione',
      voci: [
        { path: '/operatori', label: 'Operatori', icon: Users, soloAdmin: true },
        { path: '/impostazioni', label: 'Impostazioni', icon: Settings, soloAdmin: true },
      ],
    },
  ],
  pagine: {
    '/concessioni': {
      titolo: 'Concessioni',
      schede: [
        { nome: 'Concessioni', contenuto: 'Contratti con concessionario, eredi, postazione, data del contratto e scadenza. Azioni: stipula, rinnovo, subentro, decadenza.', daOggi: 'Anagrafe › Concessionari' },
      ],
    },
    '/illuminazione-votiva': {
      titolo: 'Illuminazione votiva',
      schede: [
        { nome: 'Utenze', contenuto: 'Una utenza per lampada: postazione, defunto, chi la richiede, stato. Azioni: allaccio, voltura, disdetta, guasto.' },
        { nome: 'Lampade per viale', contenuto: 'Quante lampade accese in ogni viale.', daOggi: 'Report › Lampade votive' },
      ],
    },
    '/pratiche': PRATICHE,
    '/scadenzario': {
      titolo: 'Scadenzario',
      schede: [
        { nome: 'Scadenze', contenuto: 'Un solo calendario per tutto ciò che scade: concessioni, canoni votivi, esumazioni.', daOggi: 'Report › Scadenze concessioni, Esportazioni › Scadenze' },
        { nome: 'Avvisi DAT', contenuto: 'Dalle scadenze si preparano gli avvisi e si inviano tramite DAT (simulato): stampa, spedizione, notifica, stato di ogni invio.' },
      ],
    },
    '/pagamenti': {
      titolo: 'Pagamenti',
      schede: [
        { nome: 'Avvisi pagoPA', contenuto: 'Tutti gli importi in un posto: canoni di concessione, canoni votivi, tariffe delle operazioni. Collegamento pagoPA simulato.', daOggi: 'Report › Pagamenti' },
        { nome: 'Morosi', contenuto: 'Chi non ha pagato, con sollecito, diffida e distacco della lampada.', daOggi: 'Report › Pagamenti, Report › Lampade votive (utenze morose)' },
        { nome: 'Fatturazione', contenuto: 'Elenco per la fatturazione delle utenze votive.', daOggi: 'Esportazioni › Lampade votive' },
      ],
    },
    '/operatori': {
      titolo: 'Operatori',
      schede: [
        { nome: 'Operatori', contenuto: 'Elenco, contatti, quadranti assegnati, schede rilevate, verifiche. Solo Amministratore.', daOggi: 'Censimento › Operatori, Censimento › Avanzamento (Operatori sul campo)', link: '/censimento?tab=operatori' },
      ],
    },
  },
  note: {
    '/ricerca': 'Variante B · Ricerca riceve Anagrafe › Defunti, un solo pulsante Esporta e il filtro pronto "Postazioni libere" (da Report). Spariscono Anagrafe, Esportazioni e Report.',
    '/censimento': 'Variante B · Riceve le Statistiche da Report. La scheda Operatori diventa la voce Operatori del menu.',
    '/report': 'Variante B · Report non è più nel menu: Postazioni libere va in Ricerca, Statistiche in Censimento, il resto in Scadenzario e Pagamenti.',
    '/impostazioni': 'Variante B · Solo Amministratore. Gli operatori hanno una voce loro.',
  },
};

// --- Variante C: poche voci, il resto in schede ---------------------------------------------------
const C: Variante = {
  chiave: 'C',
  nome: 'Poche voci',
  gruppi: [
    {
      voci: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/ricerca', label: 'Ricerca', icon: Search },
        { path: '/cimitero', label: 'Cimitero', icon: Landmark, conteggio: 'manutenzioni', attivoAnche: ['/censimento', '/manutenzioni', '/report'] },
        { path: '/contratti', label: 'Contratti', icon: ScrollText },
        { path: '/pratiche', label: 'Pratiche', icon: FileText },
        { path: '/scadenze', label: 'Scadenze e pagamenti', icon: Bell },
      ],
    },
    { titolo: 'Configurazione', voci: [{ path: '/impostazioni', label: 'Impostazioni', icon: Settings, soloAdmin: true }] },
  ],
  pagine: {
    '/cimitero': {
      titolo: 'Cimitero',
      schede: [
        { nome: 'Censimento', contenuto: 'Avanzamento, quadranti, verifiche, colombari e cappelle.', daOggi: 'Censimento', link: '/censimento' },
        { nome: 'Manutenzioni', contenuto: 'Elenco, calendario, segnalazioni.', daOggi: 'Manutenzioni', link: '/manutenzioni' },
        { nome: 'Postazioni libere', contenuto: 'Posti liberi per tipologia e per struttura.', daOggi: 'Report › Postazioni libere', link: '/report?vista=libere' },
        { nome: 'Statistiche', contenuto: 'Stati, tipologie, riepilogo per quadrante.', daOggi: 'Report › Statistiche', link: '/report?vista=statistiche' },
      ],
    },
    '/contratti': {
      titolo: 'Contratti',
      schede: [
        { nome: 'Concessioni', contenuto: 'Contratti di concessione con concessionario, eredi, postazione, scadenza.', daOggi: 'Anagrafe › Concessionari' },
        { nome: 'Illuminazione votiva', contenuto: 'Utenze di illuminazione votiva: postazione, defunto, chi la richiede, stato.', daOggi: 'Report › Lampade votive' },
      ],
    },
    '/pratiche': { ...PRATICHE, titolo: 'Pratiche' },
    '/scadenze': {
      titolo: 'Scadenze e pagamenti',
      schede: [
        { nome: 'Scadenzario', contenuto: 'Concessioni, canoni votivi ed esumazioni in un solo calendario.', daOggi: 'Report › Scadenze concessioni' },
        { nome: 'Pagamenti', contenuto: 'Avvisi pagoPA simulati per canoni e tariffe delle operazioni.', daOggi: 'Report › Pagamenti' },
        { nome: 'Morosi', contenuto: 'Sollecito, diffida, distacco.', daOggi: 'Report › Lampade votive (utenze morose)' },
        { nome: 'Avvisi DAT', contenuto: 'Avvisi di scadenza inviati tramite DAT (simulati), con lo stato di ogni invio.' },
      ],
    },
  },
  note: {
    '/ricerca': 'Variante C · Ricerca riceve Anagrafe › Defunti e un solo pulsante Esporta.',
    '/censimento': 'Variante C · Censimento non è più una voce: è la prima scheda di Cimitero.',
    '/manutenzioni': 'Variante C · Manutenzioni non è più una voce: è una scheda di Cimitero.',
    '/report': 'Variante C · Report sparisce: Postazioni libere e Statistiche diventano schede di Cimitero.',
    '/impostazioni': 'Variante C · Solo Amministratore. Riceve la gestione degli operatori.',
  },
};

export const VARIANTI: Variante[] = [A, B, C];

/** Menu sul telefono, uguale per tutte le varianti: solo campo e consultazione (ticket "Ruoli e versioni dell'app"). */
export const VOCI_TELEFONO: Voce[] = [
  { path: '/mappa', label: 'Mappa', icon: MapIcon },
  { path: '/ricerca', label: 'Ricerca', icon: Search },
  { path: '/rilievo', label: 'Nuovo rilievo', icon: MapPinPlus },
  { path: '/manutenzioni', label: 'Manutenzioni', icon: Wrench, conteggio: 'manutenzioni' },
  { path: '/censimento?tab=verifiche', label: 'Verifiche', icon: ClipboardCheck, attivoAnche: ['/censimento'] },
];
