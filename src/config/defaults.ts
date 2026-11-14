import type { ConfigScheda, Filtri, RegoleComune, Struttura, TipologiaDef } from '../data/types';

// Configurazione iniziale della scheda. Campi ed elenchi si modificano da Impostazioni;
// stati e tipologie sono fissi: le tipologie sono i cinque tipi di postazione del glossario.
export const CONFIG_DEFAULT: ConfigScheda = {
  versione: 1,
  stati: [
    { id: 'occupato', label: 'Occupato', colore: '#3F9A3C', descrizione: 'Il posto ospita almeno un defunto' },
    { id: 'libero', label: 'Libero', colore: '#FFFFFF', descrizione: 'Posto disponibile per una nuova concessione' },
    { id: 'da_verificare', label: 'Da verificare', colore: '#E9BE1F', descrizione: 'Dati incerti: serve un controllo sul campo' },
    { id: 'da_manutenzionare', label: 'Da manutenzionare', colore: '#D9473F', descrizione: 'Segnalato un problema da risolvere' },
    { id: 'inaccessibile', label: 'Inaccessibile', colore: '#2F363D', descrizione: 'Non raggiungibile o messo in sicurezza' },
  ],
  tipologie: [
    { id: 'loculo', label: 'Loculo', colore: '#2F6FB3', icona: 'loculo' },
    { id: 'tomba_famiglia', label: 'Tomba di famiglia', colore: '#7B4FA8', icona: 'cappella' },
    { id: 'celletta_ossario', label: 'Celletta ossario', colore: '#8A6D3B', icona: 'box' },
    { id: 'nicchia_cineraria', label: 'Nicchia cineraria', colore: '#1E8C8C', icona: 'fiamma' },
    { id: 'fossa', label: 'Fossa in campo comune', colore: '#5E9A3A', icona: 'tomba' },
  ],
  sezioni: [
    { id: 'flag', label: 'Flag e informazioni aggiuntive' },
    { id: 'manufatto', label: 'Postazione' },
  ],
  campi: [
    {
      id: 'materiale', label: 'Materiale lapide', tipo: 'select', sezione: 'manufatto',
      opzioni: [
        { id: 'marmo_carrara', label: 'Marmo di Carrara' },
        { id: 'calcare_ibleo', label: 'Calcare ibleo' },
        { id: 'granito', label: 'Granito' },
        { id: 'pietra_pece', label: 'Pietra pece' },
        { id: 'travertino', label: 'Travertino' },
      ],
      inFiltri: false, inTabella: false, inExport: true, inPopup: false, inApp: true,
    },
    {
      id: 'condizione_lapide', label: 'Condizione lapide', tipo: 'select', sezione: 'manufatto',
      opzioni: [
        { id: 'buona', label: 'Buona', colore: '#3F9A3C' },
        { id: 'discreta', label: 'Discreta', colore: '#E9BE1F' },
        { id: 'danneggiata', label: 'Danneggiata', colore: '#D9473F' },
      ],
      inFiltri: true, inTabella: false, inExport: true, inPopup: false, inApp: true,
    },
  ],
  categorieManutenzione: [
    { id: 'lapide_danneggiata', label: 'Lapide danneggiata' },
    { id: 'infiltrazioni', label: "Infiltrazioni d'acqua" },
    { id: 'lampada_guasta', label: 'Lampada votiva guasta' },
    { id: 'vegetazione', label: 'Vegetazione infestante' },
    { id: 'cedimento', label: 'Cedimento strutturale' },
    { id: 'pulizia', label: 'Pulizia straordinaria' },
    { id: 'viali', label: 'Viali e pavimentazione' },
    { id: 'verde', label: 'Cura del verde' },
  ],
  motiviVerifica: [
    { id: 'lapide_illeggibile', label: 'Lapide illeggibile' },
    { id: 'dati_incompleti', label: 'Dati anagrafici incompleti' },
    { id: 'gps_da_confermare', label: 'Posizione GPS da confermare' },
    { id: 'foto_non_nitida', label: 'Foto non nitida' },
    { id: 'discordanza_registro', label: 'Discordanza con il registro' },
  ],
  registro: [],
};

/** Scheda di una struttura che non è una postazione: colombaio, ossario, cinerario. */
export const TIPOLOGIA_STRUTTURA: TipologiaDef = { id: 'struttura', label: 'Struttura', colore: '#64748B', icona: 'colombaio', contenitore: true };

export const NOMI_STRUTTURA: Record<Struttura['tipo'], string> = {
  colombaio: 'Colombaio', cappella: 'Cappella', ossario: 'Ossario', cinerario: 'Cinerario',
};

/** Tipo di postazione dei posti a parete di ogni struttura. */
export const POSTO_IN_STRUTTURA: Record<Struttura['tipo'], string> = {
  colombaio: 'loculo', cappella: 'loculo', ossario: 'celletta_ossario', cinerario: 'nicchia_cineraria',
};

/** Regole del Comune di partenza. Durate prese da Ragusa, solo come esempio; le tariffe sono inventate. */
export const REGOLE_DEFAULT: RegoleComune = {
  concessioni: {
    durate: { tomba_famiglia: 99, loculo: 60, celletta_ossario: 30, nicchia_cineraria: 30 },
    durataRinnovo: 10,
    sogliaInScadenzaMesi: 6,
    tariffe: {
      tomba_famiglia: { nuova: 4800, rinnovo: 900 },
      loculo: { nuova: 1650, rinnovo: 420 },
      celletta_ossario: { nuova: 380, rinnovo: 120 },
      nicchia_cineraria: { nuova: 420, rinnovo: 130 },
    },
  },
  // come a Ragusa: 24 € l'anno per punto luce, 15 € di allaccio
  illuminazione: { canonePuntoLuce: 24, allaccio: 15 },
  campoComune: { turnoAnni: 10 },
  // importi inventati: quelli di Ragusa non sono pubblicati
  operazioni: { tariffe: { inumazione: 180, tumulazione: 220, esumazione: 260, estumulazione: 310, traslazione: 240 } },
  pagamenti: { giorniPagamento: 30, giorniDopoSollecito: 30, giorniDopoDiffida: 30 },
};

export const FILTRI_VUOTI: Filtri = {
  nominativo: '',
  id: '',
  dataMorteDa: '',
  dataMorteA: '',
  stati: [],
  tipologie: [],
  quadranti: [],
  viali: [],
  strutture: 'tutte',
  concessione: 'tutte',
  lampada: 'tutte',
  campi: {},
};

/** Nome con cui entra l'Amministratore. */
export const UFFICIO = 'Ufficio Cimiteri';

export const PRIORITA = [
  { id: 'bassa', label: 'Bassa', colore: '#7A8797' },
  { id: 'media', label: 'Media', colore: '#2F6FB3' },
  { id: 'alta', label: 'Alta', colore: '#E07B22' },
  { id: 'urgente', label: 'Urgente', colore: '#D9473F' },
] as const;

export const STATI_MANUTENZIONE = [
  { id: 'aperta', label: 'Aperta', colore: '#D9473F' },
  { id: 'programmata', label: 'Programmata', colore: '#2F6FB3' },
  { id: 'risolta', label: 'Risolta', colore: '#3F9A3C' },
  { id: 'annullata', label: 'Annullata', colore: '#7A8797' },
] as const;

export const MOTIVI_ANNULLAMENTO = ['Doppione', 'Segnalazione sbagliata'] as const;

export const TIPI_CAMPO: { id: import('../data/types').TipoCampo; label: string; descrizione: string }[] = [
  { id: 'flag', label: 'Flag (sì / no)', descrizione: 'Un interruttore, es. Lampada votiva' },
  { id: 'select', label: 'Menu a tendina', descrizione: 'Una scelta da un elenco di opzioni' },
  { id: 'multiselect', label: 'Scelta multipla', descrizione: 'Più opzioni contemporaneamente' },
  { id: 'testo', label: 'Testo breve', descrizione: 'Codici, nomi, riferimenti' },
  { id: 'testo_lungo', label: 'Testo lungo', descrizione: 'Descrizioni e annotazioni' },
  { id: 'numero', label: 'Numero', descrizione: 'Quantità, misure' },
  { id: 'importo', label: 'Importo €', descrizione: 'Canoni, tariffe, quote' },
  { id: 'data', label: 'Data', descrizione: 'Scadenze, interventi' },
];
