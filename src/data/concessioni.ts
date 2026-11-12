// Concessioni: contratti a sé, collegati a una o più schede.
// La scadenza si calcola dalla decorrenza e dalla regola applicata, mai dalla data di morte.
import { aggiungiMesi, data, giorniTra, oggiISO } from '../lib/format';
import { aggiornaDb, leggiStato, registra, toast, utenteCorrente } from './store';
import { emettiAvviso, intestatarioConcessione } from './scadenze';
import { chiudiUtenzePerConcessione } from './utenze';
import type { Concessionario, Concessione, MotivoChiusura, RegoleComune, Scheda, Soggetto, TipoConcessione } from './types';

export const NOMI_TIPO_CONCESSIONE: Record<TipoConcessione, string> = {
  loculo: 'Loculo', tomba_famiglia: 'Tomba di famiglia', celletta_ossario: 'Celletta ossario', nicchia_cineraria: 'Nicchia cineraria',
};
export const TIPI_CONCESSIONE = Object.keys(NOMI_TIPO_CONCESSIONE) as TipoConcessione[];

export const NOMI_MOTIVO: Record<MotivoChiusura, string> = {
  scaduta: 'Scaduta', decaduta: 'Decaduta', revocata: 'Revocata', rinunciata: 'Rinunciata', estinta: 'Estinta',
};

/** true se la tipologia della scheda può avere una concessione (la fossa in campo comune ha il turno). */
export function tipoConcessioneDi(tipologia: string): TipoConcessione | null {
  return (TIPI_CONCESSIONE as string[]).includes(tipologia) ? (tipologia as TipoConcessione) : null;
}

export function anniDopo(iso: string, anni: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const giorno = m === 2 && d === 29 ? 28 : d;
  return `${y + anni}-${String(m).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
}

/** Nome da mostrare di una persona o di un ente. */
export function nomeSoggetto(x?: Soggetto | null): string {
  if (!x) return '—';
  return x.tipo === 'ente' ? x.denominazione ?? '' : `${x.nome ?? ''} ${x.cognome ?? ''}`.trim();
}

/** Chi tratta con il Comune: l'unico concessionario, oppure il rappresentante quando sono più di uno. */
export function rappresentanteDi(c: Concessione): Concessionario | undefined {
  return c.concessionari.find((x) => x.rappresentante) ?? c.concessionari[0];
}

export function nomiConcessionari(c: Concessione): string {
  const r = rappresentanteDi(c);
  const altri = c.concessionari.length - 1;
  return `${nomeSoggetto(r)}${altri > 0 ? ` e ${altri === 1 ? 'un altro' : `altri ${altri}`}` : ''}`;
}

export type StatoEffettivo = 'attiva' | 'in_scadenza' | 'in_decadenza' | 'chiusa';

/** Stato da mostrare: "in scadenza" e "scaduta" si calcolano dalla data. */
export function statoEffettivo(c: Concessione, regole: RegoleComune, oggi = oggiISO()): { stato: StatoEffettivo; motivo?: MotivoChiusura; giorni: number } {
  const giorni = giorniTra(oggi, c.scadenza);
  if (c.stato === 'chiusa') return { stato: 'chiusa', motivo: c.motivoChiusura, giorni };
  if (giorni < 0) return { stato: 'chiusa', motivo: 'scaduta', giorni };
  if (c.stato === 'in_decadenza') return { stato: 'in_decadenza', giorni };
  if (c.scadenza <= aggiungiMesi(oggi, regole.concessioni.sogliaInScadenzaMesi)) return { stato: 'in_scadenza', giorni };
  return { stato: 'attiva', giorni };
}

export function etichettaStato(e: { stato: StatoEffettivo; motivo?: MotivoChiusura }): { testo: string; classe: string } {
  if (e.stato === 'chiusa') return { testo: e.motivo ? NOMI_MOTIVO[e.motivo] : 'Chiusa', classe: e.motivo === 'scaduta' ? 'badge--rosso' : '' };
  if (e.stato === 'in_decadenza') return { testo: 'In decadenza', classe: 'badge--rosso' };
  if (e.stato === 'in_scadenza') return { testo: 'In scadenza', classe: 'badge--arancio' };
  return { testo: 'Attiva', classe: 'badge--verde' };
}

// ---------------------------------------------------------------------------
// Indice scheda -> contratto (ricalcolato solo quando cambia l'elenco)
// ---------------------------------------------------------------------------

const cache = new WeakMap<Concessione[], Map<string, Concessione>>();

/** Per ogni scheda il suo contratto in corso: quello non chiuso da un atto (anche se scaduto e non rinnovato). */
export function indiceConcessioni(concessioni: Concessione[]): Map<string, Concessione> {
  let m = cache.get(concessioni);
  if (!m) {
    m = new Map();
    for (const c of concessioni) {
      if (c.stato === 'chiusa') continue;
      for (const id of c.schedeIds) m.set(id, c);
    }
    cache.set(concessioni, m);
  }
  return m;
}

export function concessioneDi(schedaId: string): Concessione | undefined {
  return indiceConcessioni(leggiStato().db.concessioni).get(schedaId);
}

/** Posti occupati: i defunti nelle schede del contratto. */
export function postiOccupati(c: Concessione, schede: Map<string, Scheda>): number {
  return c.schedeIds.reduce((t, id) => t + (schede.get(id)?.defunti.length ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Azioni: ognuna scrive una riga nello storico del contratto
// ---------------------------------------------------------------------------

function cambia(id: string, fn: (c: Concessione) => Partial<Concessione>, azione: string, atto?: string) {
  aggiornaDb((db) => ({
    concessioni: db.concessioni.map((c) =>
      c.id === id ? { ...c, ...fn(c), storico: [...c.storico, { data: oggiISO(), azione, atto: atto || undefined, operatore: utenteCorrente() }] } : c,
    ),
  }));
}

function prossimoNumero(anno: number): string {
  const pref = `CON-${anno}/`;
  let max = 0;
  for (const c of leggiStato().db.concessioni) if (c.numero.startsWith(pref)) max = Math.max(max, parseInt(c.numero.slice(pref.length), 10) || 0);
  return `${pref}${String(max + 1).padStart(4, '0')}`;
}

export interface NuovaConcessione {
  cimiteroId: string;
  tipo: TipoConcessione;
  schedeIds: string[];
  postiTotali: number;
  concessionari: Concessionario[];
  decorrenza: string;
  provvedimento?: string;
  aventiDiritto?: Concessione['aventiDiritto'];
}

/** Nuova concessione: la durata viene dalle Regole del Comune e resta scritta nel contratto. */
export function nuovaConcessione(d: NuovaConcessione): Concessione {
  const regole = leggiStato().db.regole.concessioni;
  const durata = regole.durate[d.tipo];
  const oggi = oggiISO();
  const c: Concessione = {
    id: `conc-${Date.now().toString(36)}`,
    numero: prossimoNumero(Number(d.decorrenza.slice(0, 4))),
    cimiteroId: d.cimiteroId, dataStipula: oggi, provvedimento: d.provvedimento || undefined, tipo: d.tipo, schedeIds: d.schedeIds, postiTotali: d.postiTotali,
    concessionari: d.concessionari, aventiDiritto: d.aventiDiritto?.length ? d.aventiDiritto : undefined,
    decorrenza: d.decorrenza, durataAnni: durata, rinnovi: 0,
    regola: `Regole del Comune al ${data(oggi)}: ${NOMI_TIPO_CONCESSIONE[d.tipo].toLowerCase()} ${durata} anni, rinnovo ${regole.durataRinnovo}`,
    scadenza: anniDopo(d.decorrenza, durata), stato: 'attiva',
    storico: [{ data: oggi, azione: 'Nuova concessione', atto: d.provvedimento || undefined, operatore: utenteCorrente() }],
  };
  aggiornaDb((db) => ({ concessioni: [...db.concessioni, c] }));
  // l'avviso di pagamento nasce da solo con l'azione, intestato al rappresentante o all'unico concessionario
  emettiAvviso({
    motivo: 'concessione', riferimentoId: c.id, cimiteroId: c.cimiteroId, causale: `Concessione ${c.numero} · nuova concessione`, intestatario: intestatarioConcessione(c),
    voci: [{ descrizione: `Tariffa di nuova concessione · ${NOMI_TIPO_CONCESSIONE[c.tipo].toLowerCase()}`, importo: regole.tariffe[c.tipo].nuova }],
  });
  toast(`Concessione ${c.numero} registrata, con il suo avviso di pagamento`);
  return c;
}

export function rinnovaConcessione(id: string, atto?: string) {
  const regole = leggiStato().db.regole.concessioni;
  const anni = regole.durataRinnovo;
  cambia(id, (c) => ({ rinnovi: c.rinnovi + 1, scadenza: anniDopo(c.scadenza, anni), stato: 'attiva' }), `Rinnovo di ${anni} anni`, atto);
  const c = leggiStato().db.concessioni.find((x) => x.id === id);
  if (c)
    emettiAvviso({
      motivo: 'concessione', riferimentoId: c.id, cimiteroId: c.cimiteroId, causale: `Concessione ${c.numero} · rinnovo`, intestatario: intestatarioConcessione(c),
      voci: [{ descrizione: `Tariffa di rinnovo · ${NOMI_TIPO_CONCESSIONE[c.tipo].toLowerCase()}`, importo: regole.tariffe[c.tipo].rinnovo }],
    });
  toast(`Concessione rinnovata di ${anni} anni, con il suo avviso di pagamento`);
}

export function subentroConcessione(id: string, nuovi: Concessionario[], atto?: string) {
  const c = leggiStato().db.concessioni.find((x) => x.id === id);
  if (!c || !nuovi.length) return;
  cambia(id, () => ({ concessionari: nuovi }), `Subentro: da ${nomiConcessionari(c)} a ${nomeSoggetto(nuovi.find((x) => x.rappresentante) ?? nuovi[0])}`, atto);
  toast('Subentro registrato');
}

export function avviaDecadenza(id: string, atto?: string) {
  cambia(id, () => ({ stato: 'in_decadenza' }), 'Avvio della decadenza', atto);
  toast('Decadenza avviata: diffida al concessionario');
}

/** Chiude il contratto con un motivo. Le postazioni ancora occupate restano da liberare. */
export function chiudiConcessione(id: string, motivo: MotivoChiusura, atto?: string) {
  const azione = { rinunciata: 'Rinuncia', decaduta: 'Decadenza', revocata: 'Revoca', scaduta: 'Chiusura per scadenza', estinta: 'Estinzione' }[motivo];
  const c = leggiStato().db.concessioni.find((x) => x.id === id);
  cambia(id, () => ({ stato: 'chiusa', motivoChiusura: motivo, chiusaIl: oggiISO() }), azione, atto);
  // fine automatica: le utenze votive delle sue schede cessano
  const n = c ? chiudiUtenzePerConcessione(c.schedeIds) : 0;
  toast(`Concessione chiusa: ${NOMI_MOTIVO[motivo].toLowerCase()}${n ? ` · ${n === 1 ? 'una utenza votiva cessata' : `${n} utenze votive cessate`}` : ''}`);
}

export function salvaAventiDiritto(id: string, aventiDiritto: NonNullable<Concessione['aventiDiritto']>) {
  aggiornaDb((db) => ({ concessioni: db.concessioni.map((c) => (c.id === id ? { ...c, aventiDiritto } : c)) }));
}

/** Regole del Comune sulle concessioni: valgono per i nuovi contratti e addebiti. */
export function salvaRegoleConcessioni(regole: RegoleComune['concessioni']) {
  aggiornaDb((db) => ({ regole: { ...db.regole, concessioni: regole } }));
  registra('Regole del Comune: concessioni aggiornate');
  toast('Regole salvate');
}
