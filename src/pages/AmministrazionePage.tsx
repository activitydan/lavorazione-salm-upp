import { useEffect, useState } from 'react';
import { Bell, Building2, CalendarDays, ClipboardCheck, ExternalLink, FileClock, Pencil, Plus, Printer, QrCode, Scale, Users, Wrench, X } from 'lucide-react';
import { Calendario } from '../components/Calendario';
import { RegoleDelComune } from '../components/RegoleComune';
import { Avatar, Field, Modal, Seg, Switch, Tabs } from '../components/ui';
import { salvaOperatore, toast, useStore } from '../data/store';
import { alertPersonali, labelLista, useCimitero } from '../data/selectors';
import { NOMI_OPERAZIONE, salvaAgenzia } from '../data/pratiche';
import type { AgenziaFunebre, Operatore } from '../data/types';
import { data, dataOra, nomeCompleto } from '../lib/format';
import { pdfCartelloQr } from '../lib/pdf';
import { href, setQuery, useRotta } from '../router';

type Tab = 'operatori' | 'agenzie' | 'cittadini' | 'regole' | 'registro';
const COLORI = ['#2F6FB3', '#8E5BB5', '#1E8C8C', '#C0487A', '#5E9A3A', '#E07B22', '#4F5FB8', '#B8860B', '#D9473F', '#0A2F55'];

/** Amministrazione: le persone e le regole del Comune. Solo per l'Amministratore, solo sul computer. */
export function AmministrazionePage() {
  const rotta = useRotta();
  const tab = (rotta.query.get('tab') as Tab) ?? 'operatori';
  const operatori = useStore((s) => s.db.operatori);
  const registro = useStore((s) => s.config.registro);
  const agenzie = useStore((s) => s.db.agenzie);
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Amministrazione</h1>
        </div>
      </div>
      <Tabs value={tab} onChange={(t) => setQuery('tab', t === 'operatori' ? null : t)} tabs={[
        { id: 'operatori', label: 'Operatori', icon: <Users size={16} />, count: operatori.filter((o) => o.attivo).length },
        { id: 'agenzie', label: 'Agenzie funebri', icon: <Building2 size={16} />, count: agenzie.filter((a) => a.attiva).length },
        { id: 'cittadini', label: 'Pagina del cittadino', icon: <QrCode size={16} /> },
        { id: 'regole', label: 'Regole del Comune', icon: <Scale size={16} /> },
        { id: 'registro', label: 'Registro modifiche', icon: <FileClock size={16} />, count: registro.length },
      ]} />
      {tab === 'operatori' && <Operatori />}
      {tab === 'agenzie' && <Agenzie />}
      {tab === 'cittadini' && <PaginaCittadino />}
      {tab === 'regole' && <RegoleDelComune />}
      {tab === 'registro' && <Registro />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Operatori
// ---------------------------------------------------------------------------

function ModaleOperatore({ o, onChiudi }: { o?: Operatore; onChiudi: () => void }) {
  const [b, setB] = useState<Operatore>(() => o ?? { id: `op-${Date.now().toString(36)}`, nome: '', ruolo: 'Operatore', telefono: '', email: '', colore: COLORI[Math.floor(Math.random() * COLORI.length)], attivo: true });
  const set = (p: Partial<Operatore>) => setB((x) => ({ ...x, ...p }));
  const salva = () => {
    if (!b.nome.trim()) return toast('Inserisci il nome', 'errore');
    salvaOperatore({ ...b, nome: b.nome.trim() });
    toast('Operatore salvato');
    onChiudi();
  };
  return (
    <Modal titolo={o ? `Modifica ${o.nome}` : 'Nuovo operatore'} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={salva}>Salva</button></>}>
      <div className="grid-form">
        <Field label="Nome e cognome" className="span-2"><input className="input" value={b.nome} onChange={(e) => set({ nome: e.target.value })} autoFocus /></Field>
        <Field label="Ruolo">
          <Seg light value={b.ruolo} onChange={(v) => set({ ruolo: v })} options={[{ id: 'Operatore', label: 'Operatore' }, { id: 'Amministratore', label: 'Amministratore' }]} />
        </Field>
        <Field label="Attivo" hint={b.attivo ? undefined : 'Non compare più in “Entra come” né nelle assegnazioni. Il suo nome resta su rilievi e registro.'}>
          <Switch on={b.attivo} onChange={(v) => set({ attivo: v })} label="Operatore attivo" />
        </Field>
        <Field label="Telefono"><input className="input" value={b.telefono} onChange={(e) => set({ telefono: e.target.value })} /></Field>
        <Field label="Email"><input className="input" type="email" value={b.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Colore sulla mappa" className="span-2">
          <div className="row row--wrap gap-4">{COLORI.map((c) => <button key={c} type="button" className={`swatch ${b.colore === c ? 'is-on' : ''}`} style={{ background: c }} onClick={() => set({ colore: c })} aria-label={c} />)}</div>
        </Field>
      </div>
    </Modal>
  );
}

/** Le cose da fare di un operatore: ciò che gli è assegnato e non è ancora chiuso. */
export function useCoseDaFare(operatoreId: string) {
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const verifiche = db.verifiche.filter((v) => v.stato === 'aperta' && v.operatoreId === operatoreId).sort((a, b) => a.scadenza.localeCompare(b.scadenza));
  const manutenzioni = db.manutenzioni.filter((m) => m.stato === 'programmata' && m.operatoriIds?.includes(operatoreId)).sort((a, b) => (a.dataProgrammata ?? '').localeCompare(b.dataProgrammata ?? ''));
  const operazioni = db.pratiche.filter((p) => p.stato === 'programmata' && p.operatoriIds?.includes(operatoreId)).sort((a, b) => (a.dataOra ?? '').localeCompare(b.dataOra ?? ''));
  return { db, config, verifiche, manutenzioni, operazioni, totale: verifiche.length + manutenzioni.length + operazioni.length };
}

function PannelloOperatore({ o, onChiudi }: { o: Operatore; onChiudi: () => void }) {
  const { db, config, verifiche, manutenzioni, operazioni } = useCoseDaFare(o.id);
  const alert = alertPersonali(db, config, o.id);
  const letti = db.alertLetti;
  return (
    <aside className="drawer drawer--admin" aria-label={`Operatore ${o.nome}`}>
      <div className="drawer__head">
        <span className="row gap-8"><Avatar nome={o.nome} colore={o.colore} size="sm" /><b>{o.nome}</b></span>
        <button className="btn btn--ghost btn--icon btn--sm" onClick={onChiudi} aria-label="Chiudi"><X size={18} /></button>
      </div>
      <div className="drawer__body">
        <section className="sez">
          <h4 className="sez__t"><Bell size={14} /> Alert ({alert.filter((a) => !letti.includes(a.id)).length} da leggere)</h4>
          <div className="col">
            {alert.slice(0, 12).map((a) => (
              <a key={a.id} className="mini-row" href={a.link ? href(a.link) : undefined} style={{ opacity: letti.includes(a.id) ? 0.6 : 1 }}>
                <span className={`alert-dot alert-dot--${a.livello}`} />
                <span className="grow"><b>{a.titolo}</b><span className="small muted"> · {a.messaggio}</span></span>
              </a>
            ))}
            {!alert.length && <p className="small muted">Nessun alert.</p>}
          </div>
        </section>
        <section className="sez">
          <h4 className="sez__t"><FileClock size={14} /> Operazioni programmate ({operazioni.length})</h4>
          <div className="col">
            {operazioni.map((p) => (
              <a key={p.id} className="mini-row" href={href(`/operazioni?id=${p.id}`)}>
                <span className="grow"><b>{NOMI_OPERAZIONE[p.tipo]}</b><span className="small muted"> · {nomeCompleto(p.defunto)}</span></span>
                <span className="badge badge--sm badge--blu">{data(p.dataOra?.slice(0, 10))} · {p.dataOra?.slice(11, 16)}</span>
              </a>
            ))}
            {!operazioni.length && <p className="small muted">Nessuna operazione programmata.</p>}
          </div>
        </section>
        <section className="sez">
          <h4 className="sez__t"><Wrench size={14} /> Manutenzioni assegnate ({manutenzioni.length})</h4>
          <div className="col">
            {manutenzioni.map((m) => (
              <a key={m.id} className="mini-row" href={href(`/manutenzioni?id=${m.id}`)}>
                <span className="grow"><b>{labelLista(config.categorieManutenzione, m.categoria)}</b><span className="small muted"> · {m.schedaId || m.luogo}</span></span>
                <span className="badge badge--sm badge--blu">{data(m.dataProgrammata)}</span>
              </a>
            ))}
            {!manutenzioni.length && <p className="small muted">Nessuna manutenzione assegnata.</p>}
          </div>
        </section>
        <section className="sez">
          <h4 className="sez__t"><ClipboardCheck size={14} /> Verifiche aperte ({verifiche.length})</h4>
          <div className="col">
            {verifiche.slice(0, 15).map((v) => (
              <a key={v.id} className="mini-row" href={href('/censimento?tab=verifiche')}>
                <span className="grow"><b>{labelLista(config.motiviVerifica, v.motivo)}</b><span className="small muted"> · {v.schedaId}</span></span>
                <span className="badge badge--sm badge--giallo">{data(v.scadenza)}</span>
              </a>
            ))}
            {verifiche.length > 15 && <p className="small muted">e altre {verifiche.length - 15}: sono tutte in Censimento › Verifiche.</p>}
            {!verifiche.length && <p className="small muted">Nessuna verifica aperta.</p>}
          </div>
        </section>
      </div>
    </aside>
  );
}

function RigaOperatore({ o, onApri, onModifica, scelto }: { o: Operatore; onApri: () => void; onModifica: () => void; scelto: boolean }) {
  const { db, config, totale } = useCoseDaFare(o.id);
  const quadranti = db.quadranti.filter((q) => q.operatoreId === o.id);
  const alertAperti = alertPersonali(db, config, o.id).filter((a) => !db.alertLetti.includes(a.id)).length;
  return (
    <tr className={`clickable ${scelto ? 'is-sel' : ''}`} onClick={onApri}>
      <td><span className="row gap-8"><Avatar nome={o.nome} colore={o.colore} /><b>{o.nome}</b></span></td>
      <td>{o.ruolo}</td>
      <td className="small">{o.telefono}<br /><span className="muted">{o.email}</span></td>
      <td>
        <span className="row row--wrap gap-4">
          {quadranti.map((q) => <span key={q.id} className="badge badge--sm" style={{ background: `${q.colore}18`, color: q.colore }}>{q.codice}</span>)}
          {!quadranti.length && <span className="muted">—</span>}
        </span>
      </td>
      <td className="num">{alertAperti}</td>
      <td className="num">{totale}</td>
      <td>{o.attivo ? <span className="badge badge--verde badge--sm">Attivo</span> : <span className="badge badge--sm">Non attivo</span>}</td>
      <td onClick={(e) => e.stopPropagation()}><button className="btn btn--xs" onClick={onModifica}><Pencil size={12} />Modifica</button></td>
    </tr>
  );
}

function Operatori() {
  const operatori = useStore((s) => s.db.operatori);
  const [modale, setModale] = useState<{ o?: Operatore } | null>(null);
  const [aperto, setAperto] = useState<string | null>(null);
  const scelto = operatori.find((o) => o.id === aperto);
  return (
    <div className={scelto ? 'griglia griglia--lato' : 'griglia'}>
      <section className="card">
        <div className="card__head">
          <h3>Operatori</h3>
          <button className="btn btn--sm btn--primary" onClick={() => setModale({})}><Plus size={14} />Nuovo operatore</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Operatore</th><th>Ruolo</th><th>Contatti</th><th>Quadranti</th><th className="num">Alert aperti</th><th className="num">Cose da fare</th><th>Stato</th><th /></tr></thead>
            <tbody>
              {operatori.map((o) => (
                <RigaOperatore key={o.id} o={o} scelto={aperto === o.id} onApri={() => setAperto(aperto === o.id ? null : o.id)} onModifica={() => setModale({ o })} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {scelto && <PannelloOperatore o={scelto} onChiudi={() => setAperto(null)} />}
      {modale && <ModaleOperatore o={modale.o} onChiudi={() => setModale(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agenzie funebri
// ---------------------------------------------------------------------------

function ModaleAgenzia({ a, onChiudi }: { a?: AgenziaFunebre; onChiudi: () => void }) {
  const [b, setB] = useState<AgenziaFunebre>(() => a ?? { id: `ag-${Date.now().toString(36)}`, nome: '', partitaIva: '', telefono: '', email: '', attiva: true });
  const set = (p: Partial<AgenziaFunebre>) => setB((x) => ({ ...x, ...p }));
  const salva = () => {
    if (!b.nome.trim()) return toast('Inserisci il nome', 'errore');
    salvaAgenzia({ ...b, nome: b.nome.trim() });
    toast('Agenzia salvata');
    onChiudi();
  };
  return (
    <Modal titolo={a ? `Modifica ${a.nome}` : 'Nuova agenzia'} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={salva}>Salva</button></>}>
      <div className="grid-form">
        <Field label="Nome" className="span-2"><input className="input" value={b.nome} onChange={(e) => set({ nome: e.target.value })} autoFocus /></Field>
        <Field label="Partita IVA"><input className="input mono" value={b.partitaIva} onChange={(e) => set({ partitaIva: e.target.value })} /></Field>
        <Field label="Attiva" hint={b.attiva ? undefined : 'Non si può più scegliere nelle pratiche nuove.'}><Switch on={b.attiva} onChange={(v) => set({ attiva: v })} label="Agenzia attiva" /></Field>
        <Field label="Accesso a CimiTera" hint="Vede solo le sue operazioni e manda richieste all'ufficio." className="span-2"><Switch on={!!b.accesso} onChange={(v) => set({ accesso: v })} label="Accesso a CimiTera" /></Field>
        <Field label="Telefono"><input className="input" value={b.telefono} onChange={(e) => set({ telefono: e.target.value })} /></Field>
        <Field label="Email"><input className="input" type="email" value={b.email} onChange={(e) => set({ email: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function Agenzie() {
  const agenzie = useStore((s) => s.db.agenzie);
  const pratiche = useStore((s) => s.db.pratiche);
  const richieste = useStore((s) => s.db.richieste);
  const [modale, setModale] = useState<{ a?: AgenziaFunebre } | null>(null);
  const [calendario, setCalendario] = useState<AgenziaFunebre | null>(null);
  return (
    <section className="card">
      <div className="card__head">
        <h3>Agenzie funebri</h3>
        <button className="btn btn--sm btn--primary" onClick={() => setModale({})}><Plus size={14} />Nuova agenzia</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Agenzia</th><th>Contatti</th><th>Accesso a CimiTera</th><th className="num">In programma</th><th className="num">In attesa</th><th className="num">Pratiche</th><th /></tr></thead>
          <tbody>
            {agenzie.map((a) => {
              const sue = pratiche.filter((p) => p.agenziaId === a.id);
              return (
                <tr key={a.id}>
                  <td><b className="nowrap">{a.nome}</b> {!a.attiva && <span className="badge badge--sm">Non attiva</span>}<div className="tiny muted mono">P. IVA {a.partitaIva}</div></td>
                  <td className="small nowrap">{a.telefono}<div className="tiny muted">{a.email}</div></td>
                  <td>
                    {a.accesso ? <span className="badge badge--verde badge--sm">Può entrare</span> : <span className="badge badge--sm">Nessun accesso</span>}
                    {a.accesso && <div className="tiny muted nowrap">{a.ultimoAccesso ? `Ultimo accesso ${dataOra(a.ultimoAccesso)}` : 'Mai entrata'}</div>}
                  </td>
                  <td className="num">{sue.filter((p) => p.stato === 'programmata').length}</td>
                  <td className="num">{richieste.filter((r) => r.agenziaId === a.id && r.stato === 'in_attesa').length}</td>
                  <td className="num">{sue.length}</td>
                  <td className="nowrap">
                    <button className="btn btn--xs" onClick={() => setCalendario(a)}><CalendarDays size={12} />Calendario</button>{' '}
                    <button className="btn btn--xs" onClick={() => setModale({ a })}><Pencil size={12} />Modifica</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!agenzie.length && <div className="empty"><h3>Nessuna agenzia funebre</h3></div>}
      </div>
      {modale && <ModaleAgenzia a={modale.a} onChiudi={() => setModale(null)} />}
      {calendario && (
        <Modal titolo={`Calendario · ${calendario.nome}`} sottotitolo="Le operazioni dell'agenzia e le richieste che aspettano la risposta dell'ufficio." size="xl" onClose={() => setCalendario(null)}>
          <Calendario agenziaId={calendario.id} />
        </Modal>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pagina del cittadino: l'indirizzo pubblico e il cartello con il QR da appendere all'ingresso
// ---------------------------------------------------------------------------

function PaginaCittadino() {
  const cim = useCimitero();
  const indirizzo = `${window.location.origin}${window.location.pathname}#/cittadino`;
  const [qr, setQr] = useState('');
  useEffect(() => {
    let vivo = true;
    void import('qrcode').then((m) => m.toDataURL(indirizzo, { margin: 1, width: 360, color: { dark: '#0A2F55', light: '#FFFFFF' } })).then((u) => vivo && setQr(u));
    return () => { vivo = false; };
  }, [indirizzo]);
  return (
    <section className="card">
      <div className="card__head"><h3>Pagina del cittadino</h3></div>
      <div className="cittadino-qr">
        <div className="cittadino-qr__img">{qr ? <img src={qr} alt="QR della pagina del cittadino" /> : <div className="spinner" />}</div>
        <div className="col gap-12">
          <p>Chi entra al cimitero inquadra il QR con il telefono e cerca un defunto: vede dove si trova e come arrivarci. Non serve scaricare niente e non si entra con un account.</p>
          <dl className="kv">
            <dt>Indirizzo</dt><dd className="mono small">{indirizzo}</dd>
            <dt>Cosa vede</dt><dd>Solo la ricerca, il punto sulla mappa e le indicazioni. Le schede con "Visibile al pubblico" spento non si trovano.</dd>
          </dl>
          <div className="row row--wrap gap-8">
            <button className="btn btn--primary" disabled={!qr} onClick={() => void pdfCartelloQr(qr, cim, indirizzo)}><Printer size={15} />Stampa il cartello per l'ingresso</button>
            <a className="btn" href={href('/cittadino')} target="_blank" rel="noreferrer"><ExternalLink size={15} />Apri la pagina</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Registro modifiche: ciò che cambia in Amministrazione e nelle Impostazioni
// ---------------------------------------------------------------------------

function Registro() {
  const registro = useStore((s) => s.config.registro);
  return (
    <section className="card">
      <div className="card__head"><h3>Registro modifiche</h3></div>
      <div className="list">
        {registro.length === 0 && <p className="small muted" style={{ padding: 16 }}>Nessuna modifica ancora.</p>}
        {registro.map((r, i) => (
          <div key={i} className="list-item">
            <span className="grow"><b className="small">{r.descrizione}</b></span>
            <span className="tiny muted nowrap">{r.utente} · {dataOra(r.data)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
