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

/** Colombari e cappelle familiari: contengono una griglia di loculi a parete. */
export interface Struttura {
  id: string;
  cimiteroId: string;
  tipo: 'colombaio' | 'cappella';
  nome: string;
  schedaId: string; // scheda del manufatto contenitore
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
  ruolo: string;
  telefono: string;
  email: string;
  colore: string;
  attivo: boolean;
}

export interface Defunto {
  nome: string;
  cognome: string;
  sesso?: 'M' | 'F';
  dataNascita?: string | null;
  dataMorte?: string | null;
}

export interface Concessione {
  numero: string;
  intestatario: string;
  dataInizio: string;
  dataScadenza: string;
  durataAnni: number;
  rinnovi: number;
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
  concessione?: Concessione | null;
  campi: Record<string, ValoreCampo>;
  rilevatoDa: string;
  rilevatoIl: string;
  aggiornatoIl: string;
  note?: string;
  area?: string;
  numeroPosto?: string;
  nomeManufatto?: string;
  strutturaId?: string; // valorizzato sulle schede contenitore (cappella, colombaio)
  posizione?: PosizioneLoculo; // valorizzato sui loculi dentro una struttura
  fotoId?: string;
  storico?: EventoStorico[];
}

export type Priorita = 'bassa' | 'media' | 'alta' | 'urgente';
export type StatoManutenzione = 'aperta' | 'pianificata' | 'in_corso' | 'risolta';

export interface Manutenzione {
  id: string;
  schedaId: string;
  cimiteroId: string;
  categoria: string;
  priorita: Priorita;
  stato: StatoManutenzione;
  descrizione: string;
  fonte: string;
  segnalataDa: string;
  segnalataIl: string;
  squadra?: string;
  dataPianificata?: string;
  risoltaIl?: string;
  noteRisoluzione?: string;
  fotoProblemaId?: string;
  fotoRisoluzione?: string; // 'demo' oppure id della foto caricata
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

export interface AlertManuale {
  id: string;
  tipo: string;
  priorita: Priorita;
  titolo: string;
  messaggio: string;
  data: string;
  schedaId?: string;
  manutenzioneId?: string;
  creatoDa: string;
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
  manutenzioni: Manutenzione[];
  verifiche: Verifica[];
  alert: AlertManuale[];
  alertLetti: string[];
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
  squadre: Opzione[];
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
  campi: Record<string, FiltroCampo>;
}

export type StileMappa = 'satellite' | 'planimetria';

// ---------------------------------------------------------------------------
// Ruoli e ingresso (demo: senza password)
// ---------------------------------------------------------------------------

export type Ruolo = 'cittadino' | 'operatore' | 'amministratore';

/** Chi è entrato: l'Operatore sceglie il proprio nome, l'Amministratore entra come "Ufficio Cimiteri". */
export interface Sessione {
  ruolo: Ruolo;
  operatoreId?: string;
}
