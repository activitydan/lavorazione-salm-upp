// Illuminazione votiva: un'utenza è su una scheda e per un defunto (o per tutta una tomba di famiglia),
// con uno o più punti luce. Chi la paga è l'abbonato, che non è per forza il concessionario.
import { oggiISO } from '../lib/format';
import { nomeSoggetto } from './concessioni';
import { aggiornaDb, aggiornaScheda, leggiStato, registra, toast, utenteCorrente } from './store';
import type { Abbonato, MotivoCessazione, RegoleComune, Scheda, StatoUtenza, UtenzaVotiva } from './types';

export const NOMI_STATO_UTENZA: Record<StatoUtenza, string> = {
  da_allacciare: 'Da allacciare', attiva: 'Attiva', sospesa: 'Sospesa per morosità', cessata: 'Cessata',
};
export const NOMI_MOTIVO_CESSAZIONE: Record<MotivoCessazione, string> = {
  disdetta: 'disdetta', morosita: 'morosità', fine_concessione: 'fine della concessione', defunto_spostato: 'defunto spostato',
};
export const CLASSE_STATO_UTENZA: Record<StatoUtenza, string> = {
  da_allacciare: 'badge--blu', attiva: 'badge--verde', sospesa: 'badge--arancio', cessata: '',
};

/** Stato da mostrare: la disdetta vale dal 1° gennaio dell'anno dopo, quindi fino ad allora l'utenza resta attiva. */
export function statoUtenza(u: UtenzaVotiva, oggi = oggiISO()): StatoUtenza {
  if (u.stato !== 'cessata' && u.disdettaDal && u.disdettaDal <= oggi) return 'cessata';
  return u.stato;
}

export function nomeDefuntoUtenza(u: UtenzaVotiva): string {
  return u.defunto ? `${u.defunto.nome} ${u.defunto.cognome}`.trim() : 'Tutta la tomba di famiglia';
}

// ---------------------------------------------------------------------------
// Indice scheda -> utenze non cessate
// ---------------------------------------------------------------------------

const cache = new WeakMap<UtenzaVotiva[], Map<string, UtenzaVotiva[]>>();

export function indiceUtenze(utenze: UtenzaVotiva[]): Map<string, UtenzaVotiva[]> {
  let m = cache.get(utenze);
  if (!m) {
    m = new Map();
    const oggi = oggiISO();
    for (const u of utenze) {
      if (statoUtenza(u, oggi) === 'cessata') continue;
      const l = m.get(u.schedaId);
      if (l) l.push(u);
      else m.set(u.schedaId, [u]);
    }
    cache.set(utenze, m);
  }
  return m;
}

/** Le utenze in corso di una scheda (non cessate). */
export function utenzeDi(schedaId: string): UtenzaVotiva[] {
  return indiceUtenze(leggiStato().db.utenze).get(schedaId) ?? [];
}

/** Il flag "Lampada votiva" della scheda: lo calcola CimiTera dall'utenza attiva. */
export function haLampada(schedaId: string): boolean {
  return utenzeDi(schedaId).some((u) => u.stato === 'attiva');
}

export function canoneAnnuo(u: UtenzaVotiva, regole: RegoleComune): number {
  return u.puntiLuce * regole.illuminazione.canonePuntoLuce;
}

/** All'allaccio si pagano il contributo di allaccio e i dodicesimi del canone dal mese dopo fino al 31 dicembre. */
export function primoImporto(puntiLuce: number, dataAllaccio: string, regole: RegoleComune): { allaccio: number; dodicesimi: number; mesi: number; totale: number } {
  const mesi = 12 - Number(dataAllaccio.slice(5, 7));
  const dodicesimi = Math.round(((puntiLuce * regole.illuminazione.canonePuntoLuce * mesi) / 12) * 100) / 100;
  const allaccio = regole.illuminazione.allaccio;
  return { allaccio, dodicesimi, mesi, totale: Math.round((allaccio + dodicesimi) * 100) / 100 };
}

// ---------------------------------------------------------------------------
// Azioni: ognuna scrive una riga nello storico dell'utenza
// ---------------------------------------------------------------------------

function cambia(id: string, fn: (u: UtenzaVotiva) => Partial<UtenzaVotiva>, azione: string) {
  aggiornaDb((db) => ({
    utenze: db.utenze.map((u) => (u.id === id ? { ...u, ...fn(u), storico: [...u.storico, { data: oggiISO(), azione, operatore: utenteCorrente() }] } : u)),
  }));
}

function prossimoNumero(anno: number): string {
  const pref = `LV-${anno}/`;
  let max = 0;
  for (const u of leggiStato().db.utenze) if (u.numero.startsWith(pref)) max = Math.max(max, parseInt(u.numero.slice(pref.length), 10) || 0);
  return `${pref}${String(max + 1).padStart(4, '0')}`;
}

export interface NuovaUtenza {
  scheda: Scheda;
  /** null quando l'utenza vale per tutta la tomba di famiglia */
  defunto: { nome: string; cognome: string } | null;
  abbonato: Abbonato;
  puntiLuce: number;
}

/** Nuovo allaccio: il contratto è firmato, la luce non è ancora accesa. */
export function nuovoAllaccio(d: NuovaUtenza): UtenzaVotiva {
  const oggi = oggiISO();
  const u: UtenzaVotiva = {
    id: `ut-${Date.now().toString(36)}`, numero: prossimoNumero(Number(oggi.slice(0, 4))), cimiteroId: d.scheda.cimiteroId, dataContratto: oggi,
    schedaId: d.scheda.id, defunto: d.defunto ?? undefined, abbonato: d.abbonato, puntiLuce: d.puntiLuce, stato: 'da_allacciare',
    storico: [{ data: oggi, azione: 'Contratto firmato', operatore: utenteCorrente() }],
  };
  aggiornaDb((db) => ({ utenze: [...db.utenze, u] }));
  // la lampada vista sul campo ora ha la sua utenza
  if (d.scheda.lampadaAccesa) aggiornaScheda(d.scheda.id, { lampadaAccesa: undefined, lampadaVistaIl: undefined });
  toast(`Utenza ${u.numero} registrata: da allacciare`);
  return u;
}

export function allaccioEseguito(id: string) {
  cambia(id, () => ({ stato: 'attiva', allacciataIl: oggiISO() }), 'Allaccio eseguito');
  toast('Luce accesa: l\'utenza è attiva');
}

export function volturaUtenza(id: string, nuovo: Abbonato, motivo: 'consenso' | 'decesso') {
  const u = leggiStato().db.utenze.find((x) => x.id === id);
  if (!u) return;
  const perche = motivo === 'decesso' ? 'decesso del precedente abbonato' : 'consenso del precedente abbonato';
  cambia(id, () => ({ abbonato: nuovo }), `Voltura da ${nomeSoggetto(u.abbonato)} a ${nomeSoggetto(nuovo)} (${perche})`);
  toast('Voltura registrata');
}

/** La disdetta vale dal 1° gennaio dell'anno dopo. */
export function disdettaUtenza(id: string) {
  const dal = `${Number(oggiISO().slice(0, 4)) + 1}-01-01`;
  cambia(id, () => ({ disdettaDal: dal }), 'Disdetta registrata');
  toast('Disdetta registrata: vale dal 1° gennaio');
}

export function sospendiUtenza(id: string) {
  cambia(id, () => ({ stato: 'sospesa', sospesaIl: oggiISO() }), 'Sospesa per morosità');
  toast('Utenza sospesa: luce spenta');
}

/** La luce si riaccende pagando il dovuto, senza un nuovo allaccio. */
export function riallacciaUtenza(id: string) {
  cambia(id, () => ({ stato: 'attiva', sospesaIl: undefined }), 'Riaccesa');
  toast('Luce riaccesa: l\'utenza è attiva');
}

export function cessaUtenza(id: string, motivo: MotivoCessazione) {
  cambia(id, () => ({ stato: 'cessata', cessataIl: oggiISO(), motivoCessazione: motivo }), `Cessata: ${NOMI_MOTIVO_CESSAZIONE[motivo]}`);
}

/** Sposta l'utenza su un'altra postazione (traslazione del defunto). */
export function spostaUtenza(id: string, nuovaSchedaId: string) {
  cambia(id, () => ({ schedaId: nuovaSchedaId }), `Spostata sulla postazione ${nuovaSchedaId}`);
}

/** Fine automatica: quando la concessione si chiude, le utenze delle sue schede cessano. */
export function chiudiUtenzePerConcessione(schedeIds: string[]) {
  const ids = new Set(schedeIds);
  const daChiudere = leggiStato().db.utenze.filter((u) => u.stato !== 'cessata' && ids.has(u.schedaId));
  for (const u of daChiudere) cessaUtenza(u.id, 'fine_concessione');
  return daChiudere.length;
}

/** Fine automatica: una pratica eseguita ha tolto il defunto dalla postazione. */
export function chiudiUtenzePerDefunto(schedaId: string, defunto: { nome: string; cognome: string }) {
  const daChiudere = leggiStato().db.utenze.filter((u) => u.stato !== 'cessata' && u.schedaId === schedaId && u.defunto && u.defunto.nome === defunto.nome && u.defunto.cognome === defunto.cognome);
  for (const u of daChiudere) cessaUtenza(u.id, 'defunto_spostato');
  return daChiudere.length;
}

export function salvaRegoleIlluminazione(regole: RegoleComune['illuminazione']) {
  aggiornaDb((db) => ({ regole: { ...db.regole, illuminazione: regole } }));
  registra('Regole del Comune: illuminazione votiva aggiornata');
  toast('Regole salvate');
}
