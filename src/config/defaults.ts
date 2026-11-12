import type { ConfigScheda, Filtri } from '../data/types';

// Configurazione iniziale della scheda. Si modifica da Impostazioni → Scheda Pro:
// questi valori servono solo come punto di partenza e per il "ripristina predefiniti".
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
    { id: 'tomba', label: 'Tomba', colore: '#8A6D3B', icona: 'tomba' },
    { id: 'cappella', label: 'Cappella', colore: '#7B4FA8', icona: 'cappella', contenitore: true },
    { id: 'colombaio', label: 'Colombaio', colore: '#1E8C8C', icona: 'colombaio', contenitore: true },
    { id: 'vuota', label: 'Vuota', colore: '#9AA6B2', icona: 'vuota' },
    { id: 'in_costruzione', label: 'In costruzione', colore: '#E07B22', icona: 'cantiere' },
  ],
  sezioni: [
    { id: 'flag', label: 'Flag e informazioni aggiuntive' },
    { id: 'fatturazione', label: 'Fatturazione e pagamenti' },
    { id: 'manufatto', label: 'Manufatto' },
  ],
  campi: [
    { id: 'lampada_votiva', label: 'Lampada votiva', tipo: 'flag', sezione: 'flag', icona: 'lampada', inFiltri: true, inTabella: true, inExport: true, inPopup: true, inApp: true },
    { id: 'tomba_singola', label: 'Tomba singola', tipo: 'flag', sezione: 'flag', icona: 'tomba', inFiltri: true, inTabella: false, inExport: true, inPopup: true, inApp: true },
    { id: 'cappella', label: 'Cappella', tipo: 'flag', sezione: 'flag', icona: 'cappella', inFiltri: true, inTabella: false, inExport: true, inPopup: true, inApp: true },
    { id: 'colombaio', label: 'Colombaio', tipo: 'flag', sezione: 'flag', icona: 'colombaio', inFiltri: true, inTabella: false, inExport: true, inPopup: true, inApp: true },
    {
      id: 'stato_pagamenti', label: 'Stato pagamenti', tipo: 'select', sezione: 'fatturazione',
      opzioni: [
        { id: 'regolare', label: 'Regolare', colore: '#3F9A3C' },
        { id: 'moroso', label: 'Moroso', colore: '#D9473F' },
        { id: 'in_verifica', label: 'In verifica', colore: '#E9BE1F' },
      ],
      inFiltri: true, inTabella: true, inExport: true, inPopup: false, inApp: false,
      aiuto: 'Situazione dei pagamenti di concessione e lampada votiva',
    },
    { id: 'canone_lampada', label: 'Canone lampada votiva', tipo: 'importo', sezione: 'fatturazione', unita: '€/anno', inFiltri: false, inTabella: false, inExport: true, inPopup: false, inApp: false },
    { id: 'codice_utenza', label: 'Codice utenza', tipo: 'testo', sezione: 'fatturazione', inFiltri: false, inTabella: false, inExport: true, inPopup: false, inApp: false },
    { id: 'intestatario_utenza', label: 'Intestatario utenza', tipo: 'testo', sezione: 'fatturazione', inFiltri: false, inTabella: false, inExport: true, inPopup: false, inApp: false },
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
      applicaA: ['loculo', 'tomba', 'cappella'],
    },
    {
      id: 'condizione_lapide', label: 'Condizione lapide', tipo: 'select', sezione: 'manufatto',
      opzioni: [
        { id: 'buona', label: 'Buona', colore: '#3F9A3C' },
        { id: 'discreta', label: 'Discreta', colore: '#E9BE1F' },
        { id: 'danneggiata', label: 'Danneggiata', colore: '#D9473F' },
      ],
      inFiltri: true, inTabella: false, inExport: true, inPopup: false, inApp: true,
      applicaA: ['loculo', 'tomba', 'cappella'],
    },
  ],
  categorieManutenzione: [
    { id: 'lapide_danneggiata', label: 'Lapide danneggiata' },
    { id: 'infiltrazioni', label: "Infiltrazioni d'acqua" },
    { id: 'lampada_guasta', label: 'Lampada votiva guasta' },
    { id: 'vegetazione', label: 'Vegetazione infestante' },
    { id: 'cedimento', label: 'Cedimento strutturale' },
    { id: 'pulizia', label: 'Pulizia straordinaria' },
  ],
  squadre: [
    { id: 'squadra_edile', label: 'Squadra edile' },
    { id: 'squadra_verde', label: 'Squadra verde' },
    { id: 'elettricista', label: 'Elettricista lampade votive' },
    { id: 'ditta_esterna', label: 'Ditta esterna' },
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
  { id: 'pianificata', label: 'Pianificata', colore: '#2F6FB3' },
  { id: 'in_corso', label: 'In corso', colore: '#E07B22' },
  { id: 'risolta', label: 'Risolta', colore: '#3F9A3C' },
] as const;

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
