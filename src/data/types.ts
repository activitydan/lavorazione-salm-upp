// Modello dati di CimiTera.
// I dati del censimento (schede) sono separati dalla configurazione della scheda (ConfigScheda):
// flag, menu a tendina e campi si cambiano dalla configurazione, senza toccare il codice.

export type LatLng = [number, number];

export interface Cimitero {
  id: string;
  nome: string;
  breve: string;
  codice: string; // usato nell'ID automatico: CIM-<codice>-000001
  comune: string;
  perimetro: LatLng[];
  centro: LatLng;
  zoom: number;
  puntoPartenza: LatLng; // da dove parte il censimento (punta sud)
  fonteGeometria: string;
  censimento: { inizio?: string; stato: 'da_avviare' | 'in_corso' | 'completato' };
}

export interface Quadrante {
  id: string;
  cimiteroId: string;
  codice: string;
  nome: string;
  colore: string;
  poligono: LatLng[];
  operatoreId: string | null;
  stato: 'da_avviare' | 'in_corso' | 'completato';
  stimaManufatti: number;
}

export interface Viale {
  id: string;
  cimiteroId: string;
  nome: string;
  tracciato: LatLng[];
}

export interface Area {
  id: string;
  cimiteroId: string;
  nome: string;
  tipo: 'campo' | 'prato';
  poligono: LatLng[];
}

export interface Faccia {
  nome: string;
  righe: number;
  colonne: number;
}

/** Struttura: la costruzione con più posti a parete (colombaio, cappella, ossario, cinerario), visti in una griglia. */
export interface Struttura {
  id: string;
  cimiteroId: string;
  tipo: 'colombaio' | 'cappella' | 'ossario' | 'cinerario';
  nome: string;
  schedaId: string; // scheda della struttura
  lat: number;
  lng: number;
  angolo: number;
  lunghezzaM: number;
  larghezzaM: number;
  impronta: LatLng[];
  facce: Faccia[];
  viale: string;
  quadranteId: string;
}

export interface Operatore {
  id: string;
  nome: string;
  /** come nel glossario: l'Amministratore è l'operatore che gestisce anche operatori, regole e impostazioni */
  ruolo: 'Operatore' | 'Amministratore';
  telefono: string;
  email: string;
  colore: string;
  /** un operatore non si cancella: si disattiva */
  attivo: boolean;
}

export interface Defunto {
  nome: string;
  cognome: string;
  sesso?: 'M' | 'F';
  dataNascita?: string | null;
  dataMorte?: string | null;
}

// ---------------------------------------------------------------------------
// Concessioni
// ---------------------------------------------------------------------------

/** Le postazioni che si danno in concessione; la fossa in campo comune ha il turno. */
export type TipoConcessione = 'loculo' | 'tomba_famiglia' | 'celletta_ossario' | 'nicchia_cineraria';

/** Una persona o un ente: il tipo va indicato sempre. L'indirizzo serve alle lettere inviate tramite DAT. */
export interface Soggetto {
  tipo: 'persona' | 'ente';
  nome?: string;
  cognome?: string;
  denominazione?: string;
  legaleRappresentante?: string;
  /** codice fiscale, oppure partita IVA per un ente */
  codiceFiscale: string;
  indirizzo: string;
  telefono?: string;
  email?: string;
}

export interface Concessionario extends Soggetto {
  /** quando i concessionari sono più di uno: chi tratta con il Comune */
  rappresentante?: boolean;
}

export interface AventeDiritto {
  nome: string;
  parentela: string;
}

export type MotivoChiusura = 'scaduta' | 'decaduta' | 'revocata' | 'rinunciata' | 'estinta';

export interface EventoConcessione {
  data: string;
  azione: string;
  atto?: string;
  operatore: string;
}

/** Il contratto con cui il Comune assegna per un tempo determinato una o più postazioni. */
export interface Concessione {
  id: string;
  numero: string;
  cimiteroId: string;
  dataStipula: string;
  provvedimento?: string;
  tipo: TipoConcessione;
  /** una tomba di famiglia copre tutti i suoi posti con un solo contratto */
  schedeIds: string[];
  postiTotali: number;
  concessionari: Concessionario[];
  /** solo per le tombe di famiglia */
  aventiDiritto?: AventeDiritto[];
  decorrenza: string;
  durataAnni: number;
  rinnovi: number;
  /** la regola con cui è nato il contratto: cambiare le durate non tocca i contratti esistenti */
  regola: string;
  scadenza: string;
  /** "in scadenza" e "scaduta" non si salvano: si calcolano dalla data */
  stato: 'attiva' | 'in_decadenza' | 'chiusa';
  motivoChiusura?: MotivoChiusura;
  chiusaIl?: string;
  storico: EventoConcessione[];
}

// ---------------------------------------------------------------------------
// Illuminazione votiva
// ---------------------------------------------------------------------------

/** Chi ha un'utenza votiva e ne paga il canone; non è per forza il concessionario. */
export interface Abbonato extends Soggetto {
  /** solo se è diverso dall'indirizzo di residenza */
  indirizzoBolletta?: string;
  legameDefunto?: string;
}

export type StatoUtenza = 'da_allacciare' | 'attiva' | 'sospesa' | 'cessata';
export type MotivoCessazione = 'disdetta' | 'morosita' | 'fine_concessione' | 'defunto_spostato';

export interface EventoUtenza {
  data: string;
  azione: string;
  operatore: string;
}

/** Il contratto di illuminazione votiva su una postazione, per un defunto o per tutta una tomba di famiglia. */
export interface UtenzaVotiva {
  id: string;
  numero: string;
  cimiteroId: string;
  dataContratto: string;
  schedaId: string;
  /** assente quando l'utenza vale per tutta la tomba di famiglia */
  defunto?: { nome: string; cognome: string };
  abbonato: Abbonato;
  /** 1 di norma; più di 1 solo nelle tombe di famiglia */
  puntiLuce: number;
  allacciataIl?: string;
  stato: StatoUtenza;
  sospesaIl?: string;
  /** disdetta registrata: vale dal 1° gennaio dell'anno dopo */
  disdettaDal?: string;
  cessataIl?: string;
  motivoCessazione?: MotivoCessazione;
  storico: EventoUtenza[];
}

/** Regole del Comune (Amministrazione): valgono per i nuovi contratti e addebiti. */
export interface RegoleComune {
  concessioni: {
    durate: Record<TipoConcessione, number>;
    durataRinnovo: number;
    sogliaInScadenzaMesi: number;
    tariffe: Record<TipoConcessione, { nuova: number; rinnovo: number }>;
  };
  illuminazione: {
    /** canone annuo per punto luce */
    canonePuntoLuce: number;
    /** contributo di allaccio, una volta sola */
    allaccio: number;
  };
}

export interface PosizioneLoculo {
  strutturaId: string;
  faccia: number;
  fila: number; // 1 = fila più bassa
  colonna: number; // 1 = da sinistra
}

export type ValoreCampo = boolean | string | number | string[] | null | undefined;

export interface EventoStorico {
  data: string;
  utente: string;
  azione: string;
}

export interface Scheda {
  id: string;
  cimiteroId: string;
  tipologia: string;
  stato: string;
  lat: number;
  lng: number;
  viale: string;
  quadranteId?: string | null;
  defunti: Defunto[];
  campi: Record<string, ValoreCampo>;
  rilevatoDa: string;
  rilevatoIl: string;
  aggiornatoIl: string;
  note?: string;
  area?: string;
  numeroPosto?: string;
  nomeManufatto?: string;
  strutturaId?: string; // valorizzato sulla scheda della struttura
  posizione?: PosizioneLoculo; // valorizzato sui loculi dentro una struttura
  fotoId?: string;
  storico?: EventoStorico[];
  /** spento su richiesta della famiglia: il Cittadino non trova i defunti di questa scheda (assente = visibile) */
  visibilePubblico?: boolean;
  /** "C'è una lampada accesa?": cosa ha visto l'operatore sul campo, e quando */
  lampadaAccesa?: boolean;
  lampadaVistaIl?: string;
}

export type Priorita = 'bassa' | 'media' | 'alta' | 'urgente';
export type StatoManutenzione = 'aperta' | 'programmata' | 'risolta' | 'annullata';

export interface Manutenzione {
  id: string;
  schedaId: string;
  cimiteroId: string;
  categoria: string;
  priorita: Priorita;
  stato: StatoManutenzione;
  descrizione: string;
  /** chi l'ha registrata: id dell'operatore oppure 'ufficio' */
  segnalataDa: string;
  segnalataIl: string;
  /** operatori assegnati quando si programma: almeno uno */
  operatoriIds?: string[];
  dataProgrammata?: string;
  risoltaIl?: string;
  noteRisoluzione?: string;
  fotoProblemaId?: string;
  fotoRisoluzione?: string; // 'demo' oppure id della foto caricata
  annullataIl?: string;
  motivoAnnullamento?: string;
}

export interface Verifica {
  id: string;
  schedaId: string;
  operatoreId: string;
  motivo: string;
  assegnataIl: string;
  scadenza: string;
  stato: 'aperta' | 'completata';
  completataIl?: string;
  esito?: 'confermata' | 'corretta' | 'non_verificabile';
  noteEsito?: string;
  note?: string;
}

/** Alert della campanella: è personale, arriva solo a chi ha aperto la cosa o a chi è assegnata. */
export interface AlertPersonale {
  id: string;
  /** id dell'operatore oppure 'ufficio' (l'Amministratore) */
  destinatario: string;
  data: string;
  livello: 'urgente' | 'attenzione' | 'info';
  titolo: string;
  messaggio: string;
  link?: string;
}

/** Una cosa fatta senza rete, che aspetta di essere inviata all'ufficio. */
export interface VoceDaInviare {
  id: string;
  tipo: 'rilievo' | 'manutenzione' | 'verifica';
  /** id della scheda, della manutenzione o della verifica */
  riferimento: string;
  descrizione: string;
  data: string;
}

export interface VoceEsportazione {
  data: string;
  tipo: string;
  righe: number;
}

export interface Database {
  versione: number;
  generatoIl?: string;
  cimiteri: Cimitero[];
  quadranti: Quadrante[];
  viali: Viale[];
  aree: Area[];
  strutture: Struttura[];
  operatori: Operatore[];
  schede: Scheda[];
  concessioni: Concessione[];
  utenze: UtenzaVotiva[];
  regole: RegoleComune;
  manutenzioni: Manutenzione[];
  verifiche: Verifica[];
  alert: AlertPersonale[];
  alertLetti: string[];
  daInviare: VoceDaInviare[];
  esportazioni: VoceEsportazione[];
}

// ---------------------------------------------------------------------------
// Configurazione della scheda ("Scheda Pro")
// ---------------------------------------------------------------------------

export type TipoCampo = 'flag' | 'select' | 'multiselect' | 'testo' | 'testo_lungo' | 'numero' | 'importo' | 'data';

export interface Opzione {
  id: string;
  label: string;
  colore?: string;
  archiviata?: boolean;
}

export interface CampoDef {
  id: string; // chiave stabile nei dati: rinominare cambia solo la label
  label: string;
  tipo: TipoCampo;
  sezione: string;
  opzioni?: Opzione[];
  obbligatorio?: boolean;
  inFiltri: boolean;
  inTabella: boolean;
  inExport: boolean;
  inPopup: boolean;
  inApp: boolean;
  applicaA?: string[]; // id tipologie; vuoto = tutte
  archiviato?: boolean;
  aiuto?: string;
  unita?: string;
  icona?: string;
}

export interface SezioneDef {
  id: string;
  label: string;
}

export interface StatoDef {
  id: string;
  label: string;
  colore: string;
  descrizione?: string;
  archiviato?: boolean;
}

export interface TipologiaDef {
  id: string;
  label: string;
  colore: string;
  icona: string;
  contenitore?: boolean;
  archiviata?: boolean;
}

export interface VoceRegistro {
  data: string;
  utente: string;
  descrizione: string;
}

export interface ConfigScheda {
  versione: number;
  stati: StatoDef[];
  tipologie: TipologiaDef[];
  sezioni: SezioneDef[];
  campi: CampoDef[];
  categorieManutenzione: Opzione[];
  motiviVerifica: Opzione[];
  registro: VoceRegistro[];
}

// ---------------------------------------------------------------------------
// Filtri di ricerca (condivisi tra Mappa, Ricerca ed Esportazioni)
// ---------------------------------------------------------------------------

export type FiltroCampo =
  | 'si'
  | 'no'
  | string[]
  | string
  | { min?: number; max?: number }
  | { da?: string; a?: string };

export interface Filtri {
  nominativo: string;
  id: string;
  dataMorteDa: string;
  dataMorteA: string;
  stati: string[];
  tipologie: string[];
  quadranti: string[];
  viali: string[];
  strutture: 'tutte' | 'colombari' | 'cappelle';
  concessione: 'tutte' | 'in_scadenza' | 'scadute' | 'senza';
  /** il flag "Lampada votiva" lo calcola CimiTera dall'utenza attiva */
  lampada: 'tutte' | 'si' | 'no';
  campi: Record<string, FiltroCampo>;
}

export type StileMappa = 'satellite' | 'planimetria';

// ---------------------------------------------------------------------------
// Ruoli e ingresso (demo: senza password)
// ---------------------------------------------------------------------------

/** Il Cittadino non entra: ha la sua pagina pubblica (#/cittadino). */
export type Ruolo = 'operatore' | 'amministratore';

/** Chi è entrato: l'Operatore sceglie il proprio nome, l'Amministratore entra come "Ufficio Cimiteri". */
export interface Sessione {
  ruolo: Ruolo;
  operatoreId?: string;
}
