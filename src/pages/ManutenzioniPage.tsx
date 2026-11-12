import { useMemo, useState } from 'react';
import {
  BellPlus, CalendarDays, Camera, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FileSpreadsheet, List, Map as MapIcon, Play, Plus, Search, X,
} from 'lucide-react';
import { CemeteryMap } from '../components/map/CemeteryMap';
import { ScegliFoto } from '../components/scheda/Media';
import { Field, Modal, Tabs } from '../components/ui';
import { PRIORITA, STATI_MANUTENZIONE } from '../config/defaults';
import {
  aggiornaManutenzione, aggiungiFoto, apriModale, creaAlert, indiceSchede, registraEsportazione, risolviManutenzione, seleziona, toast, useStore,
} from '../data/store';
import { descrizioneScheda, labelLista, prioritaDef, useCimitero, useDatiCimitero } from '../data/selectors';
import type { Manutenzione, Priorita, Scheda } from '../data/types';
import { righeManutenzioni, scaricaExcel } from '../lib/excel';
import { aggiungiGiorni, dataBreve, data, GIORNI_BREVI, meseAnno, normalizza, oggiISO } from '../lib/format';
import { segnapostoImmagine } from '../lib/photo';
import { setQuery, useRotta } from '../router';

type Vista = 'elenco' | 'calendario' | 'mappa';

function statoM(id: string) {
  return STATI_MANUTENZIONE.find((s) => s.id === id) ?? STATI_MANUTENZIONE[0];
}

/** Foto caricata dall'operatore; se manca, segnaposto neutro. */
function FotoManutenzione({ m, dopo }: { m: Manutenzione; dopo?: boolean }) {
  const foto = useStore((st) => st.foto);
  const id = dopo ? m.fotoRisoluzione : m.fotoProblemaId;
  const src = (id && foto[id]) || segnapostoImmagine();
  return <img src={src} alt={dopo ? 'Foto dopo l’intervento' : 'Foto della segnalazione'} />;
}

export function ManutenzioniPage() {
  const rotta = useRotta();
  const vista = (rotta.query.get('vista') as Vista) ?? 'elenco';
  const selId = rotta.query.get('id');
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const cimitero = useCimitero();
  const { manutenzioni, strutture, viali, aree } = useDatiCimitero();
  const indice = indiceSchede(db.schede);
  const [stati, setStati] = useState<string[]>(() => (rotta.query.get('stato') ? [rotta.query.get('stato')!] : ['aperta', 'pianificata', 'in_corso']));
  const [prio, setPrio] = useState<string[]>([]);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const oggi = oggiISO();

  const lista = useMemo(() => {
    const t = normalizza(q);
    const peso = { urgente: 0, alta: 1, media: 2, bassa: 3 };
    return manutenzioni
      .filter((m) => (!stati.length || stati.includes(m.stato)) && (!prio.length || prio.includes(m.priorita)) && (!cat || m.categoria === cat))
      .filter((m) => !t || normalizza(`${m.id} ${m.schedaId} ${m.descrizione} ${descrizioneScheda(indice.get(m.schedaId) ?? ({ defunti: [] } as unknown as Scheda))}`).includes(t))
      .sort((a, b) => (a.stato === 'risolta' ? 1 : 0) - (b.stato === 'risolta' ? 1 : 0) || peso[a.priorita] - peso[b.priorita] || b.segnalataIl.localeCompare(a.segnalataIl));
  }, [manutenzioni, stati, prio, cat, q, indice]);

  const sel = selId ? manutenzioni.find((m) => m.id === selId) : undefined;
  const conta = (st: string) => manutenzioni.filter((m) => m.stato === st).length;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Manutenzioni</h1>
        </div>
        <div className="page-head__actions">
          <button className="btn" onClick={() => { scaricaExcel(`CimiTera_manutenzioni_${oggi}`, [{ nome: 'Manutenzioni', righe: righeManutenzioni(db, config, cimitero.id) }]); registraEsportazione('Excel manutenzioni', manutenzioni.length); }}>
            <FileSpreadsheet size={16} />Excel
          </button>
          <button className="btn btn--primary" onClick={() => apriModale({ tipo: 'manutenzione' })}><Plus size={16} />Segnala manutenzione</button>
        </div>
      </div>

      <div>
        <Tabs value={vista} onChange={(v) => setQuery('vista', v)} tabs={[
          { id: 'elenco', label: 'Elenco', icon: <List size={16} />, count: lista.length },
          { id: 'calendario', label: 'Calendario', icon: <CalendarDays size={16} /> },
          { id: 'mappa', label: 'Mappa', icon: <MapIcon size={16} /> },
        ]} />
      </div>

      {vista === 'elenco' && (
        <div className="manut">
          <div className="manut__filtri">
            <div className="input-icon" style={{ minWidth: 220, flex: '1 1 220px' }}>
              <Search size={16} />
              <input className="input input--sm" placeholder="Cerca ID, scheda, descrizione" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="row row--wrap gap-4">
              {STATI_MANUTENZIONE.map((s) => (
                <button key={s.id} className={`chip chip--sm ${stati.includes(s.id) ? 'is-on' : ''}`} onClick={() => setStati(stati.includes(s.id) ? stati.filter((x) => x !== s.id) : [...stati, s.id])}>
                  <span className="dot" style={{ background: s.colore }} />{s.label}
                  <span className="chip__n">{conta(s.id)}</span>
                </button>
              ))}
            </div>
            <div className="row row--wrap gap-4">
              {PRIORITA.map((p) => (
                <button key={p.id} className={`chip chip--sm ${prio.includes(p.id) ? 'is-on' : ''}`} onClick={() => setPrio(prio.includes(p.id) ? prio.filter((x) => x !== p.id) : [...prio, p.id])} style={{ color: p.colore }}>{p.label}<span className="chip__n">{manutenzioni.filter((m) => m.priorita === p.id && m.stato !== 'risolta').length}</span></button>
              ))}
            </div>
            <select className="select select--sm" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Tutte le categorie</option>
              {config.categorieManutenzione.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="manut__grid">
            {lista.map((m) => {
              const s = indice.get(m.schedaId);
              const st = statoM(m.stato);
              const pr = prioritaDef(m.priorita);
              return (
                <button key={m.id} className={`card ticket ${selId === m.id ? 'is-sel' : ''}`} onClick={() => setQuery('id', m.id)}>
                  <div className="ticket__foto"><FotoManutenzione m={m} dopo={m.stato === 'risolta'} /></div>
                  <div className="ticket__body">
                    <div className="row row--between">
                      <span className="tiny muted strong">{m.id}</span>
                      <span className="badge badge--sm" style={{ background: `${st.colore}18`, color: st.colore }}>{st.label}</span>
                    </div>
                    <b className="ticket__title">{labelLista(config.categorieManutenzione, m.categoria)}</b>
                    <span className="small muted ellipsis">{m.schedaId} · {s ? descrizioneScheda(s) : ''}</span>
                    <span className="small ticket__desc">{m.descrizione}</span>
                    <div className="row row--between mt-8">
                      <span className="badge badge--sm" style={{ color: pr.colore, background: `${pr.colore}14` }}>{pr.label}</span>
                      <span className="tiny muted">
                        {m.stato === 'risolta' ? `Risolta ${dataBreve(m.risoltaIl)}` : m.dataPianificata ? `In calendario ${dataBreve(m.dataPianificata)}` : `Segnalata ${dataBreve(m.segnalataIl)} · ${m.fonte}`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {!lista.length && <div className="empty" style={{ gridColumn: '1 / -1' }}><h3>Nessuna manutenzione con questi filtri</h3></div>}
          </div>
        </div>
      )}

      {vista === 'calendario' && <Calendario manutenzioni={manutenzioni} />}

      {vista === 'mappa' && (
        <div className="card" style={{ height: 'calc(100dvh - 330px)', minHeight: 420, overflow: 'hidden', position: 'relative' }}>
          <CemeteryMap
            cimitero={cimitero}
            schede={Array.from(new Set(manutenzioni.filter((m) => m.stato !== 'risolta').map((m) => m.schedaId))).map((id) => indice.get(id)!).filter((s) => s && !s.posizione && !s.strutturaId)}
            strutture={strutture.filter((st) => manutenzioni.some((m) => m.stato !== 'risolta' && (indice.get(m.schedaId)?.posizione?.strutturaId === st.id || m.schedaId === st.schedaId)))}
            viali={viali}
            aree={aree}
            stile="satellite"
            onSelect={(id) => {
              const m = manutenzioni.find((x) => x.schedaId === id && x.stato !== 'risolta');
              if (m) setQuery('id', m.id);
            }}
          />
        </div>
      )}

      {sel && <DettaglioManutenzione m={sel} onChiudi={() => setQuery('id', null)} />}
    </div>
  );
}

function Calendario({ manutenzioni }: { manutenzioni: Manutenzione[] }) {
  const config = useStore((s) => s.config);
  const oggi = oggiISO();
  const [mese, setMese] = useState(() => ({ y: Number(oggi.slice(0, 4)), m: Number(oggi.slice(5, 7)) - 1 }));
  const [daPianificare, setDaPianificare] = useState<string | null>(null);
  const [pianifica, setPianifica] = useState<{ id: string; data: string } | null>(null);
  const primo = new Date(mese.y, mese.m, 1);
  const offset = (primo.getDay() + 6) % 7;
  const giorni = new Date(mese.y, mese.m + 1, 0).getDate();
  const celle = Array.from({ length: Math.ceil((offset + giorni) / 7) * 7 }, (_, i) => {
    const g = i - offset + 1;
    return g >= 1 && g <= giorni ? `${mese.y}-${String(mese.m + 1).padStart(2, '0')}-${String(g).padStart(2, '0')}` : null;
  });
  const aperte = manutenzioni.filter((m) => m.stato === 'aperta');
  const sposta = (d: number) => setMese(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));

  return (
    <div className="cal-wrap">
      <section className="card cal">
        <div className="card__head">
          <h2 style={{ textTransform: 'capitalize' }}>{meseAnno(mese.y, mese.m)}</h2>
          <div className="row gap-4">
            <button className="btn btn--sm btn--icon" onClick={() => sposta(-1)} aria-label="Mese precedente"><ChevronLeft size={16} /></button>
            <button className="btn btn--sm" onClick={() => setMese({ y: Number(oggi.slice(0, 4)), m: Number(oggi.slice(5, 7)) - 1 })}>Oggi</button>
            <button className="btn btn--sm btn--icon" onClick={() => sposta(1)} aria-label="Mese successivo"><ChevronRight size={16} /></button>
          </div>
        </div>
        {daPianificare && <div className="callout" style={{ margin: '12px 16px 0' }}>Scegli il giorno in cui pianificare <b>{daPianificare}</b>.</div>}
        <div className="cal__grid">
          {GIORNI_BREVI.map((g) => <div key={g} className="cal__dow">{g}</div>)}
          {celle.map((d, i) => {
            const items = d ? manutenzioni.filter((m) => m.dataPianificata === d && m.stato !== 'aperta') : [];
            return (
              <div
                key={i}
                className={`cal__day ${!d ? 'is-out' : ''} ${d === oggi ? 'is-today' : ''} ${daPianificare && d ? 'is-target' : ''}`}
                onClick={() => d && daPianificare && setPianifica({ id: daPianificare, data: d })}
              >
                {d && <span className="cal__n">{Number(d.slice(8))}</span>}
                {items.slice(0, 4).map((m) => (
                  <button key={m.id} className="cal__item" style={{ borderLeftColor: prioritaDef(m.priorita).colore, opacity: m.stato === 'risolta' ? 0.55 : 1 }} onClick={(e) => { e.stopPropagation(); setQuery('id', m.id); }} title={`${m.id} · ${m.descrizione}`}>
                    {m.stato === 'risolta' ? '✓ ' : ''}{labelLista(config.categorieManutenzione, m.categoria)}
                  </button>
                ))}
                {items.length > 4 && <span className="tiny muted">+{items.length - 4}</span>}
              </div>
            );
          })}
        </div>
      </section>
      <aside className="card cal-side">
        <div className="card__head"><h3>Da pianificare <span className="badge badge--sm">{aperte.length}</span></h3></div>
        <div className="list" style={{ maxHeight: 560, overflow: 'auto' }}>
          {aperte.map((m) => (
            <button key={m.id} className={`list-item ${daPianificare === m.id ? 'is-sel' : ''}`} onClick={() => setDaPianificare(daPianificare === m.id ? null : m.id)} style={daPianificare === m.id ? { background: '#EAF2F9' } : undefined}>
              <span className="dot" style={{ background: prioritaDef(m.priorita).colore }} />
              <span className="grow" style={{ minWidth: 0 }}>
                <b className="small">{labelLista(config.categorieManutenzione, m.categoria)}</b>
                <span className="tiny muted ellipsis" style={{ display: 'block' }}>{m.schedaId} · {m.descrizione}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>
      {pianifica && (
        <ModalePianifica
          id={pianifica.id}
          dataIniziale={pianifica.data}
          onChiudi={(fatto) => {
            setPianifica(null);
            if (fatto) setDaPianificare(null);
          }}
        />
      )}
    </div>
  );
}

function ModalePianifica({ id, dataIniziale, onChiudi }: { id: string; dataIniziale?: string; onChiudi: (fatto: boolean) => void }) {
  const config = useStore((s) => s.config);
  const m = useStore((s) => s.db.manutenzioni.find((x) => x.id === id))!;
  const [dataP, setDataP] = useState(dataIniziale ?? m.dataPianificata ?? aggiungiGiorni(oggiISO(), 3));
  const [squadra, setSquadra] = useState(m.squadra ?? config.squadre[0]?.id ?? '');
  return (
    <Modal titolo={`Pianifica ${m.id}`} sottotitolo={m.descrizione} onClose={() => onChiudi(false)}
      footer={<><button className="btn" onClick={() => onChiudi(false)}>Annulla</button><button className="btn btn--primary" onClick={() => { aggiornaManutenzione(id, { stato: m.stato === 'in_corso' ? 'in_corso' : 'pianificata', dataPianificata: dataP, squadra }); toast(`Intervento in calendario il ${data(dataP)}`); onChiudi(true); }}>Metti in calendario</button></>}>
      <div className="grid-form">
        <Field label="Data dell'intervento"><input className="input" type="date" value={dataP} onChange={(e) => setDataP(e.target.value)} /></Field>
        <Field label="Squadra"><select className="select" value={squadra} onChange={(e) => setSquadra(e.target.value)}>{config.squadre.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
      </div>
    </Modal>
  );
}

function ModaleRisolvi({ m, onChiudi }: { m: Manutenzione; onChiudi: () => void }) {
  const [foto, setFoto] = useState<string | null>(null);
  const [note, setNote] = useState('');
  return (
    <Modal titolo={`Risolvi ${m.id}`} sottotitolo="Per chiudere la manutenzione allega la foto aggiornata del manufatto." onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--success" disabled={!foto} onClick={() => { risolviManutenzione(m.id, aggiungiFoto(foto!), note || 'Intervento completato'); toast('Manutenzione risolta, foto aggiornata nella scheda'); onChiudi(); }}><CheckCircle2 size={16} />Segna come risolta</button></>}>
      <div className="col gap-16">
        {foto ? (
          <div className="foto"><img src={foto} alt="Foto aggiornata" /></div>
        ) : (
          <ScegliFoto className="drop" onFoto={setFoto}>
            <Camera size={26} />
            <div className="strong mt-8">Scatta o carica la foto aggiornata</div>
            <div className="small">Obbligatoria: diventa la nuova foto della scheda</div>
          </ScegliFoto>
        )}
        {foto && <ScegliFoto className="btn btn--sm" onFoto={setFoto}><Camera size={14} />Cambia foto</ScegliFoto>}
        <Field label="Note sull'intervento"><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. sostituita la lastra, sigillato il giunto" /></Field>
      </div>
    </Modal>
  );
}

function ModaleAlert({ m, onChiudi }: { m: Manutenzione; onChiudi: () => void }) {
  const config = useStore((s) => s.config);
  const [titolo, setTitolo] = useState(`${labelLista(config.categorieManutenzione, m.categoria)} · ${m.schedaId}`);
  const [messaggio, setMessaggio] = useState(m.descrizione);
  const [priorita, setPriorita] = useState<Priorita>(m.priorita);
  const [dataA, setDataA] = useState(oggiISO());
  return (
    <Modal titolo="Crea alert" sottotitolo="L'alert compare nella dashboard e nella campanella di tutti gli operatori." onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={() => { creaAlert({ tipo: 'manutenzione', priorita, titolo, messaggio, data: dataA, schedaId: m.schedaId, manutenzioneId: m.id }); onChiudi(); }}>Crea alert</button></>}>
      <div className="col gap-12">
        <Field label="Titolo"><input className="input" value={titolo} onChange={(e) => setTitolo(e.target.value)} /></Field>
        <Field label="Messaggio"><textarea className="textarea" value={messaggio} onChange={(e) => setMessaggio(e.target.value)} /></Field>
        <div className="grid-form">
          <Field label="Priorità"><select className="select" value={priorita} onChange={(e) => setPriorita(e.target.value as Priorita)}>{PRIORITA.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
          <Field label="Data"><input className="input" type="date" value={dataA} onChange={(e) => setDataA(e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  );
}

function DettaglioManutenzione({ m, onChiudi }: { m: Manutenzione; onChiudi: () => void }) {
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const s = indiceSchede(db.schede).get(m.schedaId);
  const [modale, setModale] = useState<'pianifica' | 'risolvi' | 'alert' | null>(null);
  const st = statoM(m.stato);
  const pr = prioritaDef(m.priorita);
  const operatore = db.operatori.find((o) => o.id === m.segnalataDa);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onChiudi()}>
      <div className="modal modal--lg">
        <div className="modal__head">
          <div>
            <div className="row gap-8">
              <span className="badge" style={{ background: `${st.colore}18`, color: st.colore }}>{st.label}</span>
              <span className="badge" style={{ color: pr.colore, background: `${pr.colore}14` }}>Priorità {pr.label.toLowerCase()}</span>
            </div>
            <h2 className="mt-8">{labelLista(config.categorieManutenzione, m.categoria)} · {m.id}</h2>
            <p>{s ? `${s.id} · ${descrizioneScheda(s)} · ${s.viale}` : m.schedaId}</p>
          </div>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={onChiudi} aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="modal__body">
          <div className={`prima-dopo ${m.stato === 'risolta' ? '' : 'prima-dopo--uno'}`}>
            <figure><div className="foto"><FotoManutenzione m={m} /></div><figcaption>Segnalazione · {data(m.segnalataIl)}</figcaption></figure>
            {m.stato === 'risolta' && <figure><div className="foto"><FotoManutenzione m={m} dopo /></div><figcaption>Dopo l'intervento · {data(m.risoltaIl)}</figcaption></figure>}
          </div>
          <dl className="kv mt-16">
            <dt>Descrizione</dt><dd>{m.descrizione}</dd>
            <dt>Fonte</dt><dd>{m.fonte}{operatore ? ` · ${operatore.nome}` : ''}</dd>
            <dt>Segnalata il</dt><dd>{data(m.segnalataIl)}</dd>
            <dt>Squadra</dt><dd>{labelLista(config.squadre, m.squadra)}</dd>
            <dt>In calendario</dt><dd>{data(m.dataPianificata)}</dd>
            {m.stato === 'risolta' && (<><dt>Risolta il</dt><dd>{data(m.risoltaIl)}</dd><dt>Note</dt><dd>{m.noteRisoluzione}</dd></>)}
          </dl>
        </div>
        <div className="modal__foot">
          {s && <button className="btn" onClick={() => { onChiudi(); seleziona(s.id); }}><ExternalLink size={15} />Apri scheda</button>}
          {m.stato !== 'risolta' && <button className="btn" onClick={() => setModale('alert')}><BellPlus size={15} />Crea alert</button>}
          {m.stato !== 'risolta' && <button className="btn" onClick={() => setModale('pianifica')}><CalendarDays size={15} />{m.dataPianificata ? 'Ripianifica' : 'Pianifica'}</button>}
          {m.stato === 'pianificata' && <button className="btn" onClick={() => { aggiornaManutenzione(m.id, { stato: 'in_corso' }); toast('Lavori avviati'); }}><Play size={15} />Avvia lavori</button>}
          {m.stato !== 'risolta' && <button className="btn btn--success" onClick={() => setModale('risolvi')}><CheckCircle2 size={15} />Risolvi</button>}
        </div>
      </div>
      {modale === 'pianifica' && <ModalePianifica id={m.id} onChiudi={() => setModale(null)} />}
      {modale === 'risolvi' && <ModaleRisolvi m={m} onChiudi={() => setModale(null)} />}
      {modale === 'alert' && <ModaleAlert m={m} onChiudi={() => setModale(null)} />}
    </div>
  );
}

