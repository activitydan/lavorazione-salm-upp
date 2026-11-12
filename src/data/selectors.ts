import { useMemo } from 'react';
import { PRIORITA, TIPOLOGIA_STRUTTURA, UFFICIO } from '../config/defaults';
import { aggiungiGiorni, aggiungiMesi, giorniTra, normalizza, oggiISO, nomeCompleto, numero } from '../lib/format';
import { concessioneDi, nomiConcessionari } from './concessioni';
import { loculiPerStruttura, useStore } from './store';
import type { CampoDef, ConfigScheda, Database, Filtri, Manutenzione, Opzione, Scheda, ValoreCampo } from './types';

// ---------------------------------------------------------------------------
// Hook di comodo
// ---------------------------------------------------------------------------

/** Chi è entrato: ruolo, nome da mostrare, colore e sigla dell'avatar. */
export function useUtente() {
  const sessione = useStore((s) => s.sessione);
  const operatori = useStore((s) => s.db.operatori);
  return useMemo(() => {
    const ruolo = sessione?.ruolo ?? 'amministratore';
    const op = sessione?.operatoreId ? operatori.find((o) => o.id === sessione.operatoreId) : undefined;
    const nome = op?.nome ?? (ruolo === 'operatore' ? 'Operatore' : UFFICIO);
    return {
      ruolo,
      operatoreId: op?.id ?? null,
      nome,
      etichettaRuolo: ruolo === 'amministratore' ? 'Amministratore' : 'Operatore',
      colore: op?.colore ?? '#0A2F55',
      sigla: nome.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
      amministratore: ruolo === 'amministratore',
    };
  }, [sessione, operatori]);
}

export function useCimitero() {
  const cimiteri = useStore((s) => s.db.cimiteri);
  const id = useStore((s) => s.cimiteroId);
  return cimiteri.find((c) => c.id === id) ?? cimiteri[0];
}

const cacheSchedeCim = new WeakMap<Scheda[], Map<string, Scheda[]>>();
export function schedeDelCimitero(schede: Scheda[], cimiteroId: string): Scheda[] {
  let m = cacheSchedeCim.get(schede);
  if (!m) {
    m = new Map();
    cacheSchedeCim.set(schede, m);
  }
  let l = m.get(cimiteroId);
  if (!l) {
    l = schede.filter((s) => s.cimiteroId === cimiteroId);
    m.set(cimiteroId, l);
  }
  return l;
}

export function useSchedeCimitero(): Scheda[] {
  const schede = useStore((s) => s.db.schede);
  const id = useStore((s) => s.cimiteroId);
  return schedeDelCimitero(schede, id);
}

export function useDatiCimitero() {
  const db = useStore((s) => s.db);
  const id = useStore((s) => s.cimiteroId);
  return useMemo(
    () => ({
      quadranti: db.quadranti.filter((q) => q.cimiteroId === id),
      viali: db.viali.filter((v) => v.cimiteroId === id),
      aree: db.aree.filter((a) => a.cimiteroId === id),
      strutture: db.strutture.filter((s) => s.cimiteroId === id),
      manutenzioni: db.manutenzioni.filter((m) => m.cimiteroId === id),
    }),
    [db.quadranti, db.viali, db.aree, db.strutture, db.manutenzioni, id],
  );
}

/** Schede filtrate con i filtri globali (Mappa, Ricerca, Esportazioni). */
export function useSchedeFiltrate(): Scheda[] {
  const schede = useSchedeCimitero();
  const filtri = useStore((s) => s.filtri);
  const config = useStore((s) => s.config);
  const strutture = useStore((s) => s.db.strutture);
  return useMemo(() => filtraSchede(schede, filtri, config, strutture), [schede, filtri, config, strutture]);
}

// ---------------------------------------------------------------------------
// Etichette e colori dalla configurazione
// ---------------------------------------------------------------------------

export function statoDef(config: ConfigScheda, id: string) {
  return config.stati.find((s) => s.id === id) ?? { id, label: id, colore: '#9AA6B2' };
}

export function tipologiaDef(config: ConfigScheda, id: string) {
  if (id === TIPOLOGIA_STRUTTURA.id) return TIPOLOGIA_STRUTTURA;
  return config.tipologie.find((t) => t.id === id) ?? { id, label: id, colore: '#9AA6B2', icona: 'loculo' };
}

export function opzioneDef(campo: CampoDef, id: string): Opzione | undefined {
  return campo.opzioni?.find((o) => o.id === id);
}

export function labelLista(lista: Opzione[], id?: string): string {
  if (!id) return '—';
  return lista.find((o) => o.id === id)?.label ?? id;
}

export function prioritaDef(id: string) {
  return PRIORITA.find((p) => p.id === id) ?? PRIORITA[1];
}

export function valoreLeggibile(campo: CampoDef, v: ValoreCampo): string {
  if (v === undefined || v === null || v === '') return '—';
  switch (campo.tipo) {
    case 'flag':
      return v ? 'Sì' : 'No';
    case 'select':
      return opzioneDef(campo, String(v))?.label ?? String(v);
    case 'multiselect':
      return Array.isArray(v) && v.length ? v.map((x) => opzioneDef(campo, x)?.label ?? x).join(', ') : '—';
    case 'importo':
      return typeof v === 'number' ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v) + (campo.unita?.includes('anno') ? '/anno' : '') : String(v);
    case 'numero':
      return typeof v === 'number' ? numero(v) + (campo.unita ? ` ${campo.unita}` : '') : String(v);
    case 'data':
      return String(v).split('-').reverse().join('/');
    default:
      return String(v);
  }
}

/** Campi attivi (non archiviati) che si applicano alla tipologia della scheda. */
export function campiPer(config: ConfigScheda, tipologia?: string, filtro?: (c: CampoDef) => boolean): CampoDef[] {
  return config.campi.filter(
    (c) => !c.archiviato && (!tipologia || !c.applicaA?.length || c.applicaA.includes(tipologia)) && (!filtro || filtro(c)),
  );
}

// ---------------------------------------------------------------------------
// Concessioni
// ---------------------------------------------------------------------------

export type StatoConcessione = { stato: 'valida' | 'in_scadenza' | 'scaduta'; giorni: number };

/** Il contratto in corso della scheda, nella forma breve che serve a elenchi, filtri, Excel e PDF. */
export interface ConcessioneVista {
  id: string;
  numero: string;
  /** il rappresentante, o l'unico concessionario */
  concessionario: string;
  decorrenza: string;
  scadenza: string;
  durataAnni: number;
  rinnovi: number;
  inDecadenza: boolean;
}

export function concessioneScheda(s: Scheda): ConcessioneVista | null {
  const c = concessioneDi(s.id);
  if (!c) return null;
  return {
    id: c.id, numero: c.numero, concessionario: nomiConcessionari(c), decorrenza: c.decorrenza, scadenza: c.scadenza,
    durataAnni: c.durataAnni, rinnovi: c.rinnovi, inDecadenza: c.stato === 'in_decadenza',
  };
}

export function statoConcessione(s: Scheda, oggi = oggiISO()): StatoConcessione | null {
  const c = concessioneDi(s.id);
  if (!c) return null;
  const giorni = giorniTra(oggi, c.scadenza);
  if (giorni < 0) return { stato: 'scaduta', giorni };
  if (c.scadenza <= aggiungiMesi(oggi, useStore.getState().db.regole.concessioni.sogliaInScadenzaMesi)) return { stato: 'in_scadenza', giorni };
  return { stato: 'valida', giorni };
}

// ---------------------------------------------------------------------------
// Filtri
// ---------------------------------------------------------------------------

function testoScheda(s: Scheda): string {
  const parti = [s.id, s.nomeManufatto ?? '', concessioneScheda(s)?.concessionario ?? '', String(s.campi.codice_utenza ?? '')];
  for (const d of s.defunti) parti.push(`${d.nome} ${d.cognome}`, `${d.cognome} ${d.nome}`);
  return normalizza(parti.join(' | '));
}

const cacheTesto = new WeakMap<Scheda, string>();
export function testoRicerca(s: Scheda): string {
  let t = cacheTesto.get(s);
  if (t === undefined) {
    t = testoScheda(s);
    cacheTesto.set(s, t);
  }
  return t;
}

export function contaFiltriAttivi(f: Filtri): number {
  let n = 0;
  if (f.nominativo.trim()) n++;
  if (f.id.trim()) n++;
  if (f.dataMorteDa || f.dataMorteA) n++;
  n += f.stati.length ? 1 : 0;
  n += f.tipologie.length ? 1 : 0;
  n += f.quadranti.length ? 1 : 0;
  n += f.viali.length ? 1 : 0;
  if (f.strutture !== 'tutte') n++;
  if (f.concessione !== 'tutte') n++;
  for (const v of Object.values(f.campi)) if (filtroCampoAttivo(v)) n++;
  return n;
}

function filtroCampoAttivo(v: Filtri['campi'][string] | undefined): boolean {
  if (v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.values(v).some((x) => x !== undefined && x !== '');
  return true;
}

export function filtraSchede(schede: Scheda[], f: Filtri, config: ConfigScheda, strutture: Database['strutture'], oggi = oggiISO()): Scheda[] {
  if (contaFiltriAttivi(f) === 0) return schede;
  const nom = normalizza(f.nominativo);
  const parole = nom.split(/\s+/).filter(Boolean);
  const idq = f.id.trim().toUpperCase();
  const tipoStruttura = new Map(strutture.map((s) => [s.id, s.tipo]));
  const campi = config.campi.filter((c) => filtroCampoAttivo(f.campi[c.id]));
  const stati = new Set(f.stati);
  const tipologie = new Set(f.tipologie);
  const quadranti = new Set(f.quadranti);
  const viali = new Set(f.viali);
  return schede.filter((s) => {
    if (parole.length) {
      const t = testoRicerca(s);
      if (!parole.every((p) => t.includes(p))) return false;
    }
    if (idq && !s.id.toUpperCase().includes(idq)) return false;
    if (f.dataMorteDa || f.dataMorteA) {
      const ok = s.defunti.some((d) => d.dataMorte && (!f.dataMorteDa || d.dataMorte >= f.dataMorteDa) && (!f.dataMorteA || d.dataMorte <= f.dataMorteA));
      if (!ok) return false;
    }
    if (stati.size && !stati.has(s.stato)) return false;
    if (tipologie.size && !tipologie.has(s.tipologia)) return false;
    if (quadranti.size && !quadranti.has(s.quadranteId ?? '')) return false;
    if (viali.size && !viali.has(s.viale)) return false;
    if (f.strutture !== 'tutte') {
      const tipo = s.strutturaId ? tipoStruttura.get(s.strutturaId) : s.posizione ? tipoStruttura.get(s.posizione.strutturaId) : undefined;
      if ((f.strutture === 'colombari' && tipo !== 'colombaio') || (f.strutture === 'cappelle' && tipo !== 'cappella')) return false;
    }
    if (f.concessione !== 'tutte') {
      const sc = statoConcessione(s, oggi);
      if (f.concessione === 'senza' && sc) return false;
      if (f.concessione === 'in_scadenza' && sc?.stato !== 'in_scadenza') return false;
      if (f.concessione === 'scadute' && sc?.stato !== 'scaduta') return false;
    }
    for (const c of campi) {
      const fv = f.campi[c.id];
      const v = s.campi[c.id];
      if (c.tipo === 'flag') {
        if (fv === 'si' && v !== true) return false;
        if (fv === 'no' && v === true) return false;
      } else if (c.tipo === 'select' || c.tipo === 'multiselect') {
        const sel = fv as string[];
        const vals = Array.isArray(v) ? v : v ? [String(v)] : [];
        if (!sel.some((x) => vals.includes(x))) return false;
      } else if (c.tipo === 'numero' || c.tipo === 'importo') {
        const r = fv as { min?: number; max?: number };
        if (typeof v !== 'number') return false;
        if (r.min !== undefined && v < r.min) return false;
        if (r.max !== undefined && v > r.max) return false;
      } else if (c.tipo === 'data') {
        const r = fv as { da?: string; a?: string };
        if (!v) return false;
        if (r.da && String(v) < r.da) return false;
        if (r.a && String(v) > r.a) return false;
      } else {
        if (!normalizza(String(v ?? '')).includes(normalizza(String(fv)))) return false;
      }
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Statistiche
// ---------------------------------------------------------------------------

export function conta<T>(lista: T[], chiave: (x: T) => string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const x of lista) {
    const k = chiave(x);
    r[k] = (r[k] ?? 0) + 1;
  }
  return r;
}

export function occupazioneStruttura(schede: Scheda[], strutturaId: string) {
  const loculi = loculiPerStruttura(schede).get(strutturaId) ?? [];
  const occupati = loculi.filter((l) => l.defunti.length > 0).length;
  return { totale: loculi.length, occupati, liberi: loculi.length - occupati, loculi };
}

// ---------------------------------------------------------------------------
// Alert della campanella: personali
// ---------------------------------------------------------------------------

export interface AlertItem {
  id: string;
  livello: 'urgente' | 'attenzione' | 'info';
  titolo: string;
  messaggio: string;
  data: string;
  link?: string;
}

/**
 * Gli alert di una persona (id dell'operatore oppure 'ufficio'): quelli che ha ricevuto,
 * più quelli calcolati su ciò che le è assegnato. Nessuno riceve alert generali.
 */
export function alertPersonali(db: Database, config: ConfigScheda, chi: string, oggi = oggiISO()): AlertItem[] {
  const out: AlertItem[] = db.alert.filter((a) => a.destinatario === chi).map((a) => ({ id: a.id, livello: a.livello, titolo: a.titolo, messaggio: a.messaggio, data: a.data, link: a.link }));
  const domani = aggiungiGiorni(oggi, 1);
  for (const m of db.manutenzioni) {
    if (m.stato !== 'programmata' || !m.dataProgrammata || !m.operatoriIds?.includes(chi)) continue;
    if (m.dataProgrammata !== oggi && m.dataProgrammata !== domani) continue;
    const eOggi = m.dataProgrammata === oggi;
    out.push({
      id: `man-${m.id}-${m.dataProgrammata}-${chi}`, livello: eOggi ? 'attenzione' : 'info', titolo: `Manutenzione di ${eOggi ? 'oggi' : 'domani'}`,
      messaggio: `${labelLista(config.categorieManutenzione, m.categoria)} · ${m.schedaId}`, data: m.dataProgrammata, link: `/manutenzioni?id=${m.id}`,
    });
  }
  const mie = db.verifiche.filter((v) => v.stato === 'aperta' && v.operatoreId === chi);
  const inRitardo = mie.filter((v) => v.scadenza < oggi).length;
  const vicine = mie.filter((v) => v.scadenza === oggi || v.scadenza === domani).length;
  if (inRitardo)
    out.push({ id: `ver-ritardo-${chi}-${inRitardo}`, livello: 'urgente', titolo: inRitardo === 1 ? 'Una tua verifica è in ritardo' : `${inRitardo} tue verifiche sono in ritardo`, messaggio: 'Controlli assegnati a te e non ancora chiusi.', data: oggi, link: '/censimento?tab=verifiche' });
  if (vicine)
    out.push({ id: `ver-vicine-${chi}-${oggi}-${vicine}`, livello: 'attenzione', titolo: vicine === 1 ? 'Una tua verifica scade oggi o domani' : `${vicine} tue verifiche scadono oggi o domani`, messaggio: 'Chiudile dalla voce Verifiche.', data: oggi, link: '/censimento?tab=verifiche' });
  const peso = { urgente: 0, attenzione: 1, info: 2 };
  return out.sort((a, b) => b.data.slice(0, 10).localeCompare(a.data.slice(0, 10)) || peso[a.livello] - peso[b.livello] || b.data.localeCompare(a.data));
}

/** Gli alert di chi è entrato. */
export function useAlert(): AlertItem[] {
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const utente = useUtente();
  const chi = utente.operatoreId ?? 'ufficio';
  return useMemo(() => alertPersonali(db, config, chi), [db, config, chi]);
}

export function descrizioneScheda(s: Scheda): string {
  if (s.nomeManufatto) return s.nomeManufatto;
  if (s.defunti.length === 1) return nomeCompleto(s.defunti[0]);
  if (s.defunti.length > 1) return `${nomeCompleto(s.defunti[0])} e altri ${s.defunti.length - 1}`;
  return s.numeroPosto ? `${s.area ?? ''} · ${s.numeroPosto}`.trim() : 'Posto libero';
}

/** Le manutenzioni ancora da fare: né risolte né annullate. */
export function manutenzioniAperte(m: Manutenzione[]): Manutenzione[] {
  return m.filter((x) => x.stato !== 'risolta' && x.stato !== 'annullata');
}
