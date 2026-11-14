// Pratica: il fascicolo di una sola operazione cimiteriale su un solo defunto, dalla richiesta
// (o dall'avvio d'ufficio) fino all'esecuzione. Quando è eseguita, CimiTera aggiorna da sola le schede.
import { adessoISO, data, nomeCompleto, oggiISO } from '../lib/format';
import { aggiornaDb, aggiornaScheda, avvisa, firmaCorrente, leggiStato, registra, schedaPerId, toast } from './store';
import type { AgenziaFunebre, Defunto, DestinazioneResti, Pratica, RegoleComune, Richiedente, RichiestaAgenzia, Scheda, TipoOperazione } from './types';
import { annullaAvvisiDellaPratica, emettiAvviso } from './scadenze';
import { chiudiUtenzePerDefunto, spostaUtenza } from './utenze';

export const NOMI_OPERAZIONE: Record<TipoOperazione, string> = {
  inumazione: 'Inumazione', tumulazione: 'Tumulazione', esumazione: 'Esumazione', estumulazione: 'Estumulazione', traslazione: 'Traslazione',
};
export const TIPI_OPERAZIONE = Object.keys(NOMI_OPERAZIONE) as TipoOperazione[];
export const COLORI_OPERAZIONE: Record<TipoOperazione, string> = {
  inumazione: '#5E9A3A', tumulazione: '#2F6FB3', esumazione: '#B8860B', estumulazione: '#E07B22', traslazione: '#8E5BB5',
};
export const STATI_PRATICA = [
  { id: 'aperta', label: 'Aperta', colore: '#D9473F' },
  { id: 'programmata', label: 'Programmata', colore: '#2F6FB3' },
  { id: 'eseguita', label: 'Eseguita', colore: '#3F9A3C' },
  { id: 'annullata', label: 'Annullata', colore: '#7A8797' },
] as const;
export const NOMI_DESTINAZIONE: Record<DestinazioneResti, string> = {
  ossario_comune: 'Ossario comune', cinerario_comune: 'Cinerario comune', campo_comune: 'Di nuovo in campo comune', fuori_comune: 'Fuori Comune',
  altra_postazione: 'Un\'altra postazione',
};
export const NOMI_OGGETTO = { salma: 'Salma', resti: 'Resti', ceneri: 'Ceneri' } as const;

/** Le operazioni che mettono un defunto in una postazione; le altre lo tolgono. */
export const sepoltura = (t: TipoOperazione) => t === 'inumazione' || t === 'tumulazione';

export function nomeOperazione(p: Pratica): string {
  const base = NOMI_OPERAZIONE[p.tipo];
  if (p.tipo === 'esumazione' || p.tipo === 'estumulazione') return `${base} ${p.straordinaria ? 'straordinaria' : 'ordinaria'}`;
  return base;
}

/** Unico avviso sulla pratica: l'esumazione straordinaria non si fa tra maggio e settembre (DPR 285/1990, art. 84). */
export function avvisoStagione(p: Pick<Pratica, 'tipo' | 'straordinaria' | 'dataOra'>): string | null {
  if (p.tipo !== 'esumazione' || !p.straordinaria || !p.dataOra) return null;
  const mese = Number(p.dataOra.slice(5, 7));
  return mese >= 5 && mese <= 9 ? 'Le esumazioni straordinarie sono vietate da maggio a settembre (DPR 285/1990, art. 84).' : null;
}

/** Fine del turno di una fossa in campo comune: dalla morte del defunto più gli anni del turno. */
export function fineTurno(s: Scheda, regole: RegoleComune): string | null {
  const morte = s.defunti[0]?.dataMorte;
  if (s.tipologia !== 'fossa' || !morte) return null;
  const [y, m, d] = morte.split('-').map(Number);
  return `${y + regole.campoComune.turnoAnni}-${String(m).padStart(2, '0')}-${String(m === 2 && d === 29 ? 28 : d).padStart(2, '0')}`;
}

/** Le pratiche che riguardano una scheda: dove si fa l'operazione, dove arriva il defunto, dove vanno i resti. */
export function praticheDi(schedaId: string): Pratica[] {
  return leggiStato().db.pratiche
    .filter((p) => p.schedaId === schedaId || p.schedaArrivoId === schedaId || p.esitoResti?.schedaId === schedaId)
    .sort((a, b) => (b.dataOra ?? b.apertaIl).localeCompare(a.dataOra ?? a.apertaIl));
}

/** Due operazioni alla stessa ora sulla stessa postazione o con lo stesso operatore. */
export function sovrapposizioni(p: Pratica, tutte: Pratica[]): string[] {
  if (!p.dataOra || p.stato !== 'programmata') return [];
  const out: string[] = [];
  for (const x of tutte) {
    if (x.id === p.id || x.stato !== 'programmata' || x.dataOra !== p.dataOra) continue;
    if (x.schedaId === p.schedaId) out.push(`stessa postazione di ${x.numero}`);
    const comuni = (x.operatoriIds ?? []).filter((o) => p.operatoriIds?.includes(o));
    if (comuni.length) out.push(`stesso operatore di ${x.numero}`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Azioni
// ---------------------------------------------------------------------------

function cambia(id: string, patch: Partial<Pratica>) {
  aggiornaDb((db) => ({ pratiche: db.pratiche.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
}

function prossimoNumero(anno: number): string {
  const pref = `PR-${anno}/`;
  let max = 0;
  for (const p of leggiStato().db.pratiche) if (p.numero.startsWith(pref)) max = Math.max(max, parseInt(p.numero.slice(pref.length), 10) || 0);
  return `${pref}${String(max + 1).padStart(4, '0')}`;
}

export interface NuovaPratica {
  cimiteroId: string;
  tipo: TipoOperazione;
  straordinaria?: boolean;
  oggetto: Pratica['oggetto'];
  dUfficio: boolean;
  richiedente?: Richiedente;
  defunto: Defunto;
  schedaId: string;
  schedaArrivoId?: string;
  agenziaId?: string;
  utenzaVotiva?: Pratica['utenzaVotiva'];
  provvisoria?: Pratica['provvisoria'];
  richiestaId?: string;
  note?: string;
}

/** Apre una pratica. Su richiesta ha il richiedente e la tariffa del suo tipo; d'ufficio no. */
export function apriPratica(d: NuovaPratica, silenzioso = false): Pratica {
  const oggi = oggiISO();
  const tariffa = d.dUfficio ? undefined : leggiStato().db.regole.operazioni.tariffe[d.tipo];
  const p: Pratica = {
    ...d, id: `pr-${Date.now().toString(36)}`, numero: prossimoNumero(Number(oggi.slice(0, 4))), stato: 'aperta', apertaIl: oggi, apertaDa: firmaCorrente(),
    tariffa,
  };
  aggiornaDb((db) => ({ pratiche: [...db.pratiche, p] }));
  // la pratica su richiesta crea da sola il suo avviso di pagamento, intestato al richiedente
  if (!d.dUfficio && d.richiedente && tariffa)
    emettiAvviso({
      motivo: 'pratica', riferimentoId: p.id, cimiteroId: p.cimiteroId, causale: `Pratica ${p.numero} · ${NOMI_OPERAZIONE[p.tipo].toLowerCase()} · ${nomeCompleto(p.defunto)}`,
      intestatario: { nome: d.richiedente.nome, codiceFiscale: d.richiedente.codiceFiscale, indirizzo: d.richiedente.indirizzo ?? '' },
      voci: [{ descrizione: `Tariffa · ${NOMI_OPERAZIONE[p.tipo].toLowerCase()}`, importo: tariffa }],
    });
  if (d.richiestaId) {
    // nata dalla richiesta di un'agenzia: la richiesta è accolta e l'agenzia lo sa
    aggiornaDb((db) => ({ richieste: db.richieste.map((r) => (r.id === d.richiestaId ? { ...r, stato: 'accolta' as const, praticaId: p.id } : r)) }));
    if (d.agenziaId) avvisa([`agenzia:${d.agenziaId}`], { categoria: p.tipo, titolo: 'Richiesta accolta', messaggio: `${NOMI_OPERAZIONE[p.tipo]} · ${nomeCompleto(p.defunto)}: pratica ${p.numero}`, link: `/pratiche?id=${p.id}` });
  }
  if (!silenzioso) toast(`Pratica ${p.numero} aperta`);
  return p;
}

/** Programma (o sposta) l'operazione: data, ora e almeno un operatore. Si può cambiare fino all'esecuzione. */
export function programmaPratica(id: string, dataOra: string, operatoriIds: string[]) {
  const p = leggiStato().db.pratiche.find((x) => x.id === id);
  if (!p || !operatoriIds.length) return;
  const prima = p.operatoriIds ?? [];
  const link = `/operazioni?id=${id}`;
  const cosa = `${NOMI_OPERAZIONE[p.tipo]} · ${nomeCompleto(p.defunto)}`;
  cambia(id, { stato: 'programmata', dataOra, operatoriIds });
  const quando = `il ${data(dataOra.slice(0, 10))} alle ${dataOra.slice(11, 16)}`;
  if (p.agenziaId && p.dataOra !== dataOra)
    avvisa([`agenzia:${p.agenziaId}`], { categoria: p.tipo, livello: p.dataOra ? 'attenzione' : 'info', titolo: p.dataOra ? 'Operazione spostata' : 'Operazione programmata', messaggio: `${cosa}: ${quando}`, link: `/pratiche?id=${id}` });
  avvisa(operatoriIds.filter((o) => !prima.includes(o)), { categoria: p.tipo, titolo: 'Operazione assegnata a te', messaggio: `${cosa}, il ${data(dataOra.slice(0, 10))} alle ${dataOra.slice(11, 16)}`, link });
  avvisa(prima.filter((o) => !operatoriIds.includes(o)), { categoria: p.tipo, titolo: 'Assegnazione tolta', messaggio: cosa, link });
  if (p.dataOra && p.dataOra !== dataOra)
    avvisa(operatoriIds.filter((o) => prima.includes(o)), { categoria: p.tipo, livello: 'attenzione', titolo: 'Operazione spostata', messaggio: `${cosa}: ora il ${data(dataOra.slice(0, 10))} alle ${dataOra.slice(11, 16)}`, link });
}

export function annullaPratica(id: string, motivo: string) {
  const p = leggiStato().db.pratiche.find((x) => x.id === id);
  if (!p) return;
  cambia(id, { stato: 'annullata', annullataIl: oggiISO(), motivoAnnullamento: motivo });
  annullaAvvisiDellaPratica(id);
  avvisa(p.operatoriIds ?? [], { categoria: p.tipo, livello: 'attenzione', titolo: 'Operazione annullata', messaggio: `${NOMI_OPERAZIONE[p.tipo]} · ${nomeCompleto(p.defunto)} · ${motivo}`, link: `/operazioni?id=${id}` });
  if (p.agenziaId) avvisa([`agenzia:${p.agenziaId}`], { categoria: p.tipo, livello: 'attenzione', titolo: 'Operazione annullata', messaggio: `${NOMI_OPERAZIONE[p.tipo]} · ${nomeCompleto(p.defunto)} · ${motivo}`, link: `/pratiche?id=${id}` });
  toast('Pratica annullata');
}

const stesso = (a: Defunto, b: Defunto) => a.nome === b.nome && a.cognome === b.cognome && (a.dataMorte ?? '') === (b.dataMorte ?? '');

function togliDefunto(schedaId: string, d: Defunto, azione: string) {
  const s = schedaPerId(schedaId);
  if (!s) return;
  const defunti = s.defunti.filter((x) => !stesso(x, d));
  aggiornaScheda(s.id, { defunti, stato: !defunti.length && s.stato === 'occupato' ? 'libero' : s.stato }, azione);
}

function mettiDefunto(schedaId: string, d: Defunto, azione: string) {
  const s = schedaPerId(schedaId);
  if (!s) return;
  aggiornaScheda(s.id, { defunti: [...s.defunti.filter((x) => !stesso(x, d)), d], stato: s.stato === 'libero' ? 'occupato' : s.stato }, azione);
}

/**
 * Esegue la pratica: aggiorna le schede (aggiunge o toglie il defunto, stato libero/occupato) e le utenze votive.
 * Per esumazione ed estumulazione l'esito dice solo dove vanno i resti.
 */
export function eseguiPratica(id: string, esito?: Pratica['esitoResti']) {
  const p = leggiStato().db.pratiche.find((x) => x.id === id);
  if (!p) return;
  const oggi = oggiISO();
  const titolo = `${NOMI_OPERAZIONE[p.tipo]} eseguita (pratica ${p.numero})${p.provvisoria ? ' · sepoltura provvisoria' : ''}`;
  // nel posto nuovo il defunto è provvisorio solo se lo dice la pratica: una traslazione senza "provvisoria" lo rende definitivo
  const arriva: Defunto = { ...p.defunto, provvisorio: p.provvisoria ? { dal: oggi, fino: p.provvisoria.fino } : undefined };
  if (sepoltura(p.tipo)) {
    mettiDefunto(p.schedaId, arriva, titolo);
  } else if (p.tipo === 'traslazione') {
    togliDefunto(p.schedaId, p.defunto, titolo);
    if (p.schedaArrivoId) mettiDefunto(p.schedaArrivoId, arriva, titolo);
    const utenze = leggiStato().db.utenze.filter((u) => u.stato !== 'cessata' && u.schedaId === p.schedaId && u.defunto && u.defunto.nome === p.defunto.nome && u.defunto.cognome === p.defunto.cognome);
    if (p.utenzaVotiva === 'sposta' && p.schedaArrivoId) for (const u of utenze) spostaUtenza(u.id, p.schedaArrivoId);
    else chiudiUtenzePerDefunto(p.schedaId, p.defunto);
  } else {
    togliDefunto(p.schedaId, p.defunto, titolo);
    chiudiUtenzePerDefunto(p.schedaId, p.defunto);
    if (esito?.destinazione === 'altra_postazione' && esito.schedaId) {
      // la postazione di arrivo riceve i resti senza una seconda pratica
      mettiDefunto(esito.schedaId, p.defunto, `Resti ricevuti (pratica ${p.numero})`);
    } else if (esito) {
      // il defunto resta trovabile, con il posto dove si trova ora
      aggiornaDb((db) => ({ defuntiAltrove: [...db.defuntiAltrove, { defunto: p.defunto, daSchedaId: p.schedaId, destinazione: esito.destinazione, praticaId: p.id, data: oggi }] }));
    }
  }
  cambia(id, { stato: 'eseguita', eseguitaIl: oggi, dataOra: p.dataOra ?? adessoISO().slice(0, 16), esitoResti: esito });
  toast(`${NOMI_OPERAZIONE[p.tipo]} eseguita: schede aggiornate`);
}

// ---------------------------------------------------------------------------
// Agenzie funebri: richieste, accessi e regole
// ---------------------------------------------------------------------------

export const NOMI_STATO_RICHIESTA: Record<RichiestaAgenzia['stato'], string> = { in_attesa: 'In attesa', accolta: 'Accolta', rifiutata: 'Rifiutata' };

/** L'agenzia chiede un'operazione per un giorno e un'ora: decide l'ufficio, che assegna la postazione aprendo la pratica. */
export function inviaRichiesta(d: Omit<RichiestaAgenzia, 'id' | 'numero' | 'stato' | 'inviataIl'>): RichiestaAgenzia {
  const db = leggiStato().db;
  const anno = oggiISO().slice(0, 4);
  const n = db.richieste.filter((r) => r.numero.startsWith(`RA-${anno}/`)).length + 1;
  const r: RichiestaAgenzia = { ...d, id: `ra-${Date.now().toString(36)}`, numero: `RA-${anno}/${String(n).padStart(4, '0')}`, stato: 'in_attesa', inviataIl: oggiISO() };
  aggiornaDb((x) => ({ richieste: [...x.richieste, r] }));
  const agenzia = db.agenzie.find((a) => a.id === d.agenziaId)?.nome ?? 'Agenzia funebre';
  avvisa(['ufficio'], {
    categoria: d.tipo, livello: 'attenzione', titolo: `Richiesta di ${NOMI_OPERAZIONE[d.tipo].toLowerCase()} da un'agenzia`,
    messaggio: `${agenzia} · ${nomeCompleto(d.defunto)} · proposta per il ${data(d.dataOra.slice(0, 10))} alle ${d.dataOra.slice(11, 16)}`, link: '/operazioni',
  });
  toast(`Richiesta ${r.numero} inviata all'ufficio`);
  return r;
}

export function rifiutaRichiesta(id: string, motivo: string) {
  const r = leggiStato().db.richieste.find((x) => x.id === id);
  if (!r) return;
  aggiornaDb((db) => ({ richieste: db.richieste.map((x) => (x.id === id ? { ...x, stato: 'rifiutata' as const, motivoRifiuto: motivo } : x)) }));
  avvisa([`agenzia:${r.agenziaId}`], { categoria: r.tipo, livello: 'attenzione', titolo: 'Richiesta rifiutata', messaggio: `${NOMI_OPERAZIONE[r.tipo]} · ${nomeCompleto(r.defunto)} · ${motivo}`, link: '/richieste' });
  toast('Richiesta rifiutata: l\'agenzia è stata avvisata');
}

export function salvaAgenzia(a: AgenziaFunebre) {
  const prima = leggiStato().db.agenzie.find((x) => x.id === a.id);
  aggiornaDb((db) => ({ agenzie: prima ? db.agenzie.map((x) => (x.id === a.id ? a : x)) : [...db.agenzie, a] }));
  registra(!prima ? `Nuova agenzia funebre: ${a.nome}` : prima.attiva !== a.attiva ? `Agenzia ${a.nome} ${a.attiva ? 'riattivata' : 'disattivata'}` : `Agenzia ${a.nome} modificata`);
}

export function salvaRegoleOperazioni(campoComune: RegoleComune['campoComune'], operazioni: RegoleComune['operazioni']) {
  aggiornaDb((db) => ({ regole: { ...db.regole, campoComune, operazioni } }));
  registra('Regole del Comune: campo comune e operazioni cimiteriali aggiornati');
  toast('Regole salvate');
}
