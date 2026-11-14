import { useEffect, useMemo, useState } from 'react';
import { Ban, Download, FileSignature, History, Plus, Printer, RefreshCw, ScrollText, Search, ShieldAlert, Trash2, UserRoundPlus, Users, X } from 'lucide-react';
import { AvvisiDi, Moroso } from '../components/Avvisi';
import { BarraPagine, paginaDi } from '../components/Esporta';
import { EditorConcessionari, SOGGETTO_VUOTO, soggettoIncompleto } from '../components/Soggetti';
import { Field, Modal, Seg, StatoBadge, Tabs } from '../components/ui';
import {
  NOMI_TIPO_CONCESSIONE, SENZA_SCADENZA, TIPI_CONCESSIONE, anniDopo, chiudiConcessione, durataLeggibile, etichettaStato, indiceConcessioni, nomeSoggetto,
  nomiConcessionari, nuovaConcessione, postiOccupati, rappresentanteDi, rinnovaConcessione, salvaAventiDiritto, scadenzaLeggibile, statoEffettivo, subentroConcessione,
  tipoConcessioneDi,
} from '../data/concessioni';
import { avviaDecadenzaConDiffida } from '../data/scadenze';
import { indiceSchede, seleziona, toast, useStore } from '../data/store';
import { descrizioneScheda, useCimitero } from '../data/selectors';
import type { AventeDiritto, Concessionario, Concessione, Scheda } from '../data/types';
import { scaricaExcel } from '../lib/excel';
import { pdfContrattoConcessione } from '../lib/pdf';
import { data, normalizza, numero, oggiISO } from '../lib/format';
import { setQuery, useRotta } from '../router';

type Tab = 'concessioni' | 'concessionari';
type Filtro = 'attiva' | 'in_scadenza' | 'in_decadenza' | 'scaduta' | 'chiusa';
const FILTRI: { id: Filtro; label: string }[] = [
  { id: 'attiva', label: 'Attive' }, { id: 'in_scadenza', label: 'In scadenza' }, { id: 'in_decadenza', label: 'In decadenza' },
  { id: 'scaduta', label: 'Scadute' }, { id: 'chiusa', label: 'Chiuse' },
];

function BadgeStato({ c }: { c: Concessione }) {
  const regole = useStore((s) => s.db.regole);
  const e = etichettaStato(statoEffettivo(c, regole));
  return <span className={`badge badge--sm ${e.classe}`}>{e.testo}</span>;
}

export function ConcessioniPage() {
  const rotta = useRotta();
  const tab: Tab = rotta.query.get('tab') === 'concessionari' ? 'concessionari' : 'concessioni';
  const selId = rotta.query.get('id');
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const concessioni = useMemo(() => db.concessioni.filter((c) => c.cimiteroId === cim.id), [db.concessioni, cim.id]);
  const schede = indiceSchede(db.schede);
  const [q, setQ] = useState('');
  const [filtri, setFiltri] = useState<Filtro[]>(['attiva', 'in_scadenza', 'in_decadenza', 'scaduta']);
  const [tipo, setTipo] = useState('');
  const [pagina, setPagina] = useState(0);
  const [nuova, setNuova] = useState(false);

  const conStato = useMemo(() => concessioni.map((c) => {
    const e = statoEffettivo(c, db.regole);
    const f: Filtro = e.stato === 'chiusa' ? (e.motivo === 'scaduta' && c.stato !== 'chiusa' ? 'scaduta' : 'chiusa') : e.stato;
    return { c, f };
  }), [concessioni, db.regole]);
  const lista = useMemo(() => {
    const t = normalizza(q);
    return conStato
      .filter(({ c, f }) => filtri.includes(f) && (!tipo || c.tipo === tipo))
      .filter(({ c }) => !t || normalizza(`${c.numero} ${c.concessionari.map((x) => `${nomeSoggetto(x)} ${x.codiceFiscale}`).join(' ')} ${c.schedeIds.join(' ')}`).includes(t))
      .map((x) => x.c)
      .sort((a, b) => a.scadenza.localeCompare(b.scadenza));
  }, [conStato, filtri, tipo, q]);
  useEffect(() => setPagina(0), [q, filtri, tipo]);
  const conta = (f: Filtro) => conStato.filter((x) => x.f === f).length;
  const sel = selId ? db.concessioni.find((c) => c.id === selId) : undefined;

  const esporta = () => scaricaExcel(`CimiTera_${cim.codice}_concessioni_${oggiISO()}`, [{
    nome: 'Concessioni',
    righe: lista.map((c) => {
      const r = rappresentanteDi(c);
      return {
        Numero: c.numero, Concessionario: nomiConcessionari(c), 'Codice fiscale': r?.codiceFiscale ?? '', Indirizzo: r?.indirizzo ?? '', Tipo: NOMI_TIPO_CONCESSIONE[c.tipo],
        Schede: c.schedeIds.length === 1 ? c.schedeIds[0] : `${c.schedeIds[0]} e altre ${c.schedeIds.length - 1}`, Decorrenza: data(c.decorrenza), Scadenza: scadenzaLeggibile(c),
        Rinnovi: c.rinnovi, Stato: etichettaStato(statoEffettivo(c, db.regole)).testo,
      };
    }),
  }]);

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Concessioni</h1>
        </div>
        <div className="page-head__actions">
          {tab === 'concessioni' && <button className="btn" disabled={!lista.length} onClick={esporta}><Download size={16} />Esporta {numero(lista.length)}</button>}
          <button className="btn btn--primary" onClick={() => setNuova(true)}><Plus size={16} />Nuova concessione</button>
        </div>
      </div>
      <Tabs value={tab} onChange={(t) => setQuery('tab', t === 'concessioni' ? null : t)} tabs={[
        { id: 'concessioni', label: 'Concessioni', icon: <ScrollText size={16} />, count: concessioni.filter((c) => c.stato !== 'chiusa').length },
        { id: 'concessionari', label: 'Concessionari', icon: <Users size={16} /> },
      ]} />

      {tab === 'concessioni' && (
        <section className="card">
          <div className="card__head" style={{ flexWrap: 'wrap' }}>
            <div className="row gap-8 row--wrap">
              <div className="input-icon" style={{ width: 280 }}>
                <Search size={16} />
                <input className="input input--sm" placeholder="Cerca numero, concessionario o scheda" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              {FILTRI.map((f) => (
                <button key={f.id} className={`chip chip--sm ${filtri.includes(f.id) ? 'is-on' : ''}`} onClick={() => setFiltri(filtri.includes(f.id) ? filtri.filter((x) => x !== f.id) : [...filtri, f.id])}>
                  {f.label}<span className="chip__n">{conta(f.id)}</span>
                </button>
              ))}
            </div>
            <select className="select select--sm" style={{ width: 'auto' }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Tutti i tipi</option>
              {TIPI_CONCESSIONE.map((t) => <option key={t} value={t}>{NOMI_TIPO_CONCESSIONE[t]}</option>)}
            </select>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Numero</th><th>Concessionario</th><th>Tipo</th><th>Postazione</th><th>Decorrenza</th><th>Scadenza</th><th>Stato</th></tr></thead>
              <tbody>
                {paginaDi(lista, pagina).map((c) => {
                  const s = schede.get(c.schedeIds[0]);
                  return (
                    <tr key={c.id} className={`clickable ${selId === c.id ? 'is-sel' : ''}`} onClick={() => setQuery('id', c.id)}>
                      <td className="id">{c.numero}</td>
                      <td><b>{nomiConcessionari(c)}</b> <Moroso codiceFiscale={rappresentanteDi(c)?.codiceFiscale} /></td>
                      <td>{NOMI_TIPO_CONCESSIONE[c.tipo]}</td>
                      <td>
                        <span className="id">{c.schedeIds[0]}</span>
                        <div className="tiny muted">{s ? `${descrizioneScheda(s)} · ${s.viale}` : ''}{c.schedeIds.length > 1 ? ` · ${c.postiTotali} posti` : ''}</div>
                      </td>
                      <td className="nowrap">{data(c.decorrenza)}</td>
                      <td className="nowrap">{scadenzaLeggibile(c)}</td>
                      <td><BadgeStato c={c} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!lista.length && <div className="empty"><h3>Nessuna concessione con questi filtri</h3></div>}
          </div>
          <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
        </section>
      )}

      {tab === 'concessionari' && <Concessionari concessioni={concessioni} onCerca={(nome) => { setQ(nome); setFiltri(FILTRI.map((f) => f.id)); setQuery('tab', null); }} />}

      {sel && <Dettaglio c={sel} onChiudi={() => setQuery('id', null)} />}
      {nuova && <ModaleNuova onChiudi={() => setNuova(false)} onCreata={(id) => { setNuova(false); setQuery('id', id); }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Concessionari: chi ha una o più concessioni
// ---------------------------------------------------------------------------

function Concessionari({ concessioni, onCerca }: { concessioni: Concessione[]; onCerca: (nome: string) => void }) {
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(0);
  const gruppi = useMemo(() => {
    const m = new Map<string, { nome: string; cf: string; ente: boolean; lista: Concessione[] }>();
    for (const c of concessioni) {
      if (c.stato === 'chiusa') continue;
      for (const x of c.concessionari) {
        const k = x.codiceFiscale || nomeSoggetto(x);
        const g = m.get(k);
        if (g) g.lista.push(c);
        else m.set(k, { nome: nomeSoggetto(x), cf: x.codiceFiscale, ente: x.tipo === 'ente', lista: [c] });
      }
    }
    return [...m.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [concessioni]);
  const lista = useMemo(() => {
    const t = normalizza(q);
    return gruppi.filter((g) => !t || normalizza(`${g.nome} ${g.cf}`).includes(t));
  }, [gruppi, q]);
  useEffect(() => setPagina(0), [q]);
  return (
    <section className="card">
      <div className="card__head">
        <div className="input-icon" style={{ width: 280 }}>
          <Search size={16} />
          <input className="input input--sm" placeholder="Cerca concessionario o codice fiscale" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="small muted">{numero(lista.length)} concessionari</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Concessionario</th><th>Codice fiscale</th><th className="num">Concessioni</th><th>Prossima scadenza</th></tr></thead>
          <tbody>
            {paginaDi(lista, pagina).map((g) => (
              <tr key={g.cf || g.nome} className="clickable" onClick={() => onCerca(g.cf || g.nome)}>
                <td><b>{g.nome}</b>{g.ente && <span className="badge badge--sm" style={{ marginLeft: 8 }}>Ente</span>}</td>
                <td className="mono small">{g.cf}</td>
                <td className="num">{g.lista.length}</td>
                <td className="nowrap">{scadenzaLeggibile({ scadenza: g.lista.reduce((m, c) => (c.scadenza < m ? c.scadenza : m), SENZA_SCADENZA), perpetua: g.lista.every((c) => c.perpetua) })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lista.length && <div className="empty"><h3>Nessun concessionario trovato</h3></div>}
      </div>
      <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Dettaglio del contratto e azioni
// ---------------------------------------------------------------------------

type Azione = 'rinnovo' | 'subentro' | 'rinuncia' | 'avvia_decadenza' | 'decadenza';

function Dettaglio({ c, onChiudi }: { c: Concessione; onChiudi: () => void }) {
  const db = useStore((s) => s.db);
  const schede = indiceSchede(db.schede);
  const e = statoEffettivo(c, db.regole);
  const et = etichettaStato(e);
  const [azione, setAzione] = useState<Azione | null>(null);
  const chiusa = c.stato === 'chiusa';
  const occupati = postiOccupati(c, schede);
  return (
    <div className="overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onChiudi()}>
      <div className="modal modal--xl" role="dialog" aria-modal="true">
        <div className="modal__head">
          <div>
            <div className="row gap-8"><span className={`badge ${et.classe}`}>{et.testo}</span><span className="badge">{NOMI_TIPO_CONCESSIONE[c.tipo]}</span></div>
            <h2 className="mt-8">Concessione {c.numero}</h2>
          </div>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={onChiudi} aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="modal__body">
          <div className="griglia griglia--2">
            <div className="col gap-16">
              <section className="sez">
                <h4 className="sez__t">Contratto</h4>
                <dl className="kv">
                  <dt>Stipula</dt><dd>{data(c.dataStipula)}{c.provvedimento ? ` · ${c.provvedimento}` : ''}</dd>
                  <dt>Decorrenza</dt><dd>{data(c.decorrenza)}</dd>
                  <dt>Durata</dt><dd>{durataLeggibile(c)}{c.rinnovi ? ` · ${c.rinnovi} ${c.rinnovi === 1 ? 'rinnovo' : 'rinnovi'}` : ''}</dd>
                  {c.perpetua ? (<><dt>Scadenza</dt><dd><b>Non scade</b></dd></>) : (<><dt>Scadenza</dt><dd><b>{data(c.scadenza)}</b>{!chiusa && <span className="muted"> · {e.giorni >= 0 ? `tra ${numero(e.giorni)} giorni` : `da ${numero(-e.giorni)} giorni`}</span>}</dd></>)}
                  <dt>Regola applicata</dt><dd>{c.regola}</dd>
                  <dt>Posti</dt><dd>{occupati} occupati su {c.postiTotali}</dd>
                  {chiusa && (<><dt>Chiusa il</dt><dd>{data(c.chiusaIl)}</dd></>)}
                </dl>
              </section>
              <section className="sez">
                <h4 className="sez__t">{c.concessionari.length > 1 ? `Concessionari (${c.concessionari.length})` : 'Concessionario'}</h4>
                <div className="col gap-8">
                  {c.concessionari.map((x, i) => (
                    <div key={i} className="soggetto">
                      <div className="row gap-8"><b>{nomeSoggetto(x)}</b>{x.legameDefunto && <span className="badge badge--sm">{x.legameDefunto}</span>}{x.tipo === 'ente' && <span className="badge badge--sm">Ente</span>}{x.rappresentante && <span className="badge badge--sm badge--blu">Rappresentante</span>}<Moroso codiceFiscale={x.codiceFiscale} /></div>
                      <div className="small muted">{x.codiceFiscale} · {x.indirizzo}</div>
                      <div className="small muted">{[x.telefono, x.email, x.legaleRappresentante ? `Legale rappresentante: ${x.legaleRappresentante}` : ''].filter(Boolean).join(' · ')}</div>
                    </div>
                  ))}
                </div>
              </section>
              {c.tipo === 'tomba_famiglia' && <AventiDiritto c={c} />}
              <AvvisiDi motivo="concessione" id={c.id} />
            </div>
            <div className="col gap-16">
              <section className="sez">
                <h4 className="sez__t">{c.schedeIds.length > 1 ? `Schede collegate (${c.schedeIds.length})` : 'Scheda collegata'}</h4>
                <div className="col">
                  {c.schedeIds.slice(0, 8).map((id) => {
                    const s = schede.get(id);
                    return (
                      <button key={id} className="mini-row" onClick={() => { onChiudi(); seleziona(id); }}>
                        <span className="grow"><b>{id}</b><span className="small muted"> · {s ? `${descrizioneScheda(s)} · ${s.viale}` : ''}</span></span>
                        {s && <StatoBadge stato={s.stato} small />}
                      </button>
                    );
                  })}
                  {c.schedeIds.length > 8 && <p className="small muted">e altre {c.schedeIds.length - 8}.</p>}
                </div>
              </section>
              <section className="sez">
                <h4 className="sez__t"><History size={14} /> Storico</h4>
                <ol className="timeline">
                  {[...c.storico].reverse().map((ev, i) => (
                    <li key={i}>
                      <b>{ev.azione}</b>
                      <span className="tiny muted">{data(ev.data)}{ev.atto ? ` · ${ev.atto}` : ''} · {ev.operatore}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn" onClick={() => void pdfContrattoConcessione(c, db)}><Printer size={15} />Stampa il contratto</button>
          {!c.perpetua && <button className="btn" onClick={() => setAzione('rinnovo')}><RefreshCw size={15} />Rinnova</button>}
          {!chiusa && <button className="btn" onClick={() => setAzione('subentro')}><UserRoundPlus size={15} />Subentro</button>}
          {!chiusa && <button className="btn" onClick={() => setAzione('rinuncia')}><Ban size={15} />Rinuncia</button>}
          {c.stato === 'attiva' && <button className="btn" onClick={() => setAzione('avvia_decadenza')}><ShieldAlert size={15} />Avvia la decadenza</button>}
          {c.stato === 'in_decadenza' && <button className="btn btn--danger" onClick={() => setAzione('decadenza')}><ShieldAlert size={15} />Dichiara la decadenza</button>}
        </div>
      </div>
      {azione === 'subentro' && <ModaleSubentro c={c} onChiudi={() => setAzione(null)} />}
      {azione && azione !== 'subentro' && <ModaleAtto c={c} azione={azione} onChiudi={() => setAzione(null)} />}
    </div>
  );
}

function AventiDiritto({ c }: { c: Concessione }) {
  const [nome, setNome] = useState('');
  const [parentela, setParentela] = useState('');
  const lista: AventeDiritto[] = c.aventiDiritto ?? [];
  const aggiungi = () => {
    if (!nome.trim()) return;
    salvaAventiDiritto(c.id, [...lista, { nome: nome.trim(), parentela: parentela.trim() || '—' }]);
    setNome('');
    setParentela('');
  };
  return (
    <section className="sez">
      <h4 className="sez__t">Aventi diritto ({lista.length})</h4>
      <div className="col">
        {lista.map((a, i) => (
          <div key={i} className="mini-row">
            <span className="grow"><b>{a.nome}</b><span className="small muted"> · {a.parentela}</span></span>
            {c.stato !== 'chiusa' && <button className="btn btn--xs btn--icon btn--ghost" aria-label={`Togli ${a.nome}`} onClick={() => salvaAventiDiritto(c.id, lista.filter((_, j) => j !== i))}><Trash2 size={13} /></button>}
          </div>
        ))}
        {!lista.length && <p className="small muted">Nessuno indicato.</p>}
      </div>
      {c.stato !== 'chiusa' && (
        <form className="row gap-4 mt-8" onSubmit={(e) => { e.preventDefault(); aggiungi(); }}>
          <input className="input input--sm" placeholder="Nome e cognome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className="input input--sm" placeholder="Parentela" style={{ maxWidth: 140 }} value={parentela} onChange={(e) => setParentela(e.target.value)} />
          <button className="btn btn--sm" disabled={!nome.trim()}><Plus size={14} /></button>
        </form>
      )}
    </section>
  );
}

const TESTI: Record<Exclude<Azione, 'subentro'>, { titolo: string; testo: string; bottone: string }> = {
  rinnovo: { titolo: 'Rinnova', testo: 'La scadenza si sposta in avanti della durata del rinnovo scritta nelle Regole del Comune.', bottone: 'Rinnova' },
  rinuncia: { titolo: 'Rinuncia', testo: 'Il concessionario rinuncia: il contratto si chiude oggi.', bottone: 'Registra la rinuncia' },
  avvia_decadenza: { titolo: 'Avvia la decadenza', testo: 'La diffida parte tramite DAT con Notifica Certa (simulato). Il contratto resta in corso finché la decadenza non è dichiarata.', bottone: 'Avvia la decadenza' },
  decadenza: { titolo: 'Dichiara la decadenza', testo: 'Il contratto si chiude oggi. Le postazioni ancora occupate restano da liberare.', bottone: 'Dichiara la decadenza' },
};

function ModaleAtto({ c, azione, onChiudi }: { c: Concessione; azione: Exclude<Azione, 'subentro'>; onChiudi: () => void }) {
  const regole = useStore((s) => s.db.regole.concessioni);
  const [atto, setAtto] = useState('');
  const t = TESTI[azione];
  const esegui = () => {
    if (azione === 'rinnovo') rinnovaConcessione(c.id, atto);
    else if (azione === 'rinuncia') chiudiConcessione(c.id, 'rinunciata', atto);
    else if (azione === 'avvia_decadenza') avviaDecadenzaConDiffida(c.id, atto);
    else chiudiConcessione(c.id, 'decaduta', atto);
    onChiudi();
  };
  return (
    <Modal titolo={`${t.titolo} · ${c.numero}`} sottotitolo={t.testo} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className={`btn ${azione === 'rinnovo' ? 'btn--primary' : 'btn--danger'}`} onClick={esegui}>{t.bottone}</button></>}>
      <div className="col gap-16">
        {azione === 'rinnovo' && <p>Nuova scadenza: <b>{data(anniDopo(c.scadenza, regole.durataRinnovo))}</b> ({regole.durataRinnovo} anni in più).</p>}
        <Field label="Atto" hint="Per esempio il numero della determina o del protocollo">
          <input className="input" value={atto} onChange={(e) => setAtto(e.target.value)} autoFocus />
        </Field>
      </div>
    </Modal>
  );
}

function ModaleSubentro({ c, onChiudi }: { c: Concessione; onChiudi: () => void }) {
  const [nuovi, setNuovi] = useState<Concessionario[]>([{ ...SOGGETTO_VUOTO }]);
  const [atto, setAtto] = useState('');
  const salva = () => {
    const err = nuovi.map(soggettoIncompleto).find(Boolean);
    if (err) return toast(err, 'errore');
    subentroConcessione(c.id, nuovi, atto);
    onChiudi();
  };
  return (
    <Modal titolo={`Subentro · ${c.numero}`} sottotitolo={`Oggi: ${nomiConcessionari(c)}. Il contratto e la scadenza non cambiano.`} size="lg" onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={salva}>Registra il subentro</button></>}>
      <div className="col gap-16">
        <EditorConcessionari valore={nuovi} onChange={setNuovi} />
        <Field label="Atto"><input className="input" value={atto} onChange={(e) => setAtto(e.target.value)} placeholder="Per esempio: dichiarazione di successione, determina" /></Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Nuova concessione
// ---------------------------------------------------------------------------

function ModaleNuova({ onChiudi, onCreata }: { onChiudi: () => void; onCreata: (id: string) => void }) {
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const regole = db.regole.concessioni;
  const [q, setQ] = useState('');
  const [scheda, setScheda] = useState<Scheda | null>(null);
  const [decorrenza, setDecorrenza] = useState(oggiISO());
  const [provvedimento, setProvvedimento] = useState('');
  const [posti, setPosti] = useState(1);
  const [durata, setDurata] = useState<'regola' | 'altra' | 'perpetua'>('regola');
  const [anni, setAnni] = useState(50);
  const [concessionari, setConcessionari] = useState<Concessionario[]>([{ ...SOGGETTO_VUOTO }]);
  const conConcessione = indiceConcessioni(db.concessioni);

  // postazioni che si possono dare in concessione: del tipo giusto, senza un contratto in corso, non i posti di una cappella
  const candidate = useMemo(() => {
    const t = normalizza(q);
    if (t.length < 2) return [];
    return db.schede.filter((s) => {
      if (s.cimiteroId !== cim.id || !tipoConcessioneDi(s.tipologia) || conConcessione.has(s.id)) return false;
      return normalizza(`${s.id} ${descrizioneScheda(s)} ${s.viale}`).includes(t);
    }).slice(0, 8);
  }, [q, db.schede, cim.id, conConcessione]);

  const tipo = scheda ? tipoConcessioneDi(scheda.tipologia) : null;
  const postiStruttura = scheda?.strutturaId ? db.schede.filter((x) => x.posizione?.strutturaId === scheda.strutturaId) : [];
  const scegli = (s: Scheda) => {
    setScheda(s);
    const n = s.strutturaId ? db.schede.filter((x) => x.posizione?.strutturaId === s.strutturaId).length : s.tipologia === 'tomba_famiglia' ? Math.max(2, s.defunti.length) : 1;
    setPosti(n || 1);
  };
  const salva = () => {
    if (!scheda || !tipo) return toast('Scegli la postazione', 'errore');
    const err = concessionari.map(soggettoIncompleto).find(Boolean);
    if (err) return toast(err, 'errore');
    const c = nuovaConcessione({
      cimiteroId: cim.id, tipo, schedeIds: [scheda.id, ...postiStruttura.map((x) => x.id)], postiTotali: posti, concessionari,
      decorrenza, provvedimento: provvedimento.trim(), perpetua: durata === 'perpetua', durataAnni: durata === 'altra' ? Math.max(1, anni) : undefined,
    });
    onCreata(c.id);
  };

  return (
    <Modal titolo="Nuova concessione" size="lg" onClose={onChiudi} icona={<span className="list-item__icon" style={{ background: '#EAF2F9', color: '#1B5A8F' }}><FileSignature size={18} /></span>}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={salva}>Registra la concessione</button></>}>
      <div className="col gap-16">
        <Field label="Postazione">
          {scheda ? (
            <div className="scheda-pick">
              <div className="grow">
                <b>{scheda.id}</b> · {descrizioneScheda(scheda)}
                <div className="small muted">{scheda.viale}{postiStruttura.length ? ` · ${postiStruttura.length} posti a parete compresi` : ''}</div>
              </div>
              <button className="btn btn--xs" onClick={() => setScheda(null)}>Cambia</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input className="input" placeholder="Cerca per ID, nome o viale tra le postazioni senza concessione…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
              {candidate.length > 0 && (
                <div className="popover" style={{ left: 0, right: 0 }}>
                  {candidate.map((s) => (
                    <button key={s.id} className="popover__item" onClick={() => { scegli(s); setQ(''); }}>
                      <b>{s.id}</b>
                      <span className="grow ellipsis">{descrizioneScheda(s)} · {s.viale}</span>
                      <StatoBadge stato={s.stato} small />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Field>
        {tipo && (
          <>
            <div className="grid-form">
              <Field label="Tipo di concessione"><input className="input" value={NOMI_TIPO_CONCESSIONE[tipo]} readOnly /></Field>
              <Field label="Posti"><input className="input" type="number" min={1} value={posti} readOnly={!!postiStruttura.length || tipo !== 'tomba_famiglia'} onChange={(e) => setPosti(Math.max(1, Number(e.target.value)))} /></Field>
              <Field label="Decorrenza"><input className="input" type="date" value={decorrenza} onChange={(e) => setDecorrenza(e.target.value)} /></Field>
              <Field label="Provvedimento"><input className="input" value={provvedimento} onChange={(e) => setProvvedimento(e.target.value)} placeholder="Per esempio: Determina n. 123/2026" /></Field>
            </div>
            <div className="grid-form">
              <Field label="Durata" className="span-2">
                <Seg light value={durata} onChange={setDurata} options={[{ id: 'regola', label: `${regole.durate[tipo]} anni (Regole del Comune)` }, { id: 'altra', label: 'Altra durata' }, { id: 'perpetua', label: 'Perpetua' }]} />
              </Field>
              {durata === 'altra' && <Field label="Anni"><input className="input" type="number" min={1} max={99} value={anni} onChange={(e) => setAnni(Number(e.target.value))} /></Field>}
            </div>
            <p className="callout">
              {durata === 'perpetua' ? <>Concessione perpetua: <b>non scade</b> e non si rinnova.</> : <>Scade il <b>{data(anniDopo(decorrenza || oggiISO(), durata === 'altra' ? Math.max(1, anni) : regole.durate[tipo]))}</b>.</>}
              {scheda && !scheda.defunti.length && !scheda.strutturaId ? ' La postazione è vuota: resta prenotata per il concessionario finché non serve.' : ''}
            </p>
            <div>
              <h3 className="section-title">Concessionario</h3>
              <EditorConcessionari valore={concessionari} onChange={setConcessionari} />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
