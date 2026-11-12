// Scadenze e pagamenti: scadenzario unico, lettere inviate tramite DAT (simulate), avvisi di pagamento
// pagoPA (simulati) e scala della morosità. Nessuna lettera parte davvero, nessun pagamento è reale.
import { aggiungiGiorni, data, giorniTra, nomeCompleto, oggiISO } from '../lib/format';
import { NOMI_TIPO_CONCESSIONE, avviaDecadenza, concessioneDi, nomeSoggetto, rappresentanteDi, statoEffettivo } from './concessioni';
import { apriPratica, fineTurno } from './pratiche';
import { aggiornaDb, avvisa, firmaCorrente, indiceSchede, leggiStato, registra, toast, utenteCorrente } from './store';
import type {
  AvvisoPagamento, CanaleDat, Concessione, Database, Destinatario, EsitoInvio, InvioDat, LottoDat, MotivoAvviso, PassoMorosita, RegoleComune, Scheda, TipoLettera,
  UtenzaVotiva,
} from './types';
import { cessaUtenza, riallacciaUtenza, sospendiUtenza, statoUtenza } from './utenze';

// ---------------------------------------------------------------------------
// Avvisi di pagamento (pagoPA simulato)
// ---------------------------------------------------------------------------

export type StatoAvviso = 'da_pagare' | 'scaduto' | 'pagato' | 'annullato';
export const NOMI_STATO_AVVISO: Record<StatoAvviso, string> = { da_pagare: 'Da pagare', scaduto: 'Scaduto', pagato: 'Pagato', annullato: 'Annullato' };
export const CLASSE_STATO_AVVISO: Record<StatoAvviso, string> = { da_pagare: 'badge--giallo', scaduto: 'badge--rosso', pagato: 'badge--verde', annullato: '' };
export const NOMI_MOTIVO_AVVISO: Record<MotivoAvviso, string> = { concessione: 'Concessione', utenza: 'Illuminazione votiva', pratica: 'Pratica' };
export const NOMI_PASSO: Record<PassoMorosita['tipo'], string> = {
  sollecito: 'Sollecito', diffida: 'Diffida', sospensione: 'Sospensione dell\'utenza', cessazione: 'Cessazione per morosità', avvio_decadenza: 'Avvio della decadenza',
};

/** "Scaduto" si calcola dalla data: si può ancora pagare. */
export function statoAvviso(a: AvvisoPagamento, oggi = oggiISO()): StatoAvviso {
  if (a.stato === 'da_pagare' && a.scadenza < oggi) return 'scaduto';
  return a.stato;
}

export function avvisiDi(motivo: MotivoAvviso, riferimentoId: string): AvvisoPagamento[] {
  return leggiStato().db.avvisi.filter((a) => a.motivo === motivo && a.riferimentoId === riferimentoId).sort((a, b) => b.emessoIl.localeCompare(a.emessoIl));
}

const cacheMorosi = new WeakMap<AvvisoPagamento[], Set<string>>();
/** Moroso: chi ha almeno un avviso di pagamento scaduto. */
export function codiciMorosi(avvisi: AvvisoPagamento[]): Set<string> {
  let m = cacheMorosi.get(avvisi);
  if (!m) {
    const oggi = oggiISO();
    m = new Set(avvisi.filter((a) => statoAvviso(a, oggi) === 'scaduto').map((a) => a.intestatario.codiceFiscale));
    cacheMorosi.set(avvisi, m);
  }
  return m;
}
export function eMoroso(codiceFiscale?: string): boolean {
  return !!codiceFiscale && codiciMorosi(leggiStato().db.avvisi).has(codiceFiscale);
}

/** Scrive una riga nello storico della concessione, dell'utenza o della pratica a cui l'avviso appartiene. */
function storico(a: Pick<AvvisoPagamento, 'motivo' | 'riferimentoId'>, azione: string) {
  const riga = { data: oggiISO(), azione, operatore: utenteCorrente() };
  aggiornaDb((db) => {
    if (a.motivo === 'concessione') return { concessioni: db.concessioni.map((c) => (c.id === a.riferimentoId ? { ...c, storico: [...c.storico, riga] } : c)) };
    if (a.motivo === 'utenza') return { utenze: db.utenze.map((u) => (u.id === a.riferimentoId ? { ...u, storico: [...u.storico, riga] } : u)) };
    return { pratiche: db.pratiche.map((p) => (p.id === a.riferimentoId ? { ...p, storico: [...(p.storico ?? []), riga] } : p)) };
  });
}

export interface NuovoAvviso {
  motivo: MotivoAvviso;
  riferimentoId: string;
  cimiteroId: string;
  causale: string;
  intestatario: AvvisoPagamento['intestatario'];
  voci: AvvisoPagamento['voci'];
  anno?: number;
}

/** Lo crea CimiTera da solo con l'azione; l'azione vale subito, senza aspettare il pagamento. */
export function emettiAvviso(d: NuovoAvviso, silenzioso = false): AvvisoPagamento {
  const oggi = oggiISO();
  const giorni = leggiStato().db.regole.pagamenti.giorniPagamento;
  const importo = Math.round(d.voci.reduce((t, v) => t + v.importo, 0) * 100) / 100;
  const a: AvvisoPagamento = {
    ...d, id: `av-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    numero: `3${String(Date.now()).padStart(13, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    importo, emessoIl: oggi, scadenza: aggiungiGiorni(oggi, giorni), stato: 'da_pagare', passi: [],
  };
  aggiornaDb((db) => ({ avvisi: [...db.avvisi, a] }));
  if (!silenzioso) storico(a, `Avviso di pagamento emesso: ${importo.toFixed(2).replace('.', ',')} €`);
  return a;
}

/** "Simula pagamento": pagato con data e numero di ricevuta finti. L'utenza sospesa si riaccende da sola. */
export function simulaPagamento(id: string) {
  const a = leggiStato().db.avvisi.find((x) => x.id === id);
  if (!a || a.stato !== 'da_pagare') return;
  const oggi = oggiISO();
  const ricevuta = `RIC-${oggi.slice(0, 4)}-${String(Math.floor(Math.random() * 900000) + 100000)}`;
  aggiornaDb((db) => ({ avvisi: db.avvisi.map((x) => (x.id === id ? { ...x, stato: 'pagato', pagatoIl: oggi, ricevuta } : x)) }));
  storico(a, `Avviso di pagamento pagato (ricevuta ${ricevuta})`);
  if (a.motivo === 'utenza') {
    const db = leggiStato().db;
    const u = db.utenze.find((x) => x.id === a.riferimentoId);
    const altriScaduti = db.avvisi.some((x) => x.motivo === 'utenza' && x.riferimentoId === a.riferimentoId && statoAvviso(x) === 'scaduto');
    if (u?.stato === 'sospesa' && !altriScaduti) riallacciaUtenza(u.id);
  }
  toast('Pagamento simulato: avviso pagato');
}

export function annullaAvviso(id: string, motivo: string) {
  const a = leggiStato().db.avvisi.find((x) => x.id === id);
  if (!a || a.stato !== 'da_pagare') return;
  aggiornaDb((db) => ({ avvisi: db.avvisi.map((x) => (x.id === id ? { ...x, stato: 'annullato', annullatoIl: oggiISO(), motivoAnnullamento: motivo } : x)) }));
  storico(a, `Avviso di pagamento annullato: ${motivo}`);
}

/** Se la pratica viene annullata, il suo avviso non pagato si annulla da solo. */
export function annullaAvvisiDellaPratica(praticaId: string) {
  for (const a of avvisiDi('pratica', praticaId)) if (a.stato === 'da_pagare') annullaAvviso(a.id, 'Pratica annullata');
}

// ---------------------------------------------------------------------------
// Scala della morosità: si va avanti a mano, quando il termine è passato
// ---------------------------------------------------------------------------

const SCALA: Record<MotivoAvviso, PassoMorosita['tipo'][]> = {
  utenza: ['sollecito', 'diffida', 'sospensione', 'cessazione'],
  concessione: ['sollecito', 'avvio_decadenza'],
  pratica: ['sollecito', 'diffida'],
};

/** Il prossimo passo e da quando si può fare; null se la scala è finita. */
export function prossimoPasso(a: AvvisoPagamento, regole: RegoleComune, oggi = oggiISO()): { tipo: PassoMorosita['tipo']; dal: string; pronto: boolean } | null {
  if (statoAvviso(a, oggi) !== 'scaduto') return null;
  const scala = SCALA[a.motivo];
  const tipo = scala[a.passi.length];
  if (!tipo) return null;
  const ultimo = a.passi[a.passi.length - 1];
  const attesa = !ultimo ? 0 : ultimo.tipo === 'sollecito' ? regole.pagamenti.giorniDopoSollecito : ultimo.tipo === 'diffida' ? regole.pagamenti.giorniDopoDiffida : 365;
  const dal = ultimo ? aggiungiGiorni(ultimo.data, attesa) : aggiungiGiorni(a.scadenza, 1);
  return { tipo, dal, pronto: dal <= oggi };
}

export function faiPasso(id: string) {
  const db = leggiStato().db;
  const a = db.avvisi.find((x) => x.id === id);
  const prossimo = a && prossimoPasso(a, db.regole);
  if (!a || !prossimo?.pronto) return;
  const tipo = prossimo.tipo;
  aggiornaDb((d) => ({ avvisi: d.avvisi.map((x) => (x.id === id ? { ...x, passi: [...x.passi, { tipo, data: oggiISO() }] } : x)) }));
  storico(a, `${NOMI_PASSO[tipo]} per l'avviso di pagamento non pagato`);
  const dest: Destinatario = { nome: a.intestatario.nome, indirizzo: a.intestatario.indirizzo };
  if (tipo === 'sollecito') inviaTramiteDat([{ tipo: 'sollecito', riferimento: a.id, destinatario: dest, oggetto: `Sollecito di pagamento · ${a.causale}`, avvisoId: a.id }], 'posta_certa');
  else if (tipo === 'diffida') inviaTramiteDat([{ tipo: 'diffida', riferimento: a.id, destinatario: dest, oggetto: `Diffida di pagamento · ${a.causale}`, avvisoId: a.id }], 'raccomandata_certa');
  else if (tipo === 'sospensione') sospendiUtenza(a.riferimentoId);
  else if (tipo === 'cessazione') cessaUtenza(a.riferimentoId, 'morosita');
  else if (tipo === 'avvio_decadenza') avviaDecadenzaConDiffida(a.riferimentoId, 'Rinnovo non pagato');
  toast(`${NOMI_PASSO[tipo]}: fatto`);
}

/** Quando si avvia la decadenza, la diffida parte tramite DAT con Notifica Certa già scelta. */
export function avviaDecadenzaConDiffida(concessioneId: string, atto?: string) {
  const c = leggiStato().db.concessioni.find((x) => x.id === concessioneId);
  if (!c || c.stato !== 'attiva') return;
  avviaDecadenza(concessioneId, atto);
  const d = destinatarioConcessione(c);
  if (d) inviaTramiteDat([{ tipo: 'diffida_decadenza', riferimento: c.id, destinatario: d, oggetto: `Diffida: avvio della decadenza della concessione ${c.numero}`, concessioneId: c.id, schedaId: c.schedeIds[0] }], 'notifica_certa');
}

/** "Emetti i canoni dell'anno": un avviso per ogni utenza attiva (salta le sospese), spedito tramite DAT. */
export function emettiCanoni(anno: number, cimiteroId: string): number {
  const db = leggiStato().db;
  const giaEmessi = new Set(db.avvisi.filter((a) => a.motivo === 'utenza' && a.anno === anno && a.stato !== 'annullato').map((a) => a.riferimentoId));
  const lettere: NuovaLettera[] = [];
  for (const u of db.utenze) {
    if (u.cimiteroId !== cimiteroId || statoUtenza(u) !== 'attiva' || giaEmessi.has(u.id)) continue;
    // chi si è allacciato nell'anno ha già pagato i dodicesimi con l'allaccio
    if (Number(u.dataContratto.slice(0, 4)) >= anno) continue;
    const a = emettiAvviso({
      motivo: 'utenza', riferimentoId: u.id, cimiteroId, causale: `Illuminazione votiva · canone ${anno} · utenza ${u.numero}`, intestatario: intestatarioUtenza(u), anno,
      voci: [{ descrizione: `Canone ${anno} · ${u.puntiLuce} ${u.puntiLuce === 1 ? 'punto luce' : 'punti luce'}`, importo: u.puntiLuce * db.regole.illuminazione.canonePuntoLuce }],
    });
    lettere.push({ tipo: 'avviso_pagamento', riferimento: a.id, destinatario: { nome: a.intestatario.nome, indirizzo: a.intestatario.indirizzo }, oggetto: a.causale, avvisoId: a.id });
  }
  if (lettere.length) inviaTramiteDat(lettere, 'posta_certa');
  return lettere.length;
}

export function intestatarioUtenza(u: UtenzaVotiva): AvvisoPagamento['intestatario'] {
  return { nome: nomeSoggetto(u.abbonato), codiceFiscale: u.abbonato.codiceFiscale, indirizzo: u.abbonato.indirizzoBolletta || u.abbonato.indirizzo };
}

export function intestatarioConcessione(c: Concessione): AvvisoPagamento['intestatario'] {
  const r = rappresentanteDi(c);
  return { nome: nomeSoggetto(r), codiceFiscale: r?.codiceFiscale ?? '', indirizzo: r?.indirizzo ?? '' };
}

export function salvaRegolePagamenti(regole: RegoleComune['pagamenti']) {
  aggiornaDb((db) => ({ regole: { ...db.regole, pagamenti: regole } }));
  registra('Regole del Comune: scadenze e pagamenti aggiornati');
  toast('Regole salvate');
}

// ---------------------------------------------------------------------------
// Invii tramite DAT (simulati): lotti, canali, esiti
// ---------------------------------------------------------------------------

export const NOMI_CANALE: Record<CanaleDat, string> = { posta_certa: 'Posta Certa', raccomandata_certa: 'Raccomandata Certa', notifica_certa: 'Notifica Certa' };
export const DESCRIZIONE_CANALE: Record<CanaleDat, string> = {
  posta_certa: 'Posta con data certa e tracciamento', raccomandata_certa: 'Raccomandata con ricevuta di ritorno', notifica_certa: 'Notifica a mano con il messo',
};
export const NOMI_ESITO: Record<EsitoInvio, string> = { in_lavorazione: 'In lavorazione', spedito: 'Spedito', consegnato: 'Consegnato', notificato: 'Notificato', non_consegnato: 'Non consegnato' };
export const CLASSE_ESITO: Record<EsitoInvio, string> = { in_lavorazione: '', spedito: 'badge--blu', consegnato: 'badge--verde', notificato: 'badge--verde', non_consegnato: 'badge--rosso' };
export const NOMI_LETTERA: Record<TipoLettera, string> = {
  scadenza_concessione: 'Lettera di scadenza', esumazione_dovuta: 'Lettera di scadenza', avviso_pagamento: 'Avviso di pagamento', sollecito: 'Sollecito', diffida: 'Diffida',
  diffida_decadenza: 'Diffida di decadenza',
};
const MOTIVI_NON_CONSEGNA = ['Irreperibile', 'Indirizzo errato', 'Destinatario deceduto', 'Rifiutato'];

export type NuovaLettera = Omit<InvioDat, 'id' | 'lottoId' | 'esito' | 'esitoIl' | 'motivoNonConsegna'>;

function chiudiInvii(lottoId: string) {
  const db = leggiStato().db;
  const lotto = db.lotti.find((l) => l.id === lottoId);
  if (!lotto) return;
  const oggi = oggiISO();
  const chiusi: InvioDat[] = [];
  aggiornaDb((d) => ({
    invii: d.invii.map((i) => {
      if (i.lottoId !== lottoId || (i.esito !== 'in_lavorazione' && i.esito !== 'spedito')) return i;
      // quasi tutti consegnati, circa uno su dieci no
      const no = Math.random() < 0.1;
      const n: InvioDat = no
        ? { ...i, esito: 'non_consegnato', esitoIl: oggi, motivoNonConsegna: MOTIVI_NON_CONSEGNA[Math.floor(Math.random() * MOTIVI_NON_CONSEGNA.length)] }
        : { ...i, esito: lotto.canale === 'notifica_certa' ? 'notificato' : 'consegnato', esitoIl: oggi };
      chiusi.push(n);
      return n;
    }),
  }));
  // lo storico della concessione riceve la riga della lettera
  const perConcessione = new Map(chiusi.filter((i) => i.concessioneId && i.esito !== 'non_consegnato').map((i) => [i.concessioneId!, i]));
  if (perConcessione.size)
    aggiornaDb((d) => ({
      concessioni: d.concessioni.map((c) => {
        const i = perConcessione.get(c.id);
        return i ? { ...c, storico: [...c.storico, { data: oggi, azione: `${NOMI_LETTERA[i.tipo]} tramite DAT – ${NOMI_ESITO[i.esito].toLowerCase()} il ${data(oggi)}`, operatore: lotto.operatore }] } : c;
      }),
    }));
  const no = chiusi.filter((i) => i.esito === 'non_consegnato').length;
  if (no) avvisa([firmaCorrente()], { livello: 'attenzione', titolo: `Lotto ${lotto.numero}: ${no === 1 ? 'un invio non consegnato' : `${no} non consegnati`}`, messaggio: 'Correggi l\'indirizzo e reinvia.', link: `/scadenze?tab=invii&lotto=${lotto.id}` }, true);
}

/** Crea un lotto: un canale per lotto. Gli esiti arrivano da soli pochi secondi dopo (simulazione). */
export function inviaTramiteDat(lettere: NuovaLettera[], canale: CanaleDat): LottoDat | null {
  if (!lettere.length) return null;
  const db = leggiStato().db;
  const lotto: LottoDat = { id: `lotto-${Date.now().toString(36)}`, numero: Math.max(0, ...db.lotti.map((l) => l.numero)) + 1, data: oggiISO(), canale, operatore: utenteCorrente(), simulato: true };
  const invii: InvioDat[] = lettere.map((l, k) => ({ ...l, id: `inv-${Date.now().toString(36)}-${k}`, lottoId: lotto.id, esito: 'in_lavorazione' }));
  aggiornaDb((d) => ({ lotti: [...d.lotti, lotto], invii: [...d.invii, ...invii] }));
  window.setTimeout(() => aggiornaDb((d) => ({ invii: d.invii.map((i) => (i.lottoId === lotto.id && i.esito === 'in_lavorazione' ? { ...i, esito: 'spedito' } : i)) })), 2500);
  window.setTimeout(() => chiudiInvii(lotto.id), 6000);
  return lotto;
}

/** Se la pagina è stata ricaricata prima degli esiti, li chiude adesso. */
export function sistemaInviiSospesi() {
  const sospesi = new Set(leggiStato().db.invii.filter((i) => i.esito === 'in_lavorazione' || i.esito === 'spedito').map((i) => i.lottoId));
  for (const id of sospesi) window.setTimeout(() => chiudiInvii(id), 6500);
}

/** Non consegnato: si corregge l'indirizzo e si reinvia, in un nuovo lotto e anche con un altro canale. */
export function reinvia(invioId: string, indirizzo: string, canale: CanaleDat) {
  const i = leggiStato().db.invii.find((x) => x.id === invioId);
  if (!i) return null;
  const { id: _id, lottoId: _l, esito: _e, esitoIl: _d, motivoNonConsegna: _m, ...resto } = i;
  void _id; void _l; void _e; void _d; void _m;
  return inviaTramiteDat([{ ...resto, destinatario: { ...i.destinatario, indirizzo } }], canale);
}

/** L'ultima lettera inviata per una riga dello scadenzario (o per un avviso). */
export function ultimaLettera(invii: InvioDat[], riferimento: string): InvioDat | undefined {
  let ultimo: InvioDat | undefined;
  for (const i of invii) if (i.riferimento === riferimento) ultimo = i;
  return ultimo;
}

// ---------------------------------------------------------------------------
// Scadenzario unico: concessioni in scadenza, fosse a fine turno, postazioni da liberare
// ---------------------------------------------------------------------------

export type TipoScadenza = 'concessione' | 'fine_turno' | 'da_liberare';
export const NOMI_SCADENZA: Record<TipoScadenza, string> = { concessione: 'Concessione in scadenza', fine_turno: 'Fossa a fine turno', da_liberare: 'Postazione da liberare' };

export interface RigaScadenza {
  chiave: string;
  tipo: TipoScadenza;
  data: string;
  giorni: number;
  titolo: string;
  schedaId: string;
  viale: string;
  defunti: string;
  concessioneId?: string;
  /** vuoto = "Nessun destinatario" */
  destinatari: Destinatario[];
}

export function destinatarioConcessione(c: Concessione): Destinatario | null {
  const r = rappresentanteDi(c);
  if (!r || !r.indirizzo) return null;
  // per un ente: al legale rappresentante, all'indirizzo dell'ente
  return { nome: r.tipo === 'ente' ? `${r.denominazione ?? ''}${r.legaleRappresentante ? ` · c.a. ${r.legaleRappresentante}` : ''}` : nomeSoggetto(r), indirizzo: r.indirizzo };
}

export function righeScadenzario(db: Database, cimiteroId: string, oggi = oggiISO()): RigaScadenza[] {
  const schede = indiceSchede(db.schede);
  const out: RigaScadenza[] = [];
  const nomi = (s?: Scheda) => (s ? s.defunti.map((d) => nomeCompleto(d)).join(', ') : '');
  const abbonati = (ids: string[], esclusoCf?: string): Destinatario[] => {
    const set = new Set(ids);
    return db.utenze
      .filter((u) => u.stato === 'attiva' && set.has(u.schedaId) && u.abbonato.codiceFiscale !== esclusoCf)
      .map((u) => ({ nome: nomeSoggetto(u.abbonato), indirizzo: u.abbonato.indirizzoBolletta || u.abbonato.indirizzo }));
  };
  for (const c of db.concessioni) {
    if (c.cimiteroId !== cimiteroId) continue;
    const s = schede.get(c.schedeIds[0]);
    const dest = destinatarioConcessione(c);
    const tutti = [...(dest ? [dest] : []), ...abbonati(c.schedeIds, rappresentanteDi(c)?.codiceFiscale)];
    if (c.stato === 'chiusa') {
      // concessione chiusa con la postazione ancora occupata: va liberata
      const occupate = c.schedeIds.map((id) => schede.get(id)).filter((x): x is Scheda => !!x && x.defunti.length > 0);
      for (const o of occupate)
        out.push({
          chiave: `libera:${c.id}:${o.id}`, tipo: 'da_liberare', data: c.chiusaIl ?? c.scadenza, giorni: giorniTra(oggi, c.chiusaIl ?? c.scadenza), titolo: `Concessione ${c.numero} chiusa`,
          schedaId: o.id, viale: o.viale, defunti: nomi(o), concessioneId: c.id, destinatari: dest ? [dest] : [],
        });
      continue;
    }
    const e = statoEffettivo(c, db.regole, oggi);
    if (e.stato !== 'in_scadenza' && !(e.stato === 'chiusa' && e.motivo === 'scaduta')) continue;
    out.push({
      chiave: `conc:${c.id}`, tipo: 'concessione', data: c.scadenza, giorni: e.giorni, titolo: `Concessione ${c.numero} · ${NOMI_TIPO_CONCESSIONE[c.tipo].toLowerCase()}`,
      schedaId: c.schedeIds[0], viale: s?.viale ?? '', defunti: nomi(s), concessioneId: c.id, destinatari: tutti,
    });
  }
  // fosse a fine turno: il destinatario è il richiedente della pratica di inumazione, se c'è
  const limite = aggiungiGiorni(oggi, 183);
  for (const s of db.schede) {
    if (s.cimiteroId !== cimiteroId || s.tipologia !== 'fossa' || !s.defunti.length) continue;
    const fine = fineTurno(s, db.regole);
    if (!fine || fine > limite) continue;
    const pr = db.pratiche.find((p) => p.tipo === 'inumazione' && p.schedaId === s.id && p.richiedente?.indirizzo);
    out.push({
      chiave: `turno:${s.id}`, tipo: 'fine_turno', data: fine, giorni: giorniTra(oggi, fine), titolo: `Fine del turno di ${db.regole.campoComune.turnoAnni} anni`, schedaId: s.id, viale: s.viale,
      defunti: nomi(s), destinatari: [...(pr?.richiedente?.indirizzo ? [{ nome: pr.richiedente.nome, indirizzo: pr.richiedente.indirizzo }] : []), ...abbonati([s.id])],
    });
  }
  return out.sort((a, b) => a.data.localeCompare(b.data));
}

/** Le lettere da mandare per una riga dello scadenzario: una per destinatario, nello stesso lotto. */
export function lettereDi(r: RigaScadenza): NuovaLettera[] {
  const tipo: TipoLettera = r.tipo === 'concessione' ? 'scadenza_concessione' : 'esumazione_dovuta';
  const oggetto = r.tipo === 'concessione' ? `Scadenza della ${r.titolo.toLowerCase()}` : `Postazione ${r.schedaId} da liberare`;
  return r.destinatari.map((destinatario) => ({ tipo, riferimento: r.chiave, destinatario, oggetto, schedaId: r.schedaId, concessioneId: r.concessioneId }));
}

/** Dallo scadenzario si aprono le pratiche d'ufficio: una per defunto. Salta chi ha già una pratica in corso. */
export function apriPraticheDUfficio(righe: RigaScadenza[]): number {
  const db = leggiStato().db;
  const schede = indiceSchede(db.schede);
  let n = 0;
  for (const r of righe) {
    if (r.tipo === 'concessione') continue;
    const s = schede.get(r.schedaId);
    if (!s) continue;
    for (const d of s.defunti) {
      const inCorso = leggiStato().db.pratiche.some((p) => p.schedaId === s.id && (p.stato === 'aperta' || p.stato === 'programmata') && p.defunto.nome === d.nome && p.defunto.cognome === d.cognome);
      if (inCorso) continue;
      apriPratica({ cimiteroId: s.cimiteroId, tipo: s.tipologia === 'fossa' ? 'esumazione' : 'estumulazione', straordinaria: false, oggetto: 'resti', dUfficio: true, defunto: d, schedaId: s.id }, true);
      n++;
    }
  }
  return n;
}

// ---------------------------------------------------------------------------
// Testi delle lettere: fissi per tipo, non modificabili nella demo
// ---------------------------------------------------------------------------

export function testoLettera(i: Pick<InvioDat, 'tipo' | 'oggetto' | 'riferimento' | 'schedaId' | 'concessioneId' | 'avvisoId'>): string[] {
  const db = leggiStato().db;
  const c = i.concessioneId ? db.concessioni.find((x) => x.id === i.concessioneId) : i.schedaId ? concessioneDi(i.schedaId) : undefined;
  const s = i.schedaId ? indiceSchede(db.schede).get(i.schedaId) : undefined;
  const cim = db.cimiteri.find((x) => x.id === (s?.cimiteroId ?? c?.cimiteroId));
  const a = i.avvisoId ? db.avvisi.find((x) => x.id === i.avvisoId) : undefined;
  const dove = s ? `postazione ${s.id} (${s.viale}), ${cim?.nome ?? ''}` : '';
  const defunti = s?.defunti.length ? `Defunti: ${s.defunti.map((d) => nomeCompleto(d)).join(', ')}.` : '';
  const ufficio = 'Ufficio Servizi Cimiteriali del Comune, negli orari di apertura al pubblico.';
  switch (i.tipo) {
    case 'scadenza_concessione': {
      const tariffa = c ? db.regole.concessioni.tariffe[c.tipo].rinnovo : 0;
      return [
        `La concessione ${c?.numero ?? ''} per la ${dove} scade il ${data(c?.scadenza)}.`,
        defunti,
        `Può rinnovarla per ${db.regole.concessioni.durataRinnovo} anni entro la data di scadenza. La tariffa del rinnovo è di ${tariffa.toFixed(2).replace('.', ',')} €: l'avviso di pagamento Le sarà consegnato quando l'ufficio registra il rinnovo.`,
        `Per rinnovare si rivolga a: ${ufficio}`,
        'Se la concessione non viene rinnovata, alla scadenza la postazione torna al Comune e i resti vengono raccolti e portati nell\'ossario comune.',
      ];
    }
    case 'esumazione_dovuta':
      return [
        `La ${dove} deve essere liberata: ${s?.tipologia === 'fossa' ? 'il turno della fossa in campo comune è finito' : 'la concessione è chiusa'}.`,
        defunti,
        `L'operazione si farà a partire dal ${data(aggiungiGiorni(oggiISO(), 60))}.`,
        'I resti possono andare nell\'ossario comune, nel cinerario comune, in un\'altra postazione oppure fuori Comune.',
        `La invitiamo a contattare l'ufficio entro 30 giorni dal ricevimento di questa lettera: ${ufficio}`,
        'Senza una risposta i resti saranno portati nell\'ossario comune.',
      ];
    case 'avviso_pagamento':
      return [`Le inviamo l'avviso di pagamento per: ${a?.causale ?? ''}.`, `Importo: ${(a?.importo ?? 0).toFixed(2).replace('.', ',')} €, da pagare entro il ${data(a?.scadenza)} con pagoPA.`, `Per informazioni: ${ufficio}`];
    case 'sollecito':
      return [`L'avviso di pagamento per "${a?.causale ?? ''}" di ${(a?.importo ?? 0).toFixed(2).replace('.', ',')} € risulta non pagato alla scadenza del ${data(a?.scadenza)}.`, `La invitiamo a pagare entro ${db.regole.pagamenti.giorniDopoSollecito} giorni dal ricevimento di questo sollecito.`, `Per informazioni: ${ufficio}`];
    case 'diffida':
      return [`Nonostante il sollecito, l'avviso di pagamento per "${a?.causale ?? ''}" di ${(a?.importo ?? 0).toFixed(2).replace('.', ',')} € non risulta pagato.`, `La diffidiamo a pagare entro ${db.regole.pagamenti.giorniDopoDiffida} giorni dal ricevimento.`, a?.motivo === 'utenza' ? 'In mancanza del pagamento il servizio di illuminazione votiva sarà sospeso.' : 'In mancanza del pagamento il Comune procederà secondo il regolamento.'];
    case 'diffida_decadenza':
      return [`Il Comune ha avviato la decadenza della concessione ${c?.numero ?? ''} per la ${dove}.`, defunti, 'La diffidiamo a regolarizzare la posizione entro 30 giorni dalla notifica.', 'In mancanza, la decadenza sarà dichiarata e la postazione tornerà al Comune.', `Per informazioni: ${ufficio}`];
  }
}

