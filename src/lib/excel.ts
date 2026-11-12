import * as XLSX from 'xlsx';
import { campiPer, conta, descrizioneScheda, labelLista, statoConcessione, statoDef, tipologiaDef, valoreLeggibile } from '../data/selectors';
import type { CampoDef, ConfigScheda, Database, Manutenzione, Scheda } from '../data/types';
import { anniTra, cognomeNome, data, oggiISO } from './format';

export type Riga = Record<string, string | number | null>;

export interface Foglio {
  nome: string;
  righe: Riga[];
}

export function scaricaExcel(nomeFile: string, fogli: Foglio[]) {
  const wb = XLSX.utils.book_new();
  for (const f of fogli) {
    const ws = XLSX.utils.json_to_sheet(f.righe.length ? f.righe : [{ Avviso: 'Nessun dato con i filtri selezionati' }]);
    const intestazioni = Object.keys(f.righe[0] ?? { Avviso: '' });
    ws['!cols'] = intestazioni.map((h) => ({
      wch: Math.min(48, Math.max(h.length + 2, ...f.righe.slice(0, 300).map((r) => String(r[h] ?? '').length + 1))),
    }));
    ws['!autofilter'] = { ref: ws['!ref'] ?? 'A1' };
    XLSX.utils.book_append_sheet(wb, ws, f.nome.slice(0, 31));
  }
  XLSX.writeFile(wb, nomeFile.endsWith('.xlsx') ? nomeFile : `${nomeFile}.xlsx`);
}

export interface ColonnaExport {
  id: string;
  label: string;
  valore: (s: Scheda, ctx: { config: ConfigScheda; db: Database }) => string | number | null;
}

/** Colonne disponibili per l'Excel delle schede: le fisse più i campi della configurazione. */
export function colonneDisponibili(config: ConfigScheda): ColonnaExport[] {
  const fisse: ColonnaExport[] = [
    { id: 'id', label: 'ID', valore: (s) => s.id },
    { id: 'tipologia', label: 'Tipologia', valore: (s, { config }) => tipologiaDef(config, s.tipologia).label },
    { id: 'stato', label: 'Stato', valore: (s, { config }) => statoDef(config, s.stato).label },
    { id: 'descrizione', label: 'Postazione / defunto', valore: (s) => descrizioneScheda(s) },
    { id: 'cognome', label: 'Cognome', valore: (s) => s.defunti[0]?.cognome ?? '' },
    { id: 'nome', label: 'Nome', valore: (s) => s.defunti[0]?.nome ?? '' },
    { id: 'nascita', label: 'Data di nascita', valore: (s) => data(s.defunti[0]?.dataNascita) },
    { id: 'morte', label: 'Data di morte', valore: (s) => data(s.defunti[0]?.dataMorte) },
    { id: 'anni', label: 'Deceduto da (anni)', valore: (s) => (s.defunti[0]?.dataMorte ? anniTra(s.defunti[0].dataMorte!, oggiISO()) : null) },
    { id: 'altri', label: 'Altri defunti', valore: (s) => s.defunti.slice(1).map(cognomeNome).join('; ') },
    { id: 'viale', label: 'Via / viale', valore: (s) => s.viale },
    { id: 'quadrante', label: 'Quadrante', valore: (s, { db }) => db.quadranti.find((q) => q.id === s.quadranteId)?.nome ?? '' },
    { id: 'struttura', label: 'Struttura', valore: (s, { db }) => db.strutture.find((x) => x.id === (s.posizione?.strutturaId ?? s.strutturaId))?.nome ?? '' },
    { id: 'posto', label: 'Posto', valore: (s) => (s.posizione ? `Fila ${s.posizione.fila} · Col. ${s.posizione.colonna}` : s.numeroPosto ?? '') },
    { id: 'lat', label: 'Latitudine', valore: (s) => s.lat },
    { id: 'lng', label: 'Longitudine', valore: (s) => s.lng },
    { id: 'conc_numero', label: 'N. concessione', valore: (s) => s.concessione?.numero ?? '' },
    { id: 'conc_intestatario', label: 'Concessionario', valore: (s) => s.concessione?.intestatario ?? '' },
    { id: 'conc_scadenza', label: 'Scadenza concessione', valore: (s) => data(s.concessione?.dataScadenza) },
    { id: 'conc_stato', label: 'Stato concessione', valore: (s) => statoConcessione(s)?.stato.replace('_', ' ') ?? '' },
    { id: 'rilevato', label: 'Rilevata il', valore: (s) => data(s.rilevatoIl) },
    { id: 'rilevatore', label: 'Rilevata da', valore: (s, { db }) => db.operatori.find((o) => o.id === s.rilevatoDa)?.nome ?? s.rilevatoDa },
    { id: 'note', label: 'Note', valore: (s) => s.note ?? '' },
  ];
  const dinamiche: ColonnaExport[] = campiPer(config).map((c: CampoDef) => ({
    id: `campo:${c.id}`,
    label: c.label,
    valore: (s) => (c.tipo === 'importo' || c.tipo === 'numero' ? ((s.campi[c.id] as number | undefined) ?? null) : valoreLeggibile(c, s.campi[c.id])),
  }));
  return [...fisse, ...dinamiche];
}

export function colonnePredefinite(config: ConfigScheda): string[] {
  return [
    'id', 'tipologia', 'stato', 'cognome', 'nome', 'morte', 'anni', 'viale', 'quadrante', 'posto', 'conc_scadenza',
    ...campiPer(config, undefined, (c) => c.inExport).map((c) => `campo:${c.id}`),
  ];
}

export function righeSchede(schede: Scheda[], colonne: ColonnaExport[], ctx: { config: ConfigScheda; db: Database }): Riga[] {
  return schede.map((s) => Object.fromEntries(colonne.map((c) => [c.label, c.valore(s, ctx)])));
}

export function righeLampadeVotive(schede: Scheda[], ctx: { config: ConfigScheda; db: Database }): Riga[] {
  const pag = ctx.config.campi.find((c) => c.id === 'stato_pagamenti');
  const righe: Riga[] = schede
    .filter((s) => s.campi.lampada_votiva === true)
    .sort((a, b) => String(a.campi.codice_utenza ?? '').localeCompare(String(b.campi.codice_utenza ?? '')))
    .map((s) => ({
      'Codice utenza': String(s.campi.codice_utenza ?? ''),
      Intestatario: String(s.campi.intestatario_utenza ?? s.concessione?.intestatario ?? ''),
      'ID scheda': s.id,
      'Defunto / postazione': descrizioneScheda(s),
      Ubicazione: `${s.viale}${s.posizione ? ` · fila ${s.posizione.fila} col. ${s.posizione.colonna}` : ''}`,
      'Canone €/anno': typeof s.campi.canone_lampada === 'number' ? s.campi.canone_lampada : 24,
      'Stato pagamenti': pag ? valoreLeggibile(pag, s.campi.stato_pagamenti) : String(s.campi.stato_pagamenti ?? ''),
    }));
  const totale = righe.reduce((t, r) => t + Number(r['Canone €/anno'] ?? 0), 0);
  righe.push({ 'Codice utenza': 'TOTALE', Intestatario: `${righe.length} utenze`, 'ID scheda': '', 'Defunto / postazione': '', Ubicazione: '', 'Canone €/anno': totale, 'Stato pagamenti': '' });
  return righe;
}

export function fogliTotali(schede: Scheda[], ctx: { config: ConfigScheda; db: Database }): Foglio[] {
  const { config, db } = ctx;
  const perStato = conta(schede, (s) => s.stato);
  const perTip = conta(schede, (s) => s.tipologia);
  const quadranti = db.quadranti.filter((q) => schede.some((s) => s.quadranteId === q.id));
  return [
    {
      nome: 'Per quadrante',
      righe: quadranti.map((q) => {
        const qs = schede.filter((s) => s.quadranteId === q.id);
        const riga: Riga = { Quadrante: q.nome, Censite: qs.length, Stimate: q.stimaManufatti, 'Avanzamento %': q.stimaManufatti ? Math.round((qs.length / q.stimaManufatti) * 100) : null };
        for (const st of config.stati) riga[st.label] = qs.filter((s) => s.stato === st.id).length;
        riga['Lampade votive'] = qs.filter((s) => s.campi.lampada_votiva === true).length;
        return riga;
      }),
    },
    { nome: 'Per stato', righe: config.stati.map((st) => ({ Stato: st.label, Schede: perStato[st.id] ?? 0 })) },
    { nome: 'Per tipologia', righe: config.tipologie.map((t) => ({ Tipologia: t.label, Schede: perTip[t.id] ?? 0 })) },
    {
      nome: 'Per viale',
      righe: Object.entries(conta(schede, (s) => s.viale)).sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ Viale: v, Schede: n })),
    },
  ];
}

export function righeScadenze(schede: Scheda[], ctx: { config: ConfigScheda; db: Database }): Riga[] {
  const pag = ctx.config.campi.find((c) => c.id === 'stato_pagamenti');
  return schede
    .filter((s) => s.concessione)
    .sort((a, b) => a.concessione!.dataScadenza.localeCompare(b.concessione!.dataScadenza))
    .map((s) => {
      const sc = statoConcessione(s);
      return {
        'ID scheda': s.id,
        'N. concessione': s.concessione!.numero,
        Intestatario: s.concessione!.intestatario,
        'Defunto / postazione': descrizioneScheda(s),
        Viale: s.viale,
        Scadenza: data(s.concessione!.dataScadenza),
        'Giorni alla scadenza': sc?.giorni ?? null,
        Durata: `${s.concessione!.durataAnni} anni`,
        'Stato pagamenti': pag ? valoreLeggibile(pag, s.campi.stato_pagamenti) : '',
      };
    });
}

export function righeManutenzioni(lista: Manutenzione[], db: Database, config: ConfigScheda): Riga[] {
  const nome = (id?: string) => (id === 'ufficio' ? 'Ufficio Cimiteri' : db.operatori.find((o) => o.id === id)?.nome ?? '');
  return lista.map((m) => ({
    ID: m.id, Scheda: m.schedaId, Categoria: labelLista(config.categorieManutenzione, m.categoria), Priorità: m.priorita, Stato: m.stato,
    Descrizione: m.descrizione, 'Segnalata da': nome(m.segnalataDa), 'Segnalata il': data(m.segnalataIl),
    'Programmata il': data(m.dataProgrammata), Operatori: (m.operatoriIds ?? []).map(nome).join(', '),
    'Risolta il': data(m.risoltaIl), 'Note risoluzione': m.noteRisoluzione ?? '', 'Annullata il': data(m.annullataIl), 'Motivo annullamento': m.motivoAnnullamento ?? '',
  }));
}
