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
  /** sepoltura provvisoria: il defunto sta qui finché non si libera il posto definitivo ("fino" assente = senza scadenza) */
  provvisorio?: { dal: string; fino?: string };
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
  /** chi è per il defunto: figlio, moglie, erede... Il concessionario non è mai il defunto */
  legameDefunto?: string;
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
  /** concessione perpetua (i contratti più vecchi): non scade e non si rinnova; la scadenza resta al 31/12/9999 */
  perpetua?: boolean;
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

// ---------------------------------------------------------------------------
// Operazioni cimiteriali
// ---------------------------------------------------------------------------

export type TipoOperazione = 'inumazione' | 'tumulazione' | 'esumazione' | 'estumulazione' | 'traslazione';
export type StatoPratica = 'aperta' | 'programmata' | 'eseguita' | 'annullata';
export type DestinazioneResti = 'ossario_comune' | 'cinerario_comune' | 'campo_comune' | 'fuori_comune' | 'altra_postazione';

/** Chi chiede al Comune una pratica; non è per forza il concessionario. */
export interface Richiedente {
  nome: string;
  codiceFiscale: string;
  telefono?: string;
  email?: string;
  /** serve a solleciti e diffide inviati tramite DAT */
  indirizzo?: string;
  legameDefunto?: string;
}

/** L'impresa che cura il funerale e segue le pratiche per conto della famiglia. */
export interface AgenziaFunebre {
  id: string;
  nome: string;
  partitaIva: string;
  telefono: string;
  email: string;
  /** un'agenzia non si cancella: si disattiva */
  attiva: boolean;
  /** può entrare in CimiTera: vede solo le sue operazioni e manda richieste all'ufficio */
  accesso?: boolean;
  ultimoAccesso?: string;
}

/** Richiesta di un'operazione mandata da un'agenzia funebre: l'ufficio la accoglie aprendo la pratica, oppure la rifiuta. */
export interface RichiestaAgenzia {
  id: string;
  numero: string;
  agenziaId: string;
  cimiteroId: string;
  tipo: TipoOperazione;
  defunto: Defunto;
  richiedente: Richiedente;
  /** giorno e ora proposti dall'agenzia */
  dataOra: string;
  note?: string;
  stato: 'in_attesa' | 'accolta' | 'rifiutata';
  inviataIl: string;
  praticaId?: string;
  motivoRifiuto?: string;
}

/** Il fascicolo di una sola operazione cimiteriale su un solo defunto. */
export interface Pratica {
  id: string;
  numero: string;
  cimiteroId: string;
  tipo: TipoOperazione;
  /** solo per esumazione ed estumulazione */
  straordinaria?: boolean;
  oggetto: 'salma' | 'resti' | 'ceneri';
  /** avviata dall'ufficio: senza richiedente e senza tariffa */
  dUfficio: boolean;
  richiedente?: Richiedente;
  defunto: Defunto;
  /** la postazione dove si fa l'operazione; nella traslazione è quella di partenza */
  schedaId: string;
  schedaArrivoId?: string;
  agenziaId?: string;
  stato: StatoPratica;
  apertaIl: string;
  /** chi l'ha aperta: id dell'operatore oppure 'ufficio' */
  apertaDa: string;
  /** programmata: data e ora, con almeno un operatore */
  dataOra?: string;
  operatoriIds?: string[];
  eseguitaIl?: string;
  /** esumazione ed estumulazione: dove vanno i resti */
  esitoResti?: { destinazione: DestinazioneResti; schedaId?: string };
  annullataIl?: string;
  motivoAnnullamento?: string;
  /** la tariffa del suo tipo; l'attestazione di pagamento è lo stato del suo avviso di pagamento */
  tariffa?: number;
  /** sepoltura provvisoria: il defunto va in un posto in attesa di quello definitivo */
  provvisoria?: { fino?: string };
  /** la richiesta dell'agenzia funebre da cui è nata */
  richiestaId?: string;
  storico?: { data: string; azione: string; operatore: string }[];
  /** traslazione di un defunto con l'utenza votiva */
  utenzaVotiva?: 'sposta' | 'chiudi';
  note?: string;
}

/** Un defunto che un'operazione ha portato fuori dalle postazioni: resta trovabile, con il posto dove si trova ora. */
export interface DefuntoAltrove {
  defunto: Defunto;
  daSchedaId: string;
  destinazione: DestinazioneResti;
  praticaId: string;
  data: string;
}

// ---------------------------------------------------------------------------
// Scadenze e pagamenti: invii tramite DAT e avvisi di pagamento (tutto simulato)
// ---------------------------------------------------------------------------

/** I servizi di DAT, con i loro nomi. Un canale per lotto. */
export type CanaleDat = 'posta_certa' | 'raccomandata_certa' | 'notifica_certa';
export type EsitoInvio = 'in_lavorazione' | 'spedito' | 'consegnato' | 'notificato' | 'non_consegnato';
export type TipoLettera = 'scadenza_concessione' | 'esumazione_dovuta' | 'avviso_pagamento' | 'sollecito' | 'diffida' | 'diffida_decadenza';

export interface Destinatario {
  nome: string;
  indirizzo: string;
}

/** Lotto: le lettere affidate a DAT in una volta sola, con lo stesso servizio. */
export interface LottoDat {
  id: string;
  numero: number;
  data: string;
  canale: CanaleDat;
  operatore: string;
  simulato: boolean;
}

/** Invio: una lettera a un destinatario, con il suo esito. */
export interface InvioDat {
  id: string;
  lottoId: string;
  tipo: TipoLettera;
  /** la riga dello scadenzario o l'avviso di pagamento a cui si riferisce */
  riferimento: string;
  destinatario: Destinatario;
  oggetto: string;
  esito: EsitoInvio;
  esitoIl?: string;
  motivoNonConsegna?: string;
  schedaId?: string;
  concessioneId?: string;
  avvisoId?: string;
}

export type MotivoAvviso = 'concessione' | 'utenza' | 'pratica';

/** Un passo della scala della morosità su un avviso di pagamento scaduto. */
export interface PassoMorosita {
  tipo: 'sollecito' | 'diffida' | 'sospensione' | 'cessazione' | 'avvio_decadenza';
  data: string;
}

/** Avviso di pagamento pagoPA: uno per motivo, anche con più voci. "Scaduto" si calcola dalla data. */
export interface AvvisoPagamento {
  id: string;
  /** codice dell'avviso (finto) */
  numero: string;
  cimiteroId: string;
  motivo: MotivoAvviso;
  /** id della concessione, dell'utenza votiva o della pratica */
  riferimentoId: string;
  causale: string;
  intestatario: { nome: string; codiceFiscale: string; indirizzo: string };
  voci: { descrizione: string; importo: number }[];
  importo: number;
  emessoIl: string;
  scadenza: string;
  stato: 'da_pagare' | 'pagato' | 'annullato';
  pagatoIl?: string;
  ricevuta?: string;
  annullatoIl?: string;
  motivoAnnullamento?: string;
  /** per i canoni dell'illuminazione votiva */
  anno?: number;
  passi: PassoMorosita[];
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
  campoComune: {
    /** anni dopo i quali una fossa si libera con l'esumazione ordinaria */
    turnoAnni: number;
  };
  operazioni: {
    tariffe: Record<TipoOperazione, number>;
  };
  pagamenti: {
    /** giorni per pagare un avviso di pagamento */
    giorniPagamento: number;
    giorniDopoSollecito: number;
    giorniDopoDiffida: number;
  };
}

export interface PosizioneLoculo {
  strutturaId: string;
  faccia: number;
  fila: number; // 1 = fila più bassa
  colonna: number; // 1 = da sinistra
  /** loculi doppi e tripli: quanti spazi della fila occupa il posto, verso destra (assente = 1) */
  spazi?: number;
}

/** Un documento caricato nella scheda (certificati, autorizzazioni...). Il file resta nel browser, come le foto. */
export interface DocumentoScheda {
  id: string;
  nome: string;
  categoria: string;
  /** il defunto a cui si riferisce, se la scheda ne ha più di uno */
  defunto?: string;
  /** chiave del file nell'archivio delle foto; 'demo' per i documenti dei dati dimostrativi */
  fileId: string;
  mime: string;
  dimensione: number;
  caricatoIl: string;
  caricatoDa: string;
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
  /** la scritta sulla lapide, per esempio "I tuoi cari ti ricordano con affetto" */
  epigrafe?: string;
  documenti?: DocumentoScheda[];
}

export type Priorita = 'bassa' | 'media' | 'alta' | 'urgente';
export type StatoManutenzione = 'aperta' | 'programmata' | 'risolta' | 'annullata';

export interface Manutenzione {
  id: string;
  /** vuoto quando la manutenzione riguarda una parte comune (vedi "luogo") */
  schedaId: string;
  /** parte comune del cimitero: un viale, un'area, una struttura */
  luogo?: string;
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

/** Le categorie con cui si filtrano gli alert della campanella. */
export type CategoriaAlert = TipoOperazione | 'manutenzione' | 'verifica' | 'pagamenti' | 'agenzie' | 'altro';

/** Alert della campanella: è personale, arriva solo a chi ha aperto la cosa o a chi è assegnata. */
export interface AlertPersonale {
  id: string;
  /** id dell'operatore, 'ufficio' (l'Amministratore) oppure 'agenzia:<id>' */
  destinatario: string;
  categoria?: CategoriaAlert;
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
  pratiche: Pratica[];
  agenzie: AgenziaFunebre[];
  richieste: RichiestaAgenzia[];
  defuntiAltrove: DefuntoAltrove[];
  avvisi: AvvisoPagamento[];
  lotti: LottoDat[];
  invii: InvioDat[];
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
export type Ruolo = 'operatore' | 'amministratore' | 'agenzia';

/** Chi è entrato: l'Operatore sceglie il proprio nome, l'Amministratore entra come "Ufficio Cimiteri". */
export interface Sessione {
  ruolo: Ruolo;
  operatoreId?: string;
  /** l'agenzia funebre entrata: vede solo le sue operazioni */
  agenziaId?: string;
}
