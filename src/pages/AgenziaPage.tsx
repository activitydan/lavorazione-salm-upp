import { useState } from 'react';
import { Navigation, Plus, X } from 'lucide-react';
import { BadgeAvviso } from '../components/Avvisi';
import { Calendario } from '../components/Calendario';
import { EditorDefunti } from '../components/scheda/SchedaForm';
import { Empty, Field, Modal, Seg } from '../components/ui';
import { COLORI_OPERAZIONE, NOMI_OPERAZIONE, NOMI_STATO_RICHIESTA, STATI_PRATICA, TIPI_OPERAZIONE, inviaRichiesta, nomeOperazione } from '../data/pratiche';
import { descrizioneScheda, useCimitero, useUtente } from '../data/selectors';
import { indiceSchede, toast, useStore } from '../data/store';
import type { Defunto, Pratica, Richiedente, RichiestaAgenzia, Scheda, TipoOperazione } from '../data/types';
import { aggiungiGiorni, data, dataBreve, nomeCompleto, oggiISO } from '../lib/format';
import { googleMapsIndicazioni } from '../lib/geo';
import { setQuery, useRotta, vai } from '../router';

// L'area dell'agenzia funebre: vede solo le sue operazioni e le sue richieste.
// Propone giorno e ora; la postazione la assegna l'ufficio quando apre la pratica.

const DEFUNTO_VUOTO: Defunto = { nome: '', cognome: '', dataNascita: null, dataMorte: null };
const CLASSE_RICHIESTA: Record<RichiestaAgenzia['stato'], string> = { in_attesa: 'badge--arancio', accolta: 'badge--verde', rifiutata: 'badge--rosso' };

function BadgeTipo({ tipo, testo }: { tipo: TipoOperazione; testo?: string }) {
  const c = COLORI_OPERAZIONE[tipo];
  return <span className="badge badge--sm" style={{ background: `${c}18`, color: c }}>{testo ?? NOMI_OPERAZIONE[tipo]}</span>;
}

function BadgeStato({ p }: { p: Pratica }) {
  const st = STATI_PRATICA.find((x) => x.id === p.stato)!;
  return <span className="badge badge--sm" style={{ background: `${st.colore}1a`, color: st.colore }}>{st.label}</span>;
}

function dove(s: Scheda | undefined, db: ReturnType<typeof useStore.getState>['db']): string {
  if (!s) return '—';
  const str = s.posizione ? db.strutture.find((x) => x.id === s.posizione!.strutturaId) : undefined;
  return `${s.viale}${str && s.posizione ? ` · ${str.nome}, ${str.facce[s.posizione.faccia]?.nome ?? ''} fila ${s.posizione.fila} colonna ${s.posizione.colonna}` : ''}`;
}

function ModaleRichiesta({ agenziaId, onChiudi }: { agenziaId: string; onChiudi: () => void }) {
  const cim = useCimitero();
  const [tipo, setTipo] = useState<TipoOperazione>('tumulazione');
  const [defunto, setDefunto] = useState<Defunto>(DEFUNTO_VUOTO);
  const [richiedente, setRichiedente] = useState<Richiedente>({ nome: '', codiceFiscale: '' });
  const [giorno, setGiorno] = useState(aggiungiGiorni(oggiISO(), 1));
  const [orario, setOrario] = useState('10:00');
  const [note, setNote] = useState('');
  const invia = () => {
    if (!defunto.cognome.trim()) return toast('Scrivi almeno il cognome del defunto', 'errore');
    if (!richiedente.nome.trim() || !richiedente.codiceFiscale.trim()) return toast('Scrivi nome e codice fiscale del familiare che chiede l\'operazione', 'errore');
    if (!giorno || !orario || giorno < oggiISO()) return toast('Scegli un giorno e un\'ora da oggi in poi', 'errore');
    inviaRichiesta({ agenziaId, cimiteroId: cim.id, tipo, defunto, richiedente, dataOra: `${giorno}T${orario}`, note: note.trim() || undefined });
    onChiudi();
    vai('/richieste');
  };
  return (
    <Modal titolo="Richiedi un'operazione" sottotitolo="Proponi giorno e ora. L'ufficio assegna la postazione e ti conferma l'operazione." size="lg" onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={invia}>Invia la richiesta</button></>}>
      <div className="col gap-16">
        <Field label="Operazione"><Seg light value={tipo} onChange={setTipo} options={TIPI_OPERAZIONE.map((t) => ({ id: t, label: NOMI_OPERAZIONE[t] }))} /></Field>
        <div className="grid-form">
          <Field label="Giorno"><input className="input" type="date" min={oggiISO()} value={giorno} onChange={(e) => setGiorno(e.target.value)} /></Field>
          <Field label="Ora"><input className="input" type="time" step={900} value={orario} onChange={(e) => setOrario(e.target.value)} /></Field>
        </div>
        <div>
          <h3 className="section-title">Defunto</h3>
          <EditorDefunti defunti={[defunto]} onChange={(d) => setDefunto(d[0] ?? DEFUNTO_VUOTO)} />
        </div>
        <div>
          <h3 className="section-title">Familiare che chiede l'operazione</h3>
          <div className="grid-form">
            <Field label="Nome e cognome"><input className="input" value={richiedente.nome} onChange={(e) => setRichiedente({ ...richiedente, nome: e.target.value })} /></Field>
            <Field label="Codice fiscale"><input className="input mono" value={richiedente.codiceFiscale} onChange={(e) => setRichiedente({ ...richiedente, codiceFiscale: e.target.value.toUpperCase() })} /></Field>
            <Field label="Indirizzo"><input className="input" value={richiedente.indirizzo ?? ''} onChange={(e) => setRichiedente({ ...richiedente, indirizzo: e.target.value })} placeholder="Via e numero, CAP e Comune" /></Field>
            <Field label="Telefono"><input className="input" value={richiedente.telefono ?? ''} onChange={(e) => setRichiedente({ ...richiedente, telefono: e.target.value })} /></Field>
            <Field label="Legame con il defunto"><input className="input" value={richiedente.legameDefunto ?? ''} onChange={(e) => setRichiedente({ ...richiedente, legameDefunto: e.target.value })} /></Field>
          </div>
        </div>
        <Field label="Note per l'ufficio"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Per esempio: c'è già una concessione, sepoltura provvisoria…" /></Field>
      </div>
    </Modal>
  );
}

/** La pratica vista dall'agenzia: sola lettura. */
function Dettaglio({ p, onChiudi }: { p: Pratica; onChiudi: () => void }) {
  const db = useStore((s) => s.db);
  const schede = indiceSchede(db.schede);
  const s = schede.get(p.schedaId);
  const arrivo = p.schedaArrivoId ? schede.get(p.schedaArrivoId) : undefined;
  const avviso = db.avvisi.find((a) => a.motivo === 'pratica' && a.riferimentoId === p.id && a.stato !== 'annullato');
  const meta = arrivo ?? s;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onChiudi()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__head">
          <div>
            <div className="row gap-8"><BadgeStato p={p} /><BadgeTipo tipo={p.tipo} testo={nomeOperazione(p)} /></div>
            <h2 className="mt-8">Pratica {p.numero}</h2>
            <p>{nomeCompleto(p.defunto)}{p.defunto.dataMorte ? ` · † ${data(p.defunto.dataMorte)}` : ''}</p>
          </div>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={onChiudi} aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="modal__body">
          <dl className="kv">
            <dt>Quando</dt>
            <dd>{p.dataOra ? <b>{data(p.dataOra.slice(0, 10))} alle {p.dataOra.slice(11, 16)}</b> : <span className="muted">L'ufficio non l'ha ancora programmata</span>}</dd>
            <dt>{p.tipo === 'traslazione' ? 'Da' : 'Postazione'}</dt>
            <dd>{s ? <><b>{s.id}</b> · {descrizioneScheda(s)}<div className="small muted">{dove(s, db)}</div></> : '—'}</dd>
            {p.tipo === 'traslazione' && (<><dt>A</dt><dd>{arrivo ? <><b>{arrivo.id}</b> · {descrizioneScheda(arrivo)}<div className="small muted">{dove(arrivo, db)}</div></> : '—'}</dd></>)}
            {p.provvisoria && (<><dt>Sepoltura</dt><dd><span className="badge badge--arancio badge--sm">Provvisoria {p.provvisoria.fino ? `fino al ${data(p.provvisoria.fino)}` : 'senza scadenza'}</span></dd></>)}
            <dt>Famiglia</dt>
            <dd>{p.richiedente ? `${p.richiedente.nome}${p.richiedente.telefono ? ` · ${p.richiedente.telefono}` : ''}` : '—'}</dd>
            <dt>Pagamento</dt>
            <dd>{avviso ? <BadgeAvviso a={avviso} /> : <span className="muted">—</span>}</dd>
            {p.stato === 'annullata' && (<><dt>Annullata il</dt><dd>{data(p.annullataIl)} · {p.motivoAnnullamento}</dd></>)}
            {p.note && (<><dt>Note</dt><dd>{p.note}</dd></>)}
          </dl>
        </div>
        <div className="modal__foot">
          {meta && <a className="btn" href={googleMapsIndicazioni(meta.lat, meta.lng)} target="_blank" rel="noreferrer"><Navigation size={15} />Indicazioni per la postazione</a>}
          <button className="btn btn--primary" onClick={onChiudi}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}

export function AgenziaPage() {
  const rotta = useRotta();
  const utente = useUtente();
  const db = useStore((s) => s.db);
  const [nuova, setNuova] = useState(false);
  const agenzia = db.agenzie.find((a) => a.id === utente.agenziaId);
  if (!agenzia) return <div className="page"><Empty titolo="Agenzia non trovata" testo="Esci e rientra dalla schermata iniziale." /></div>;

  const vista = rotta.parti[0] === 'pratiche' ? 'pratiche' : rotta.parti[0] === 'richieste' ? 'richieste' : 'calendario';
  const schede = indiceSchede(db.schede);
  const pratiche = db.pratiche.filter((p) => p.agenziaId === agenzia.id).sort((a, b) => (b.dataOra ?? b.apertaIl).localeCompare(a.dataOra ?? a.apertaIl));
  const richieste = db.richieste.filter((r) => r.agenziaId === agenzia.id).sort((a, b) => b.inviataIl.localeCompare(a.inviataIl) || b.numero.localeCompare(a.numero));
  const sel = rotta.query.get('id') ? pratiche.find((p) => p.id === rotta.query.get('id')) : undefined;
  const avviso = new Map(db.avvisi.filter((a) => a.motivo === 'pratica' && a.stato !== 'annullato').map((a) => [a.riferimentoId, a]));
  const bottone = <button className="btn btn--primary" onClick={() => setNuova(true)}><Plus size={16} />Richiedi un'operazione</button>;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>{vista === 'calendario' ? 'Calendario' : vista === 'pratiche' ? 'Le tue pratiche' : 'Le tue richieste'}</h1>
        </div>
        <div className="page-head__actions">{bottone}</div>
      </div>

      {vista === 'calendario' && <Calendario agenziaId={agenzia.id} onEvento={(e) => (e.praticaId ? setQuery('id', e.praticaId) : vai('/richieste'))} />}

      {vista === 'pratiche' && (
        <section className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Numero</th><th>Operazione</th><th>Defunto</th><th>Postazione</th><th>Quando</th><th>Pagamento</th><th>Stato</th></tr></thead>
              <tbody>
                {pratiche.map((p) => {
                  const s = schede.get(p.schedaId);
                  return (
                    <tr key={p.id} className="clickable" onClick={() => setQuery('id', p.id)}>
                      <td className="id">{p.numero}</td>
                      <td><BadgeTipo tipo={p.tipo} testo={nomeOperazione(p)} /></td>
                      <td><b>{nomeCompleto(p.defunto)}</b></td>
                      <td><span className="id">{p.schedaId}</span><div className="tiny muted">{s?.viale}</div></td>
                      <td className="nowrap">{p.dataOra ? `${dataBreve(p.dataOra.slice(0, 10))} · ${p.dataOra.slice(11, 16)}` : <span className="muted">da programmare</span>}</td>
                      <td>{avviso.get(p.id) ? <BadgeAvviso a={avviso.get(p.id)!} /> : <span className="muted">—</span>}</td>
                      <td><BadgeStato p={p} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!pratiche.length && <div className="empty"><h3>Nessuna pratica</h3><p>Le pratiche nascono quando l'ufficio accoglie una tua richiesta.</p></div>}
          </div>
        </section>
      )}

      {vista === 'richieste' && (
        <section className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Numero</th><th>Operazione</th><th>Defunto</th><th>Proposta per</th><th>Inviata il</th><th>Stato</th><th>Esito</th></tr></thead>
              <tbody>
                {richieste.map((r) => {
                  const p = r.praticaId ? db.pratiche.find((x) => x.id === r.praticaId) : undefined;
                  return (
                    <tr key={r.id} className={p ? 'clickable' : undefined} onClick={() => p && setQuery('id', p.id)}>
                      <td className="id">{r.numero}</td>
                      <td><BadgeTipo tipo={r.tipo} /></td>
                      <td><b>{nomeCompleto(r.defunto)}</b></td>
                      <td className="nowrap">{dataBreve(r.dataOra.slice(0, 10))} · {r.dataOra.slice(11, 16)}</td>
                      <td className="nowrap">{data(r.inviataIl)}</td>
                      <td><span className={`badge badge--sm ${CLASSE_RICHIESTA[r.stato]}`}>{NOMI_STATO_RICHIESTA[r.stato]}</span></td>
                      <td className="small">{r.stato === 'accolta' ? `Pratica ${p?.numero ?? ''}${p?.dataOra ? ` · ${dataBreve(p.dataOra.slice(0, 10))} alle ${p.dataOra.slice(11, 16)}` : ' · da programmare'}` : r.stato === 'rifiutata' ? r.motivoRifiuto : 'L\'ufficio la sta valutando'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!richieste.length && <div className="empty"><h3>Nessuna richiesta</h3><p>Con "Richiedi un'operazione" proponi giorno e ora all'ufficio.</p></div>}
          </div>
        </section>
      )}

      {sel && <Dettaglio p={sel} onChiudi={() => setQuery('id', null)} />}
      {nuova && <ModaleRichiesta agenziaId={agenzia.id} onChiudi={() => setNuova(false)} />}
    </div>
  );
}
