import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Ban, BookOpenCheck, CalendarClock, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FileText, FolderOpen, Plus, Printer, Search, X,
} from 'lucide-react';
import { BarraPagine, paginaDi } from '../components/Esporta';
import { EditorDefunti } from '../components/scheda/SchedaForm';
import { Avatar, Field, Modal, Seg, StatoBadge, Switch, Tabs } from '../components/ui';
import { UFFICIO } from '../config/defaults';
import {
  COLORI_OPERAZIONE, NOMI_DESTINAZIONE, NOMI_OGGETTO, NOMI_OPERAZIONE, STATI_PRATICA, TIPI_OPERAZIONE, annullaPratica, apriPratica, avvisoStagione, eseguiPratica,
  nomeOperazione, programmaPratica, segnaPagamento, sepoltura, sovrapposizioni,
} from '../data/pratiche';
import { indiceSchede, seleziona, toast, useStore } from '../data/store';
import { descrizioneScheda, useCimitero } from '../data/selectors';
import type { Defunto, DestinazioneResti, Pratica, Richiedente, Scheda, TipoOperazione } from '../data/types';
import { utenzeDi } from '../data/utenze';
import { aggiungiGiorni, data, dataBreve, euro, GIORNI_BREVI, nomeCompleto, normalizza, numero, oggiISO } from '../lib/format';
import { pdfRegistro } from '../lib/pdf';
import { setQuery, useRotta } from '../router';

type Tab = 'pratiche' | 'agenda' | 'registro';

const statoP = (id: string) => STATI_PRATICA.find((s) => s.id === id) ?? STATI_PRATICA[0];
const ora = (p: Pratica) => p.dataOra?.slice(11, 16) ?? '';

function BadgePratica({ p }: { p: Pratica }) {
  const st = statoP(p.stato);
  return <span className="badge badge--sm" style={{ background: `${st.colore}18`, color: st.colore }}>{st.label}</span>;
}

function BadgeTipo({ p }: { p: Pratica }) {
  const c = COLORI_OPERAZIONE[p.tipo];
  return <span className="badge badge--sm" style={{ background: `${c}18`, color: c }}>{nomeOperazione(p)}</span>;
}

export function OperazioniPage() {
  const rotta = useRotta();
  const t = rotta.query.get('tab');
  const tab: Tab = t === 'agenda' || t === 'registro' ? t : 'pratiche';
  const selId = rotta.query.get('id');
  const pratiche = useStore((s) => s.db.pratiche);
  const [nuova, setNuova] = useState(false);
  const sel = selId ? pratiche.find((p) => p.id === selId) : undefined;
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Operazioni cimiteriali</h1>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--primary" onClick={() => setNuova(true)}><Plus size={16} />Nuova pratica</button>
        </div>
      </div>
      <Tabs value={tab} onChange={(v) => setQuery('tab', v === 'pratiche' ? null : v)} tabs={[
        { id: 'pratiche', label: 'Pratiche', icon: <FolderOpen size={16} />, count: pratiche.filter((p) => p.stato === 'aperta' || p.stato === 'programmata').length },
        { id: 'agenda', label: 'Agenda', icon: <CalendarDays size={16} /> },
        { id: 'registro', label: 'Registro', icon: <BookOpenCheck size={16} /> },
      ]} />
      {tab === 'pratiche' && <Pratiche selId={selId} />}
      {tab === 'agenda' && <Agenda />}
      {tab === 'registro' && <Registro />}
      {sel && <Dettaglio p={sel} onChiudi={() => setQuery('id', null)} />}
      {nuova && <ModaleNuova onChiudi={() => setNuova(false)} onCreata={(id) => { setNuova(false); setQuery('id', id); }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pratiche
// ---------------------------------------------------------------------------

function Pratiche({ selId }: { selId: string | null }) {
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const schede = indiceSchede(db.schede);
  const [q, setQ] = useState('');
  const [stati, setStati] = useState<string[]>(['aperta', 'programmata']);
  const [tipo, setTipo] = useState('');
  const [pagina, setPagina] = useState(0);
  const tutte = useMemo(() => db.pratiche.filter((p) => p.cimiteroId === cim.id), [db.pratiche, cim.id]);
  const lista = useMemo(() => {
    const t = normalizza(q);
    return tutte
      .filter((p) => (!stati.length || stati.includes(p.stato)) && (!tipo || p.tipo === tipo))
      .filter((p) => !t || normalizza(`${p.numero} ${nomeCompleto(p.defunto)} ${p.schedaId} ${p.richiedente?.nome ?? ''}`).includes(t))
      .sort((a, b) => (a.dataOra ?? `9${a.apertaIl}`).localeCompare(b.dataOra ?? `9${b.apertaIl}`) * (stati.includes('eseguita') || stati.includes('annullata') ? -1 : 1));
  }, [tutte, stati, tipo, q]);
  useEffect(() => setPagina(0), [q, stati, tipo]);
  const conta = (st: string) => tutte.filter((p) => p.stato === st).length;
  return (
    <section className="card">
      <div className="card__head" style={{ flexWrap: 'wrap' }}>
        <div className="row gap-8 row--wrap">
          <div className="input-icon" style={{ width: 280 }}>
            <Search size={16} />
            <input className="input input--sm" placeholder="Cerca numero, defunto, scheda o richiedente" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {STATI_PRATICA.map((s) => (
            <button key={s.id} className={`chip chip--sm ${stati.includes(s.id) ? 'is-on' : ''}`} onClick={() => setStati(stati.includes(s.id) ? stati.filter((x) => x !== s.id) : [...stati, s.id])}>
              <span className="dot" style={{ background: s.colore }} />{s.label}<span className="chip__n">{conta(s.id)}</span>
            </button>
          ))}
        </div>
        <select className="select select--sm" style={{ width: 'auto' }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Tutte le operazioni</option>
          {TIPI_OPERAZIONE.map((x) => <option key={x} value={x}>{NOMI_OPERAZIONE[x]}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Numero</th><th>Operazione</th><th>Defunto</th><th>Postazione</th><th>Richiedente</th><th>Quando</th><th>Pagamento</th><th>Stato</th></tr></thead>
          <tbody>
            {paginaDi(lista, pagina).map((p) => {
              const s = schede.get(p.schedaId);
              return (
                <tr key={p.id} className={`clickable ${selId === p.id ? 'is-sel' : ''}`} onClick={() => setQuery('id', p.id)}>
                  <td className="id">{p.numero}</td>
                  <td><BadgeTipo p={p} /></td>
                  <td><b>{nomeCompleto(p.defunto)}</b></td>
                  <td><span className="id">{p.schedaId}</span><div className="tiny muted">{s?.viale}</div></td>
                  <td>{p.dUfficio ? <span className="muted">D'ufficio</span> : p.richiedente?.nome}</td>
                  <td className="nowrap">{p.dataOra ? `${dataBreve(p.dataOra.slice(0, 10))} · ${ora(p)}` : <span className="muted">da programmare</span>}</td>
                  <td>{p.dUfficio ? <span className="muted">—</span> : p.pagamento?.pagata ? <span className="badge badge--sm badge--verde">Pagata</span> : <span className="badge badge--sm badge--giallo">Da pagare</span>}</td>
                  <td><BadgePratica p={p} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!lista.length && <div className="empty"><h3>Nessuna pratica con questi filtri</h3></div>}
      </div>
      <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Dettaglio della pratica
// ---------------------------------------------------------------------------

function Dettaglio({ p, onChiudi }: { p: Pratica; onChiudi: () => void }) {
  const db = useStore((s) => s.db);
  const schede = indiceSchede(db.schede);
  const s = schede.get(p.schedaId);
  const arrivo = p.schedaArrivoId ? schede.get(p.schedaArrivoId) : undefined;
  const agenzia = db.agenzie.find((a) => a.id === p.agenziaId);
  const [modale, setModale] = useState<'programma' | 'esegui' | 'annulla' | null>(null);
  const nome = (id: string) => db.operatori.find((o) => o.id === id)?.nome ?? '—';
  const stagione = avvisoStagione(p);
  const doppie = sovrapposizioni(p, db.pratiche);
  const inCorso = p.stato === 'aperta' || p.stato === 'programmata';
  const descr = (x?: Scheda) => (x ? `${x.id} · ${descrizioneScheda(x)} · ${x.viale}` : '—');
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onChiudi()}>
      <div className="modal modal--lg" role="dialog" aria-modal="true">
        <div className="modal__head">
          <div>
            <div className="row gap-8"><BadgePratica p={p} /><BadgeTipo p={p} /><span className="badge badge--sm">{NOMI_OGGETTO[p.oggetto]}</span></div>
            <h2 className="mt-8">Pratica {p.numero}</h2>
            <p>{nomeCompleto(p.defunto)}{p.defunto.dataMorte ? ` · † ${data(p.defunto.dataMorte)}` : ''}</p>
          </div>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={onChiudi} aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="modal__body col gap-16">
          {stagione && <div className="callout callout--warn"><AlertTriangle size={16} />{stagione}</div>}
          {doppie.length > 0 && <div className="callout callout--warn"><AlertTriangle size={16} />Alla stessa ora: {doppie.join(', ')}.</div>}
          <dl className="kv">
            <dt>{p.tipo === 'traslazione' ? 'Da' : 'Postazione'}</dt><dd>{descr(s)}</dd>
            {p.tipo === 'traslazione' && (<><dt>A</dt><dd>{descr(arrivo)}</dd></>)}
            <dt>Richiedente</dt>
            <dd>{p.dUfficio ? 'D\'ufficio' : p.richiedente ? `${p.richiedente.nome}${p.richiedente.legameDefunto ? ` (${p.richiedente.legameDefunto})` : ''} · ${p.richiedente.codiceFiscale}${p.richiedente.telefono ? ` · ${p.richiedente.telefono}` : ''}` : '—'}</dd>
            {agenzia && (<><dt>Agenzia funebre</dt><dd>{agenzia.nome}</dd></>)}
            <dt>Aperta il</dt><dd>{data(p.apertaIl)}</dd>
            {p.dataOra && (<><dt>{p.stato === 'eseguita' ? 'Eseguita il' : 'Programmata il'}</dt><dd><b>{data(p.dataOra.slice(0, 10))} alle {ora(p)}</b></dd></>)}
            {!!p.operatoriIds?.length && (<><dt>Operatori</dt><dd>{p.operatoriIds.map(nome).join(', ')}</dd></>)}
            {p.esitoResti && (<><dt>Resti</dt><dd>{NOMI_DESTINAZIONE[p.esitoResti.destinazione]}{p.esitoResti.schedaId ? `: ${p.esitoResti.schedaId}` : ''}</dd></>)}
            {p.tipo === 'traslazione' && p.utenzaVotiva && (<><dt>Utenza votiva</dt><dd>{p.utenzaVotiva === 'sposta' ? 'Si sposta sulla nuova postazione' : 'Si chiude'}</dd></>)}
            {p.stato === 'annullata' && (<><dt>Annullata il</dt><dd>{data(p.annullataIl)} · {p.motivoAnnullamento}</dd></>)}
            {p.note && (<><dt>Note</dt><dd>{p.note}</dd></>)}
          </dl>
          {!p.dUfficio && (
            <section className="sez">
              <h4 className="sez__t">Attestazione di pagamento</h4>
              <div className="row row--wrap gap-12">
                <span>Tariffa <b>{euro(p.tariffa ?? 0)}</b></span>
                <label className="row gap-8" style={{ cursor: 'pointer' }}>
                  <Switch small on={!!p.pagamento?.pagata} label="Pagata"
                    onChange={(v) => segnaPagamento(p.id, v ? { pagata: true, data: oggiISO(), numero: p.pagamento?.numero ?? '' } : { pagata: false })} />
                  {p.pagamento?.pagata ? `Pagata il ${data(p.pagamento.data)}` : 'Non pagata'}
                </label>
                {p.pagamento?.pagata && (
                  <input className="input input--sm" style={{ width: 200 }} placeholder="Numero della ricevuta" value={p.pagamento.numero ?? ''}
                    onChange={(e) => segnaPagamento(p.id, { ...p.pagamento!, numero: e.target.value })} />
                )}
              </div>
            </section>
          )}
        </div>
        <div className="modal__foot">
          {s && <button className="btn" onClick={() => { onChiudi(); seleziona(s.id); }}><ExternalLink size={15} />Apri scheda</button>}
          {inCorso && <button className="btn" onClick={() => setModale('programma')}><CalendarClock size={15} />{p.stato === 'programmata' ? 'Sposta' : 'Programma'}</button>}
          {inCorso && <button className="btn" onClick={() => setModale('annulla')}><Ban size={15} />Annulla</button>}
          {p.stato === 'programmata' && <button className="btn btn--success" onClick={() => setModale('esegui')}><CheckCircle2 size={15} />Segna come eseguita</button>}
        </div>
      </div>
      {modale === 'programma' && <ModaleProgramma p={p} onChiudi={() => setModale(null)} />}
      {modale === 'esegui' && <ModaleEsegui p={p} onChiudi={() => setModale(null)} />}
      {modale === 'annulla' && <ModaleAnnulla p={p} onChiudi={() => setModale(null)} />}
    </div>
  );
}

function ModaleProgramma({ p, onChiudi }: { p: Pratica; onChiudi: () => void }) {
  const operatori = useStore((s) => s.db.operatori).filter((o) => o.attivo || p.operatoriIds?.includes(o.id));
  const [giorno, setGiorno] = useState(p.dataOra?.slice(0, 10) ?? aggiungiGiorni(oggiISO(), 1));
  const [orario, setOrario] = useState(p.dataOra?.slice(11, 16) ?? '09:30');
  const [scelti, setScelti] = useState<string[]>(p.operatoriIds ?? []);
  const stagione = avvisoStagione({ tipo: p.tipo, straordinaria: p.straordinaria, dataOra: `${giorno}T${orario}` });
  const salva = () => {
    programmaPratica(p.id, `${giorno}T${orario}`, scelti);
    toast(`Operazione programmata il ${data(giorno)} alle ${orario}`);
    onChiudi();
  };
  return (
    <Modal titolo={`${p.stato === 'programmata' ? 'Sposta' : 'Programma'} · ${p.numero}`} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" disabled={!scelti.length || !giorno || !orario} onClick={salva}>Salva</button></>}>
      <div className="col gap-16">
        {stagione && <div className="callout callout--warn"><AlertTriangle size={16} />{stagione}</div>}
        <div className="grid-form">
          <Field label="Data"><input className="input" type="date" value={giorno} onChange={(e) => setGiorno(e.target.value)} /></Field>
          <Field label="Ora"><input className="input" type="time" step={900} value={orario} onChange={(e) => setOrario(e.target.value)} /></Field>
        </div>
        <Field label="Operatori" hint="Almeno uno. Ricevono un alert nella loro campanella.">
          <div className="col gap-4">
            {operatori.map((o) => (
              <label key={o.id} className="row gap-8" style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="check" checked={scelti.includes(o.id)} onChange={() => setScelti((x) => (x.includes(o.id) ? x.filter((y) => y !== o.id) : [...x, o.id]))} />
                <Avatar nome={o.nome} colore={o.colore} size="sm" />{o.nome}
              </label>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

function CercaPostazione({ valore, onScegli, filtro, segnaposto }: { valore: Scheda | null; onScegli: (s: Scheda | null) => void; filtro: (s: Scheda) => boolean; segnaposto: string }) {
  const cim = useCimitero();
  const schede = useStore((s) => s.db.schede);
  const [q, setQ] = useState('');
  const ris = useMemo(() => {
    const t = normalizza(q);
    if (t.length < 2) return [];
    return schede.filter((s) => s.cimiteroId === cim.id && s.tipologia !== 'struttura' && filtro(s) && normalizza(`${s.id} ${descrizioneScheda(s)} ${s.viale}`).includes(t)).slice(0, 8);
  }, [q, schede, cim.id, filtro]);
  if (valore)
    return (
      <div className="scheda-pick">
        <div className="grow"><b>{valore.id}</b> · {descrizioneScheda(valore)}<div className="small muted">{valore.viale}</div></div>
        <StatoBadge stato={valore.stato} small />
        <button className="btn btn--xs" onClick={() => onScegli(null)}>Cambia</button>
      </div>
    );
  return (
    <div style={{ position: 'relative' }}>
      <input className="input" placeholder={segnaposto} value={q} onChange={(e) => setQ(e.target.value)} />
      {ris.length > 0 && (
        <div className="popover" style={{ left: 0, right: 0 }}>
          {ris.map((s) => (
            <button key={s.id} className="popover__item" onClick={() => { onScegli(s); setQ(''); }}>
              <b>{s.id}</b><span className="grow ellipsis">{descrizioneScheda(s)} · {s.viale}</span><StatoBadge stato={s.stato} small />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ModaleEsegui({ p, onChiudi }: { p: Pratica; onChiudi: () => void }) {
  const conEsito = p.tipo === 'esumazione' || p.tipo === 'estumulazione';
  const [dest, setDest] = useState<DestinazioneResti>('ossario_comune');
  const [altra, setAltra] = useState<Scheda | null>(null);
  const esegui = () => {
    if (conEsito && dest === 'altra_postazione' && !altra) return toast('Scegli la postazione che riceve i resti', 'errore');
    eseguiPratica(p.id, conEsito ? { destinazione: dest, schedaId: dest === 'altra_postazione' ? altra!.id : undefined } : undefined);
    onChiudi();
  };
  return (
    <Modal titolo={`${NOMI_OPERAZIONE[p.tipo]} eseguita · ${p.numero}`} sottotitolo="CimiTera aggiorna da sola le schede: defunti, posti occupati e stato della postazione." onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--success" onClick={esegui}><CheckCircle2 size={15} />Conferma</button></>}>
      {conEsito ? (
        <div className="col gap-16">
          <Field label="Dove vanno i resti">
            <select className="select" value={dest} onChange={(e) => setDest(e.target.value as DestinazioneResti)}>
              {(Object.keys(NOMI_DESTINAZIONE) as DestinazioneResti[]).map((d) => <option key={d} value={d}>{NOMI_DESTINAZIONE[d]}</option>)}
            </select>
          </Field>
          {dest === 'altra_postazione' && (
            <Field label="Postazione che riceve i resti" hint="Li riceve senza una seconda pratica">
              <CercaPostazione valore={altra} onScegli={setAltra} filtro={(s) => s.id !== p.schedaId} segnaposto="Cerca per ID, nome o viale…" />
            </Field>
          )}
        </div>
      ) : (
        <p>{sepoltura(p.tipo) ? `${nomeCompleto(p.defunto)} viene aggiunto alla postazione ${p.schedaId}.` : `${nomeCompleto(p.defunto)} passa dalla postazione ${p.schedaId} alla ${p.schedaArrivoId}.`}</p>
      )}
    </Modal>
  );
}

function ModaleAnnulla({ p, onChiudi }: { p: Pratica; onChiudi: () => void }) {
  const [motivo, setMotivo] = useState('');
  return (
    <Modal titolo={`Annulla ${p.numero}`} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Indietro</button><button className="btn btn--danger" disabled={!motivo.trim()} onClick={() => { annullaPratica(p.id, motivo.trim()); onChiudi(); }}><Ban size={15} />Annulla la pratica</button></>}>
      <Field label="Motivo"><input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Per esempio: richiesta ritirata dalla famiglia" autoFocus /></Field>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Nuova pratica
// ---------------------------------------------------------------------------

const POSTAZIONI_PER: Record<TipoOperazione, string[] | null> = {
  inumazione: ['fossa'], tumulazione: ['loculo', 'tomba_famiglia', 'celletta_ossario', 'nicchia_cineraria'], esumazione: ['fossa'],
  estumulazione: ['loculo', 'tomba_famiglia', 'celletta_ossario', 'nicchia_cineraria'], traslazione: null,
};
const DEFUNTO_VUOTO: Defunto = { nome: '', cognome: '', dataNascita: null, dataMorte: null };

function ModaleNuova({ onChiudi, onCreata }: { onChiudi: () => void; onCreata: (id: string) => void }) {
  const cim = useCimitero();
  const agenzie = useStore((s) => s.db.agenzie).filter((a) => a.attiva);
  const tariffe = useStore((s) => s.db.regole.operazioni.tariffe);
  const [tipo, setTipo] = useState<TipoOperazione>('tumulazione');
  const [straordinaria, setStraordinaria] = useState(false);
  const [dUfficio, setDUfficio] = useState(false);
  const [oggetto, setOggetto] = useState<Pratica['oggetto']>('salma');
  const [scheda, setScheda] = useState<Scheda | null>(null);
  const [arrivo, setArrivo] = useState<Scheda | null>(null);
  const [nuovo, setNuovo] = useState<Defunto>(DEFUNTO_VUOTO);
  const [indice, setIndice] = useState(0);
  const [richiedente, setRichiedente] = useState<Richiedente>({ nome: '', codiceFiscale: '' });
  const [agenzia, setAgenzia] = useState('');
  const [utenza, setUtenza] = useState<'sposta' | 'chiudi'>('sposta');
  const [note, setNote] = useState('');
  const mette = sepoltura(tipo);
  const tipi = POSTAZIONI_PER[tipo];
  const cambiaTipo = (t: TipoOperazione) => {
    setTipo(t);
    setScheda(null);
    setArrivo(null);
    setOggetto(sepoltura(t) ? 'salma' : 'resti');
    if (sepoltura(t)) setDUfficio(false);
  };
  const defunto = mette ? nuovo : scheda?.defunti[indice];
  const haUtenza = !!(scheda && defunto && utenzeDi(scheda.id).some((u) => u.defunto && u.defunto.nome === defunto.nome && u.defunto.cognome === defunto.cognome));
  const salva = () => {
    if (!scheda) return toast('Scegli la postazione', 'errore');
    if (!defunto || !defunto.cognome.trim()) return toast(mette ? 'Scrivi almeno il cognome del defunto' : 'Scegli il defunto', 'errore');
    if (tipo === 'traslazione' && !arrivo) return toast('Scegli la postazione di arrivo', 'errore');
    if (!dUfficio && (!richiedente.nome.trim() || !richiedente.codiceFiscale.trim())) return toast('Scrivi nome e codice fiscale del richiedente', 'errore');
    const p = apriPratica({
      cimiteroId: cim.id, tipo, straordinaria: tipo === 'esumazione' || tipo === 'estumulazione' ? straordinaria : undefined, oggetto, dUfficio,
      richiedente: dUfficio ? undefined : richiedente, defunto, schedaId: scheda.id, schedaArrivoId: arrivo?.id, agenziaId: agenzia || undefined,
      utenzaVotiva: tipo === 'traslazione' && haUtenza ? utenza : undefined, note: note.trim() || undefined,
    });
    onCreata(p.id);
  };
  return (
    <Modal titolo="Nuova pratica" sottotitolo="Una pratica per una sola operazione su un solo defunto." size="lg" onClose={onChiudi}
      icona={<span className="list-item__icon" style={{ background: '#EAF2F9', color: '#1B5A8F' }}><FileText size={18} /></span>}
      footer={<><span className="small muted grow">{dUfficio ? 'D\'ufficio: nessuna tariffa' : `Tariffa: ${euro(tariffe[tipo])}`}</span><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={salva}>Apri la pratica</button></>}>
      <div className="col gap-16">
        <Field label="Operazione">
          <Seg light value={tipo} onChange={cambiaTipo} options={TIPI_OPERAZIONE.map((t) => ({ id: t, label: NOMI_OPERAZIONE[t] }))} />
        </Field>
        <div className="grid-form">
          {(tipo === 'esumazione' || tipo === 'estumulazione') && (
            <Field label="Tipo"><Seg light value={straordinaria ? 's' : 'o'} onChange={(v) => setStraordinaria(v === 's')} options={[{ id: 'o', label: 'Ordinaria' }, { id: 's', label: 'Straordinaria' }]} /></Field>
          )}
          {!mette && (
            <Field label="Avvio"><Seg light value={dUfficio ? 'u' : 'r'} onChange={(v) => setDUfficio(v === 'u')} options={[{ id: 'r', label: 'Su richiesta' }, { id: 'u', label: 'D\'ufficio' }]} /></Field>
          )}
          <Field label="Cosa si sposta"><Seg light value={oggetto} onChange={setOggetto} options={(['salma', 'resti', 'ceneri'] as const).map((o) => ({ id: o, label: NOMI_OGGETTO[o] }))} /></Field>
        </div>
        <Field label={tipo === 'traslazione' ? 'Postazione di partenza' : 'Postazione'}>
          <CercaPostazione valore={scheda} onScegli={(s) => { setScheda(s); setIndice(0); }} segnaposto="Cerca per ID, nome o viale…"
            filtro={(s) => (!tipi || tipi.includes(s.tipologia)) && (mette || s.defunti.length > 0)} />
        </Field>
        {tipo === 'traslazione' && (
          <Field label="Postazione di arrivo"><CercaPostazione valore={arrivo} onScegli={setArrivo} filtro={(s) => s.id !== scheda?.id} segnaposto="Cerca per ID, nome o viale…" /></Field>
        )}
        {mette ? (
          <div>
            <h3 className="section-title">Defunto</h3>
            <EditorDefunti defunti={[nuovo]} onChange={(d) => setNuovo(d[0] ?? DEFUNTO_VUOTO)} />
          </div>
        ) : scheda && (
          <Field label="Defunto">
            <select className="select" value={indice} onChange={(e) => setIndice(Number(e.target.value))}>
              {scheda.defunti.map((d, i) => <option key={i} value={i}>{nomeCompleto(d)}{d.dataMorte ? ` · † ${data(d.dataMorte)}` : ''}</option>)}
            </select>
          </Field>
        )}
        {tipo === 'traslazione' && haUtenza && (
          <Field label="Utenza votiva del defunto">
            <Seg light value={utenza} onChange={setUtenza} options={[{ id: 'sposta', label: 'Spostala sulla nuova postazione' }, { id: 'chiudi', label: 'Chiudila' }]} />
          </Field>
        )}
        {!dUfficio && (
          <div>
            <h3 className="section-title">Richiedente</h3>
            <div className="grid-form">
              <Field label="Nome e cognome"><input className="input" value={richiedente.nome} onChange={(e) => setRichiedente({ ...richiedente, nome: e.target.value })} /></Field>
              <Field label="Codice fiscale"><input className="input mono" value={richiedente.codiceFiscale} onChange={(e) => setRichiedente({ ...richiedente, codiceFiscale: e.target.value.toUpperCase() })} /></Field>
              <Field label="Telefono"><input className="input" value={richiedente.telefono ?? ''} onChange={(e) => setRichiedente({ ...richiedente, telefono: e.target.value })} /></Field>
              <Field label="Legame con il defunto"><input className="input" value={richiedente.legameDefunto ?? ''} onChange={(e) => setRichiedente({ ...richiedente, legameDefunto: e.target.value })} /></Field>
            </div>
          </div>
        )}
        <div className="grid-form">
          <Field label="Agenzia funebre (facoltativa)">
            <select className="select" value={agenzia} onChange={(e) => setAgenzia(e.target.value)}>
              <option value="">Nessuna</option>
              {agenzie.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Agenda: tutte le operazioni programmate, funerali compresi
// ---------------------------------------------------------------------------

function VoceAgenda({ p, tutte }: { p: Pratica; tutte: Pratica[] }) {
  const db = useStore((s) => s.db);
  const s = indiceSchede(db.schede).get(p.schedaId);
  const agenzia = db.agenzie.find((a) => a.id === p.agenziaId);
  const doppie = sovrapposizioni(p, tutte);
  const c = COLORI_OPERAZIONE[p.tipo];
  return (
    <button className="agenda__voce" style={{ borderLeftColor: c, opacity: p.stato === 'eseguita' ? 0.6 : 1 }} onClick={() => setQuery('id', p.id)} title={doppie.length ? `Alla stessa ora: ${doppie.join(', ')}` : undefined}>
      <span className="row row--between">
        <b className="mono">{ora(p)}</b>
        {doppie.length > 0 && <AlertTriangle size={14} color="#D9473F" />}
        {p.stato === 'eseguita' && <CheckCircle2 size={14} color="#3F9A3C" />}
      </span>
      <span className="small strong" style={{ color: c }}>{NOMI_OPERAZIONE[p.tipo]}</span>
      <b className="ellipsis">{nomeCompleto(p.defunto)}</b>
      <span className="tiny muted ellipsis">{p.schedaId}{s ? ` · ${s.viale}` : ''}</span>
      {agenzia && <span className="tiny muted ellipsis">{agenzia.nome}</span>}
      <span className="row gap-4">
        {(p.operatoriIds ?? []).map((id) => {
          const o = db.operatori.find((x) => x.id === id);
          return o ? <Avatar key={id} nome={o.nome} colore={o.colore} size="sm" /> : null;
        })}
      </span>
    </button>
  );
}

function Agenda() {
  const db = useStore((s) => s.db);
  const oggi = oggiISO();
  const [vista, setVista] = useState<'settimana' | 'giorno'>('settimana');
  const [giorno, setGiorno] = useState(oggi);
  const [cimitero, setCimitero] = useState('');
  const [tipo, setTipo] = useState('');
  const programmate = useMemo(
    () => db.pratiche.filter((p) => p.dataOra && (p.stato === 'programmata' || p.stato === 'eseguita') && (!cimitero || p.cimiteroId === cimitero) && (!tipo || p.tipo === tipo)),
    [db.pratiche, cimitero, tipo],
  );
  // lunedì della settimana del giorno scelto
  const d = new Date(`${giorno}T12:00:00`);
  const lunedi = aggiungiGiorni(giorno, -((d.getDay() + 6) % 7));
  const giorni = vista === 'settimana' ? Array.from({ length: 7 }, (_, i) => aggiungiGiorni(lunedi, i)) : [giorno];
  const passo = vista === 'settimana' ? 7 : 1;
  const del = (g: string) => programmate.filter((p) => p.dataOra!.startsWith(g)).sort((a, b) => a.dataOra!.localeCompare(b.dataOra!));
  return (
    <section className="card">
      <div className="card__head" style={{ flexWrap: 'wrap' }}>
        <div className="row gap-8 row--wrap">
          <Seg small light value={vista} onChange={setVista} options={[{ id: 'settimana', label: 'Settimana' }, { id: 'giorno', label: 'Giorno' }]} />
          <button className="btn btn--sm btn--icon" onClick={() => setGiorno(aggiungiGiorni(giorno, -passo))} aria-label="Indietro"><ChevronLeft size={16} /></button>
          <button className="btn btn--sm" onClick={() => setGiorno(oggi)}>Oggi</button>
          <button className="btn btn--sm btn--icon" onClick={() => setGiorno(aggiungiGiorni(giorno, passo))} aria-label="Avanti"><ChevronRight size={16} /></button>
          <b>{vista === 'settimana' ? `${dataBreve(giorni[0])} – ${dataBreve(giorni[6])}` : data(giorno)}</b>
        </div>
        <div className="row gap-8">
          <select className="select select--sm" style={{ width: 'auto' }} value={cimitero} onChange={(e) => setCimitero(e.target.value)}>
            <option value="">Tutti i cimiteri</option>
            {db.cimiteri.map((c) => <option key={c.id} value={c.id}>{c.breve}</option>)}
          </select>
          <select className="select select--sm" style={{ width: 'auto' }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Tutte le operazioni</option>
            {TIPI_OPERAZIONE.map((x) => <option key={x} value={x}>{NOMI_OPERAZIONE[x]}</option>)}
          </select>
        </div>
      </div>
      <div className={`agenda agenda--${vista}`}>
        {giorni.map((g, i) => {
          const voci = del(g);
          const gs = new Date(`${g}T12:00:00`);
          return (
            <div key={g} className={`agenda__giorno ${g === oggi ? 'is-oggi' : ''}`}>
              <button className="agenda__testa" onClick={() => { setGiorno(g); setVista('giorno'); }}>
                <span className="upper muted">{GIORNI_BREVI[vista === 'settimana' ? i : (gs.getDay() + 6) % 7]}</span>
                <b>{Number(g.slice(8))}</b>
                <span className="tiny muted">{voci.length || ''}</span>
              </button>
              <div className="agenda__voci">
                {voci.map((p) => <VoceAgenda key={p.id} p={p} tutte={programmate} />)}
                {!voci.length && <span className="tiny muted" style={{ padding: 8 }}>Nessuna operazione</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Registro delle operazioni: le pratiche eseguite (DPR 285/1990, art. 52)
// ---------------------------------------------------------------------------

function Registro() {
  const db = useStore((s) => s.db);
  const cim = useCimitero();
  const [pagina, setPagina] = useState(0);
  const eseguite = useMemo(() => db.pratiche.filter((p) => p.stato === 'eseguita' && p.eseguitaIl), [db.pratiche]);
  const anni = useMemo(() => Array.from(new Set(eseguite.map((p) => p.eseguitaIl!.slice(0, 4)))).sort().reverse(), [eseguite]);
  const [anno, setAnno] = useState('');
  const [cimitero, setCimitero] = useState(cim.id);
  const scelto = anno || anni[0] || oggiISO().slice(0, 4);
  const lista = useMemo(
    () => eseguite.filter((p) => p.eseguitaIl!.startsWith(scelto) && (!cimitero || p.cimiteroId === cimitero)).sort((a, b) => (a.dataOra ?? a.eseguitaIl!).localeCompare(b.dataOra ?? b.eseguitaIl!)),
    [eseguite, scelto, cimitero],
  );
  useEffect(() => setPagina(0), [scelto, cimitero]);
  const nome = (id: string) => (id === 'ufficio' ? UFFICIO : db.operatori.find((o) => o.id === id)?.nome ?? '');
  const esito = (p: Pratica) => (p.tipo === 'traslazione' ? `verso ${p.schedaArrivoId ?? ''}` : p.esitoResti ? `${NOMI_DESTINAZIONE[p.esitoResti.destinazione]}${p.esitoResti.schedaId ? ` ${p.esitoResti.schedaId}` : ''}` : '');
  const stampa = () => pdfRegistro(
    `Registro delle operazioni cimiteriali · ${scelto}${cimitero ? ` · ${db.cimiteri.find((c) => c.id === cimitero)?.nome ?? ''}` : ''}`,
    lista.map((p, i) => [String(i + 1), data(p.eseguitaIl), p.numero, nomeOperazione(p), nomeCompleto(p.defunto), p.schedaId, esito(p)]),
    scelto,
  );
  return (
    <section className="card">
      <div className="card__head" style={{ flexWrap: 'wrap' }}>
        <div className="row gap-8">
          <select className="select select--sm" style={{ width: 'auto' }} value={scelto} onChange={(e) => setAnno(e.target.value)}>
            {anni.map((a) => <option key={a} value={a}>{a}</option>)}
            {!anni.length && <option value={scelto}>{scelto}</option>}
          </select>
          <select className="select select--sm" style={{ width: 'auto' }} value={cimitero} onChange={(e) => setCimitero(e.target.value)}>
            <option value="">Tutti i cimiteri</option>
            {db.cimiteri.map((c) => <option key={c.id} value={c.id}>{c.breve}</option>)}
          </select>
          <span className="small muted">{numero(lista.length)} operazioni eseguite</span>
        </div>
        <button className="btn btn--sm" disabled={!lista.length} onClick={stampa}><Printer size={14} />Stampa in PDF</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th className="num">N.</th><th>Data</th><th>Pratica</th><th>Operazione</th><th>Defunto</th><th>Postazione</th><th>Esito</th><th>Operatori</th></tr></thead>
          <tbody>
            {paginaDi(lista, pagina).map((p, i) => (
              <tr key={p.id} className="clickable" onClick={() => setQuery('id', p.id)}>
                <td className="num">{pagina * 50 + i + 1}</td>
                <td className="nowrap">{data(p.eseguitaIl)}</td>
                <td className="id">{p.numero}</td>
                <td><BadgeTipo p={p} /></td>
                <td><b>{nomeCompleto(p.defunto)}</b></td>
                <td className="id">{p.schedaId}</td>
                <td className="small">{esito(p) || '—'}</td>
                <td className="small">{(p.operatoriIds ?? []).map(nome).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lista.length && <div className="empty"><h3>Nessuna operazione eseguita</h3></div>}
      </div>
      <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
    </section>
  );
}
