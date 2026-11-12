import { create } from 'zustand';
import { CONFIG_DEFAULT, FILTRI_VUOTI, UFFICIO } from '../config/defaults';
import { adessoISO, oggiISO, slug } from '../lib/format';
import { quadranteDi, puntoNelPoligono } from '../lib/geo';
import { CHIAVI, cancellaTutto, leggi, salvaDopo } from './persist';
import type {
  AlertManuale, CampoDef, ConfigScheda, Database, Faccia, Filtri, LatLng, Manutenzione, Opzione,
  Operatore, Quadrante, Scheda, Sessione, StatoDef, StileMappa, Struttura, TipologiaDef, Verifica,
} from './types';

export interface Toast {
  id: number;
  testo: string;
  tipo: 'ok' | 'info' | 'errore';
}

interface UiState {
  selezionata: string | null;
  pannello: boolean;
  stileMappa: StileMappa;
  coloraPer: 'stato' | 'tipologia';
  parete: { strutturaId: string; schedaId?: string } | null;
  volaA: { lat: number; lng: number; zoom: number; n: number } | null;
  menuMobile: boolean;
  modale: Modale | null;
}

export type Modale =
  | { tipo: 'manutenzione'; schedaId?: string }
  | { tipo: 'verifica'; schedaId?: string }
  | { tipo: 'gps'; schedaId: string };

interface Stato {
  pronto: boolean;
  errore: string | null;
  db: Database;
  config: ConfigScheda;
  foto: Record<string, string>;
  cimiteroId: string;
  filtri: Filtri;
  ui: UiState;
  toasts: Toast[];
  sessione: Sessione | null;
}

/**
 * Versione della forma dei dati. Quando una fase la cambia, alla prima apertura la demo
 * ricarica da sola i dati dimostrativi (niente conversione dei dati vecchi nel browser).
 */
export const VERSIONE_DATI = 2;

const DB_VUOTO: Database = {
  versione: VERSIONE_DATI, cimiteri: [], quadranti: [], viali: [], aree: [], strutture: [], operatori: [], schede: [],
  manutenzioni: [], verifiche: [], alert: [], alertLetti: [], esportazioni: [],
};

const CHIAVE_SESSIONE = 'cimitera:sessione';
function leggiSessione(): Sessione | null {
  try {
    const t = window.localStorage.getItem(CHIAVE_SESSIONE);
    return t ? (JSON.parse(t) as Sessione) : null;
  } catch {
    return null;
  }
}

export const useStore = create<Stato>(() => ({
  pronto: false,
  errore: null,
  db: DB_VUOTO,
  config: CONFIG_DEFAULT,
  foto: {},
  cimiteroId: 'ragusa-centro',
  filtri: FILTRI_VUOTI,
  ui: {
    selezionata: null,
    pannello: false,
    stileMappa: 'satellite',
    coloraPer: 'stato',
    parete: null,
    volaA: null,
    menuMobile: false,
    modale: null,
  },
  toasts: [],
  sessione: leggiSessione(),
}));

const S = () => useStore.getState();
const setS = useStore.setState;

// ---------------------------------------------------------------------------
// Avvio e persistenza
// ---------------------------------------------------------------------------

async function caricaDemo(): Promise<Database> {
  const r = await fetch('./demo/salmup-demo.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Dataset dimostrativo non trovato (${r.status})`);
  const d = await r.json();
  return { ...DB_VUOTO, ...d, versione: VERSIONE_DATI, alertLetti: [], esportazioni: [] };
}

export async function avvia() {
  try {
    let [db, config, foto] = await Promise.all([
      leggi<Database>(CHIAVI.db),
      leggi<ConfigScheda>(CHIAVI.config),
      leggi<Record<string, string>>(CHIAVI.foto),
    ]);
    // dati salvati con una versione precedente: si riparte dai dati dimostrativi
    if (db && db.versione !== VERSIONE_DATI) {
      await cancellaTutto();
      db = undefined;
      config = undefined;
      foto = undefined;
      window.setTimeout(() => toast('CimiTera è stata aggiornata: ho ricaricato i dati dimostrativi', 'info'), 600);
    }
    const dati = db ?? (await caricaDemo());
    setS({
      db: { ...DB_VUOTO, ...dati },
      config: config ? { ...CONFIG_DEFAULT, ...config } : CONFIG_DEFAULT,
      foto: foto ?? {},
      pronto: true,
    });
    if (!db) salvaDopo(CHIAVI.db, dati, 50);
  } catch (e) {
    setS({ errore: (e as Error).message, pronto: true });
  }
  useStore.subscribe((s, prev) => {
    if (s.db !== prev.db) salvaDopo(CHIAVI.db, s.db);
    if (s.config !== prev.config) salvaDopo(CHIAVI.config, s.config);
    if (s.foto !== prev.foto) salvaDopo(CHIAVI.foto, s.foto);
  });
}

export async function ripristinaDemo() {
  await cancellaTutto();
  const dati = await caricaDemo();
  setS({ db: dati, config: CONFIG_DEFAULT, foto: {}, filtri: FILTRI_VUOTI });
  toast('Dati dimostrativi ripristinati');
}

export function esportaBackup(): string {
  const { db, config, foto } = S();
  return JSON.stringify({ app: 'CimiTera', esportatoIl: adessoISO(), db, config, foto });
}

export function importaBackup(testo: string) {
  const b = JSON.parse(testo);
  if (!['CimiTera', 'SALM-APP', 'SALM-UP'].includes(b?.app) || !b.db || !b.config) throw new Error('File non riconosciuto come backup di CimiTera');
  setS({ db: { ...DB_VUOTO, ...b.db }, config: { ...CONFIG_DEFAULT, ...b.config }, foto: b.foto ?? {} });
  toast('Backup importato');
}

// ---------------------------------------------------------------------------
// Ingresso per ruolo (demo: senza password)
// ---------------------------------------------------------------------------

export function entra(sessione: Sessione) {
  try { window.localStorage.setItem(CHIAVE_SESSIONE, JSON.stringify(sessione)); } catch { /* resta in memoria */ }
  setS({ sessione });
}

export function esci() {
  try { window.localStorage.removeItem(CHIAVE_SESSIONE); } catch { /* niente */ }
  setS((s) => ({ sessione: null, ui: { ...s.ui, selezionata: null, pannello: false, menuMobile: false, modale: null } }));
}

/** Nome di chi è entrato: firma lo storico, gli alert e il registro delle modifiche. */
export function utenteCorrente(): string {
  const { sessione, db } = S();
  if (sessione?.ruolo === 'operatore') return db.operatori.find((o) => o.id === sessione.operatoreId)?.nome ?? 'Operatore';
  return UFFICIO;
}

/** Valore di "rilevatoDa" e "segnalataDa": l'id dell'operatore entrato, oppure 'ufficio'. */
export function firmaCorrente(): string {
  const { sessione } = S();
  return sessione?.ruolo === 'operatore' && sessione.operatoreId ? sessione.operatoreId : 'ufficio';
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

let toastN = 0;
export function toast(testo: string, tipo: Toast['tipo'] = 'ok') {
  const id = ++toastN;
  setS((s) => ({ toasts: [...s.toasts, { id, testo, tipo }] }));
  window.setTimeout(() => setS((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3800);
}

export function setUi(patch: Partial<UiState>) {
  setS((s) => ({ ui: { ...s.ui, ...patch } }));
}

let voloN = 0;
export function volaA(lat: number, lng: number, zoom = 20) {
  setUi({ volaA: { lat, lng, zoom, n: ++voloN } });
}

/** Seleziona una scheda: apre il pannello laterale e (se richiesto) centra la mappa. */
export function seleziona(id: string | null, opts: { pannello?: boolean; vola?: boolean } = {}) {
  const { pannello = true, vola = false } = opts;
  setUi({ selezionata: id, pannello: !!id && pannello });
  if (id && vola) {
    const s = schedaPerId(id);
    if (s) volaA(s.lat, s.lng, 20);
  }
}

export function apriModale(m: Modale | null) {
  setUi({ modale: m });
}

/** Apre la griglia a parete di un colombaio o di una cappella (eventualmente su un loculo). */
export function apriParete(strutturaId: string | null, schedaId?: string) {
  setUi({ parete: strutturaId ? { strutturaId, schedaId } : null });
}

export function setCimitero(id: string) {
  setS((s) => ({ cimiteroId: id, filtri: FILTRI_VUOTI, ui: { ...s.ui, selezionata: null, pannello: false } }));
}

export function setFiltri(patch: Partial<Filtri> | ((f: Filtri) => Partial<Filtri>)) {
  setS((s) => ({ filtri: { ...s.filtri, ...(typeof patch === 'function' ? patch(s.filtri) : patch) } }));
}

export function resetFiltri(patch: Partial<Filtri> = {}) {
  setS({ filtri: { ...FILTRI_VUOTI, ...patch } });
}

// ---------------------------------------------------------------------------
// Indici (ricalcolati solo quando cambia l'array delle schede)
// ---------------------------------------------------------------------------

const cacheIndice = new WeakMap<Scheda[], Map<string, Scheda>>();
export function indiceSchede(schede: Scheda[]): Map<string, Scheda> {
  let m = cacheIndice.get(schede);
  if (!m) {
    m = new Map(schede.map((s) => [s.id, s]));
    cacheIndice.set(schede, m);
  }
  return m;
}

const cacheLoculi = new WeakMap<Scheda[], Map<string, Scheda[]>>();
export function loculiPerStruttura(schede: Scheda[]): Map<string, Scheda[]> {
  let m = cacheLoculi.get(schede);
  if (!m) {
    m = new Map();
    for (const s of schede) {
      if (s.posizione) {
        const l = m.get(s.posizione.strutturaId);
        if (l) l.push(s);
        else m.set(s.posizione.strutturaId, [s]);
      }
    }
    cacheLoculi.set(schede, m);
  }
  return m;
}

export function schedaPerId(id: string): Scheda | undefined {
  return indiceSchede(S().db.schede).get(id);
}

// ---------------------------------------------------------------------------
// Schede
// ---------------------------------------------------------------------------

function setDb(fn: (db: Database) => Partial<Database>) {
  setS((s) => ({ db: { ...s.db, ...fn(s.db) } }));
}

function evento(azione: string) {
  return { data: adessoISO(), utente: utenteCorrente(), azione };
}

export function aggiornaScheda(id: string, patch: Partial<Scheda>, azione?: string) {
  setDb((db) => ({
    schede: db.schede.map((s) =>
      s.id === id
        ? { ...s, ...patch, aggiornatoIl: adessoISO(), storico: azione ? [...(s.storico ?? []), evento(azione)] : s.storico }
        : s,
    ),
  }));
}

export function aggiornaCampo(id: string, campoId: string, valore: Scheda['campi'][string], label?: string) {
  const s = schedaPerId(id);
  if (!s) return;
  aggiornaScheda(id, { campi: { ...s.campi, [campoId]: valore } }, `${label ?? campoId}: ${descriviValore(valore)}`);
}

function descriviValore(v: unknown): string {
  if (v === true) return 'sì';
  if (v === false) return 'no';
  if (Array.isArray(v)) return v.join(', ') || 'vuoto';
  if (v === null || v === undefined || v === '') return 'vuoto';
  return String(v);
}

export function prossimoId(cimiteroId: string, db = S().db): string {
  const c = db.cimiteri.find((x) => x.id === cimiteroId);
  const pref = `CIM-${c?.codice ?? 'XXX'}-`;
  let max = 0;
  for (const s of db.schede) {
    if (s.id.startsWith(pref)) {
      const n = parseInt(s.id.slice(pref.length), 10);
      if (n > max) max = n;
    }
  }
  return `${pref}${String(max + 1).padStart(6, '0')}`;
}

export function creaScheda(dati: Omit<Scheda, 'id' | 'rilevatoIl' | 'aggiornatoIl' | 'storico'> & { id?: string }): Scheda {
  const id = dati.id ?? prossimoId(dati.cimiteroId);
  const ora = adessoISO();
  const s: Scheda = { ...dati, id, rilevatoIl: ora, aggiornatoIl: ora, storico: [evento('Scheda creata')] };
  setDb((db) => ({ schede: [...db.schede, s] }));
  return s;
}

export function aggiungiFoto(dataUrl: string): string {
  const id = `F-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  setS((s) => ({ foto: { ...s.foto, [id]: dataUrl } }));
  return id;
}

// ---------------------------------------------------------------------------
// Manutenzioni
// ---------------------------------------------------------------------------

export function creaManutenzione(m: Omit<Manutenzione, 'id' | 'segnalataIl' | 'stato'> & { stato?: Manutenzione['stato'] }) {
  const anno = new Date().getFullYear();
  const n = S().db.manutenzioni.filter((x) => x.id.startsWith(`MAN-${anno}-`)).length + 1;
  const nuova: Manutenzione = { ...m, id: `MAN-${anno}-${String(n).padStart(4, '0')}`, segnalataIl: oggiISO(), stato: m.stato ?? 'aperta' };
  setDb((db) => ({ manutenzioni: [...db.manutenzioni, nuova] }));
  const s = schedaPerId(m.schedaId);
  if (s && s.stato !== 'da_manutenzionare') aggiornaScheda(s.id, { stato: 'da_manutenzionare' }, `Segnalata manutenzione ${nuova.id}`);
  return nuova;
}

export function aggiornaManutenzione(id: string, patch: Partial<Manutenzione>) {
  setDb((db) => ({ manutenzioni: db.manutenzioni.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
}

export function risolviManutenzione(id: string, fotoId: string, note: string) {
  const m = S().db.manutenzioni.find((x) => x.id === id);
  if (!m) return;
  aggiornaManutenzione(id, { stato: 'risolta', risoltaIl: oggiISO(), fotoRisoluzione: fotoId, noteRisoluzione: note });
  const altreAperte = S().db.manutenzioni.some((x) => x.schedaId === m.schedaId && x.id !== id && x.stato !== 'risolta');
  const s = schedaPerId(m.schedaId);
  if (s && s.stato === 'da_manutenzionare' && !altreAperte) {
    aggiornaScheda(s.id, { stato: s.defunti.length || s.strutturaId ? 'occupato' : 'libero', fotoId }, `Manutenzione ${id} risolta, foto aggiornata`);
  } else if (s) {
    aggiornaScheda(s.id, { fotoId }, `Manutenzione ${id} risolta, foto aggiornata`);
  }
}

// ---------------------------------------------------------------------------
// Verifiche (controlli assegnati agli operatori)
// ---------------------------------------------------------------------------

export function creaVerifica(v: Omit<Verifica, 'id' | 'assegnataIl' | 'stato'>, segnaDaVerificare: boolean) {
  const n = S().db.verifiche.length + 1;
  const nuova: Verifica = { ...v, id: `VER-${String(n).padStart(4, '0')}`, assegnataIl: oggiISO(), stato: 'aperta' };
  setDb((db) => ({ verifiche: [...db.verifiche, nuova] }));
  const op = S().db.operatori.find((o) => o.id === v.operatoreId);
  aggiornaScheda(v.schedaId, segnaDaVerificare ? { stato: 'da_verificare' } : {}, `Verifica ${nuova.id} assegnata a ${op?.nome ?? 'operatore'}`);
  return nuova;
}

export function completaVerifica(id: string, esito: NonNullable<Verifica['esito']>, noteEsito: string, nuovoStato?: string) {
  const v = S().db.verifiche.find((x) => x.id === id);
  if (!v) return;
  setDb((db) => ({
    verifiche: db.verifiche.map((x) => (x.id === id ? { ...x, stato: 'completata', esito, noteEsito, completataIl: oggiISO() } : x)),
  }));
  aggiornaScheda(v.schedaId, nuovoStato ? { stato: nuovoStato } : {}, `Verifica ${id} completata: ${esito}`);
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export function creaAlert(a: Omit<AlertManuale, 'id' | 'creatoDa'>) {
  const n = S().db.alert.length + 1;
  const nuovo: AlertManuale = { ...a, id: `AL-${String(n).padStart(4, '0')}-${Date.now().toString(36).slice(-3)}`, creatoDa: utenteCorrente() };
  setDb((db) => ({ alert: [nuovo, ...db.alert] }));
  toast('Alert creato');
  return nuovo;
}

export function eliminaAlert(id: string) {
  setDb((db) => ({ alert: db.alert.filter((a) => a.id !== id) }));
}

export function segnaLetti(ids: string[]) {
  setDb((db) => ({ alertLetti: Array.from(new Set([...db.alertLetti, ...ids])) }));
}

// ---------------------------------------------------------------------------
// Quadranti, operatori, strutture
// ---------------------------------------------------------------------------

function riassegnaQuadranti(db: Database, cimiteroId: string, quadranti: Quadrante[]): Scheda[] {
  const qs = quadranti.filter((q) => q.cimiteroId === cimiteroId);
  return db.schede.map((s) => {
    if (s.cimiteroId !== cimiteroId) return s;
    const q = quadranteDi([s.lat, s.lng], qs);
    const id = q?.id ?? null;
    return id === (s.quadranteId ?? null) ? s : { ...s, quadranteId: id };
  });
}

export function creaQuadrante(q: Omit<Quadrante, 'id'>) {
  const db = S().db;
  const id = `q-${slug(q.codice)}-${Date.now().toString(36).slice(-4)}`;
  const nuovo = { ...q, id };
  // il nuovo quadrante ha la precedenza sui punti che contiene
  const altri = db.quadranti.filter((x) => x.cimiteroId === q.cimiteroId);
  const quadranti = [...db.quadranti, nuovo];
  const ordinati = [nuovo, ...altri];
  setDb((d) => ({ quadranti, schede: riassegnaQuadranti(d, q.cimiteroId, ordinati) }));
  return nuovo;
}

export function aggiornaQuadrante(id: string, patch: Partial<Quadrante>) {
  setDb((db) => {
    const quadranti = db.quadranti.map((q) => (q.id === id ? { ...q, ...patch } : q));
    const q = quadranti.find((x) => x.id === id)!;
    return patch.poligono ? { quadranti, schede: riassegnaQuadranti(db, q.cimiteroId, quadranti) } : { quadranti };
  });
}

export function eliminaQuadrante(id: string) {
  setDb((db) => {
    const q = db.quadranti.find((x) => x.id === id);
    const quadranti = db.quadranti.filter((x) => x.id !== id);
    return { quadranti, schede: q ? riassegnaQuadranti(db, q.cimiteroId, quadranti) : db.schede };
  });
}

export function contaNelPoligono(poly: LatLng[], cimiteroId: string): number {
  return S().db.schede.filter((s) => s.cimiteroId === cimiteroId && puntoNelPoligono([s.lat, s.lng], poly)).length;
}

export function salvaOperatore(o: Operatore) {
  setDb((db) => ({
    operatori: db.operatori.some((x) => x.id === o.id) ? db.operatori.map((x) => (x.id === o.id ? o : x)) : [...db.operatori, o],
  }));
}

export function creaStruttura(dati: {
  cimiteroId: string; tipo: Struttura['tipo']; nome: string; lat: number; lng: number; facce: Faccia[];
  viale: string; quadranteId: string | null;
}) {
  const db = S().db;
  const n = db.strutture.length + 1;
  const sid = `STR-${String(n).padStart(3, '0')}-${Date.now().toString(36).slice(-3)}`;
  const maxCol = Math.max(...dati.facce.map((f) => f.colonne));
  const lung = dati.tipo === 'colombaio' ? Math.max(4, maxCol * 0.9) : 5;
  const larg = dati.tipo === 'colombaio' ? (dati.facce.length > 1 ? 2.6 : 1.2) : 4;
  const dLat = larg / 2 / 111320;
  const dLng = lung / 2 / (111320 * Math.cos((dati.lat * Math.PI) / 180));
  const impronta: LatLng[] = [
    [dati.lat - dLat, dati.lng - dLng], [dati.lat - dLat, dati.lng + dLng], [dati.lat + dLat, dati.lng + dLng], [dati.lat + dLat, dati.lng - dLng],
  ];
  const tipoLabel = dati.tipo === 'colombaio' ? 'colombaio' : 'cappella';
  let idx = 0;
  const base = prossimoId(dati.cimiteroId);
  const pref = base.slice(0, base.lastIndexOf('-') + 1);
  let num = parseInt(base.slice(pref.length), 10);
  const nuovoId = () => `${pref}${String(num++).padStart(6, '0')}`;
  const ora = adessoISO();
  const contenitore: Scheda = {
    id: nuovoId(), cimiteroId: dati.cimiteroId, tipologia: tipoLabel, stato: 'libero', lat: dati.lat, lng: dati.lng,
    viale: dati.viale, quadranteId: dati.quadranteId, defunti: [], concessione: null,
    campi: {},
    rilevatoDa: 'ufficio', rilevatoIl: ora, aggiornatoIl: ora, nomeManufatto: dati.nome, strutturaId: sid,
    storico: [evento(`Struttura creata con ${dati.facce.reduce((t, f) => t + f.righe * f.colonne, 0)} posti`)],
  };
  const loculi: Scheda[] = [];
  dati.facce.forEach((f, fi) => {
    for (let fila = 1; fila <= f.righe; fila++)
      for (let col = 1; col <= f.colonne; col++) {
        idx++;
        loculi.push({
          id: nuovoId(), cimiteroId: dati.cimiteroId, tipologia: 'loculo', stato: 'libero', lat: dati.lat, lng: dati.lng,
          viale: dati.viale, quadranteId: dati.quadranteId, defunti: [], concessione: null,
          campi: { lampada_votiva: false },
          rilevatoDa: 'ufficio', rilevatoIl: ora, aggiornatoIl: ora,
          posizione: { strutturaId: sid, faccia: fi, fila, colonna: col }, storico: [evento('Posto generato con la struttura')],
        });
      }
  });
  const struttura: Struttura = {
    id: sid, cimiteroId: dati.cimiteroId, tipo: dati.tipo, nome: dati.nome, schedaId: contenitore.id, lat: dati.lat, lng: dati.lng,
    angolo: 0, lunghezzaM: lung, larghezzaM: larg, impronta, facce: dati.facce, viale: dati.viale, quadranteId: dati.quadranteId ?? '',
  };
  setDb((d) => ({ strutture: [...d.strutture, struttura], schede: [...d.schede, contenitore, ...loculi] }));
  toast(`${dati.nome} creata con ${idx} posti`);
  return struttura;
}

export function registraEsportazione(tipo: string, righe: number) {
  setDb((db) => ({ esportazioni: [{ data: adessoISO(), tipo, righe }, ...db.esportazioni].slice(0, 30) }));
}

// ---------------------------------------------------------------------------
// Configurazione della scheda ("Scheda Pro")
// ---------------------------------------------------------------------------

export function setConfig(fn: (c: ConfigScheda) => Partial<ConfigScheda>, descrizione: string) {
  setS((s) => {
    const patch = fn(s.config);
    return {
      config: {
        ...s.config,
        ...patch,
        versione: s.config.versione + 1,
        registro: [{ data: adessoISO(), utente: utenteCorrente(), descrizione }, ...s.config.registro].slice(0, 200),
      },
    };
  });
}

export function idCampoLibero(label: string, config = S().config): string {
  const base = slug(label);
  let id = base;
  let i = 2;
  while (config.campi.some((c) => c.id === id)) id = `${base}_${i++}`;
  return id;
}

export function aggiungiCampo(c: CampoDef) {
  setConfig((cfg) => ({ campi: [...cfg.campi, c] }), `Aggiunto il campo "${c.label}"`);
}

export function modificaCampo(id: string, patch: Partial<CampoDef>, descrizione: string) {
  setConfig((cfg) => ({ campi: cfg.campi.map((c) => (c.id === id ? { ...c, ...patch } : c)) }), descrizione);
}

export function spostaCampo(id: string, dir: -1 | 1) {
  const campi = [...S().config.campi];
  const i = campi.findIndex((c) => c.id === id);
  const sez = campi[i].sezione;
  let j = i + dir;
  while (j >= 0 && j < campi.length && campi[j].sezione !== sez) j += dir;
  if (j < 0 || j >= campi.length) return;
  [campi[i], campi[j]] = [campi[j], campi[i]];
  setConfig(() => ({ campi }), `Spostato il campo "${campi[j].label}"`);
}

export function usiCampo(id: string): number {
  return S().db.schede.reduce((n, s) => {
    const v = s.campi[id];
    return n + (v !== undefined && v !== null && v !== '' && v !== false && !(Array.isArray(v) && !v.length) ? 1 : 0);
  }, 0);
}

export function eliminaCampo(id: string) {
  const c = S().config.campi.find((x) => x.id === id);
  setConfig((cfg) => ({ campi: cfg.campi.filter((x) => x.id !== id) }), `Eliminato il campo "${c?.label}"`);
  setDb((db) => ({
    schede: db.schede.map((s) => {
      if (!(id in s.campi)) return s;
      const campi = { ...s.campi };
      delete campi[id];
      return { ...s, campi };
    }),
  }));
}

export function usiOpzione(campoId: string, opzioneId: string): number {
  return S().db.schede.filter((s) => {
    const v = s.campi[campoId];
    return Array.isArray(v) ? v.includes(opzioneId) : v === opzioneId;
  }).length;
}

/** Sostituisce nei dati un'opzione con un'altra (o la svuota) prima di eliminarla. */
export function sostituisciOpzione(campoId: string, da: string, a: string | null) {
  setDb((db) => ({
    schede: db.schede.map((s) => {
      const v = s.campi[campoId];
      if (Array.isArray(v)) {
        if (!v.includes(da)) return s;
        const nv = Array.from(new Set(v.map((x) => (x === da ? a : x)).filter(Boolean) as string[]));
        return { ...s, campi: { ...s.campi, [campoId]: nv } };
      }
      if (v !== da) return s;
      return { ...s, campi: { ...s.campi, [campoId]: a } };
    }),
  }));
}

export function salvaOpzioni(campoId: string, opzioni: Opzione[], descrizione: string) {
  modificaCampo(campoId, { opzioni }, descrizione);
}

export function usiStato(id: string): number {
  return S().db.schede.filter((s) => s.stato === id).length;
}

export function usiTipologia(id: string): number {
  return S().db.schede.filter((s) => s.tipologia === id).length;
}

export function salvaStati(stati: StatoDef[], descrizione: string) {
  setConfig(() => ({ stati }), descrizione);
}

export function salvaTipologie(tipologie: TipologiaDef[], descrizione: string) {
  setConfig(() => ({ tipologie }), descrizione);
}

export function riassegnaStato(da: string, a: string) {
  setDb((db) => ({ schede: db.schede.map((s) => (s.stato === da ? { ...s, stato: a } : s)) }));
}

export function riassegnaTipologia(da: string, a: string) {
  setDb((db) => ({ schede: db.schede.map((s) => (s.tipologia === da ? { ...s, tipologia: a } : s)) }));
}

export function salvaListaConfig(chiave: 'categorieManutenzione' | 'squadre' | 'motiviVerifica', lista: Opzione[], descrizione: string) {
  setConfig(() => ({ [chiave]: lista }) as Partial<ConfigScheda>, descrizione);
}

export function salvaViali(cimiteroId: string, nomi: { id: string; nome: string }[]) {
  setDb((db) => {
    const vecchi = new Map(db.viali.filter((v) => v.cimiteroId === cimiteroId).map((v) => [v.id, v]));
    const rinominati = new Map<string, string>();
    const nuovi = nomi.map((n) => {
      const v = vecchi.get(n.id);
      if (v && v.nome !== n.nome) rinominati.set(v.nome, n.nome);
      return v ? { ...v, nome: n.nome } : { id: n.id, cimiteroId, nome: n.nome, tracciato: [] };
    });
    return {
      viali: [...db.viali.filter((v) => v.cimiteroId !== cimiteroId), ...nuovi],
      schede: rinominati.size
        ? db.schede.map((s) => (s.cimiteroId === cimiteroId && rinominati.has(s.viale) ? { ...s, viale: rinominati.get(s.viale)! } : s))
        : db.schede,
      strutture: rinominati.size
        ? db.strutture.map((s) => (s.cimiteroId === cimiteroId && rinominati.has(s.viale) ? { ...s, viale: rinominati.get(s.viale)! } : s))
        : db.strutture,
    };
  });
}
