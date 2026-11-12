import { useMemo } from 'react';
import { PRIORITA, UFFICIO } from '../config/defaults';
import { aggiungiGiorni, giorniTra, normalizza, oggiISO, nomeCompleto, numero } from '../lib/format';
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
    const op = ruolo === 'operatore' ? operatori.find((o) => o.id === sessione?.operatoreId) : undefined;
    const nome = op?.nome ?? (ruolo === 'operatore' ? 'Operatore' : UFFICIO);
    return {
      ruolo,
      operatoreId: op?.id ?? null,
      nome,
      etichettaRuolo: ruolo === 'amministratore' ? 'Amministratore' : ruolo === 'operatore' ? 'Operatore' : 'Cittadino',
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

export function statoConcessione(s: Scheda, oggi = oggiISO(), sogliaGiorni = 183): StatoConcessione | null {
  const c = s.concessione;
  if (!c) return null;
  const giorni = giorniTra(oggi, c.dataScadenza);
  if (giorni < 0) return { stato: 'scaduta', giorni };
  if (giorni <= sogliaGiorni) return { stato: 'in_scadenza', giorni };
  return { stato: 'valida', giorni };
}

// ---------------------------------------------------------------------------
// Filtri
// ---------------------------------------------------------------------------

function testoScheda(s: Scheda): string {
  const parti = [s.id, s.nomeManufatto ?? '', s.concessione?.intestatario ?? '', String(s.campi.codice_utenza ?? '')];
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
      if (f.concessione === 'senza' && s.concessione) return false;
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
// Alert: calcolati dai dati + creati a mano
// ---------------------------------------------------------------------------

export interface AlertItem {
  id: string;
  livello: 'urgente' | 'attenzione' | 'info';
  titolo: string;
  messaggio: string;
  data: string;
  link?: string;
  schedaId?: string;
  manuale?: boolean;
}

export function calcolaAlert(db: Database, config: ConfigScheda, cimiteroId: string, oggi = oggiISO()): AlertItem[] {
  const schede = schedeDelCimitero(db.schede, cimiteroId);
  const out: AlertItem[] = [];

  const scadute = schede.filter((s) => statoConcessione(s, oggi)?.stato === 'scaduta');
  if (scadute.length)
    out.push({ id: `conc-scadute-${scadute.length}`, livello: 'urgente', titolo: `${scadute.length} concessioni scadute`, messaggio: 'Da rinnovare o da avviare la procedura di decadenza.', data: oggi, link: '/report?vista=scadenze&periodo=scadute' });
  const entro30 = schede.filter((s) => {
    const c = statoConcessione(s, oggi);
    return c?.stato === 'in_scadenza' && c.giorni <= 30;
  });
  if (entro30.length)
    out.push({ id: `conc-30-${entro30.length}`, livello: 'attenzione', titolo: `${entro30.length} concessioni scadono entro 30 giorni`, messaggio: 'Avvisare gli intestatari per il rinnovo.', data: oggi, link: '/report?vista=scadenze&periodo=1' });

  const manut = db.manutenzioni.filter((m) => m.cimiteroId === cimiteroId && m.stato !== 'risolta');
  for (const m of manut.filter((x) => x.priorita === 'urgente'))
    out.push({ id: `man-urg-${m.id}`, livello: 'urgente', titolo: `Manutenzione urgente · ${labelLista(config.categorieManutenzione, m.categoria)}`, messaggio: `${m.schedaId}: ${m.descrizione}`, data: m.segnalataIl, link: `/manutenzioni?id=${m.id}`, schedaId: m.schedaId });
  const domani = aggiungiGiorni(oggi, 1);
  for (const m of manut.filter((x) => x.dataPianificata && x.dataPianificata >= oggi && x.dataPianificata <= domani))
    out.push({ id: `man-pian-${m.id}-${m.dataPianificata}`, livello: 'info', titolo: `Intervento ${m.dataPianificata === oggi ? 'oggi' : 'domani'} · ${labelLista(config.squadre, m.squadra)}`, messaggio: `${labelLista(config.categorieManutenzione, m.categoria)} su ${m.schedaId}`, data: m.dataPianificata!, link: `/manutenzioni?id=${m.id}`, schedaId: m.schedaId });

  const idsCim = new Set(schede.map((s) => s.id));
  const verScadute = db.verifiche.filter((v) => v.stato === 'aperta' && v.scadenza < oggi && idsCim.has(v.schedaId));
  if (verScadute.length)
    out.push({ id: `ver-scadute-${verScadute.length}`, livello: 'attenzione', titolo: `${verScadute.length} verifiche oltre la scadenza`, messaggio: 'Controlli assegnati e non ancora chiusi.', data: oggi, link: '/censimento?tab=verifiche' });

  const morosi = schede.filter((s) => s.campi.stato_pagamenti === 'moroso' && s.campi.lampada_votiva === true);
  if (morosi.length)
    out.push({ id: `morosi-${morosi.length}`, livello: 'info', titolo: `${morosi.length} utenze lampade votive morose`, messaggio: 'Elenco pronto per i solleciti in Report.', data: oggi, link: '/report?vista=lampade' });

  for (const a of db.alert) {
    const s = a.schedaId ? schede.find((x) => x.id === a.schedaId) : undefined;
    if (a.schedaId && !s) continue;
    out.push({
      id: a.id, livello: a.priorita === 'urgente' || a.priorita === 'alta' ? 'urgente' : a.priorita === 'media' ? 'attenzione' : 'info',
      titolo: a.titolo, messaggio: a.messaggio, data: a.data, schedaId: a.schedaId, manuale: true,
      link: a.manutenzioneId ? `/manutenzioni?id=${a.manutenzioneId}` : a.schedaId ? `/scheda/${a.schedaId}` : undefined,
    });
  }
  const peso = { urgente: 0, attenzione: 1, info: 2 };
  return out.sort((a, b) => peso[a.livello] - peso[b.livello] || b.data.localeCompare(a.data));
}

export function useAlert(): AlertItem[] {
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const id = useStore((s) => s.cimiteroId);
  return useMemo(() => calcolaAlert(db, config, id), [db, config, id]);
}

export function descrizioneScheda(s: Scheda): string {
  if (s.nomeManufatto) return s.nomeManufatto;
  if (s.defunti.length === 1) return nomeCompleto(s.defunti[0]);
  if (s.defunti.length > 1) return `${nomeCompleto(s.defunti[0])} e altri ${s.defunti.length - 1}`;
  return s.numeroPosto ? `${s.area ?? ''} · ${s.numeroPosto}`.trim() : 'Posto libero';
}

export function manutenzioniAperte(m: Manutenzione[]): Manutenzione[] {
  return m.filter((x) => x.stato !== 'risolta');
}
