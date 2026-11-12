import { useMemo, useState } from 'react';
import {
  Building2, CalendarDays, Grid3x3, CheckCircle2, ClipboardCheck, Layers, MapPinned, Pencil, Plus, Search, Trash2, TrendingUp, Undo2, Users, X,
} from 'lucide-react';
import { CemeteryMap, ZoomControls } from '../components/map/CemeteryMap';
import { LocationPicker } from '../components/map/LocationPicker';
import { BarraPagine, paginaDi } from '../components/Esporta';
import { Avatar, Barre, Ciambella, Field, Modal, Progress, Seg, StatoBadge, Switch, Tabs } from '../components/ui';
import {
  aggiornaQuadrante, apriParete, apriModale, completaVerifica, contaNelPoligono, creaQuadrante, creaStruttura, eliminaQuadrante, indiceSchede,
  resetFiltri, seleziona, toast, useStore,
} from '../data/store';
import { conta, descrizioneScheda, labelLista, occupazioneStruttura, useCimitero, useDatiCimitero, useSchedeCimitero, useUtente } from '../data/selectors';
import { NOMI_STRUTTURA } from '../config/defaults';
import type { Faccia, LatLng, Quadrante, Struttura, Verifica } from '../data/types';
import { aggiungiGiorni, data, dataBreve, dataOra, numero, oggiISO, percentuale } from '../lib/format';
import { quadranteDi, vialePiuVicino } from '../lib/geo';
import { useTelefono } from '../lib/schermo';
import { setQuery, useRotta, vai } from '../router';

type Tab = 'avanzamento' | 'quadranti' | 'operatori' | 'verifiche' | 'strutture';
const ORDINE_STRUTTURE: Struttura['tipo'][] = ['colombaio', 'cappella', 'ossario', 'cinerario'];
const COLORI = ['#2F6FB3', '#8E5BB5', '#1E8C8C', '#C0487A', '#5E9A3A', '#E07B22', '#4F5FB8', '#B8860B', '#D9473F', '#0A2F55'];

export function CensimentoPage() {
  const rotta = useRotta();
  const telefono = useTelefono();
  const tab = (rotta.query.get('tab') as Tab) ?? 'avanzamento';
  const verifiche = useStore((s) => s.db.verifiche);
  const { quadranti, strutture } = useDatiCimitero();
  const operatori = useStore((s) => s.db.operatori);
  // sul telefono Censimento non c'è: resta la voce Verifiche, con le verifiche aperte di chi è entrato
  if (telefono)
    return (
      <div className="page">
        <div className="page-head">
          <div className="page-head__title"><h1>Verifiche</h1></div>
        </div>
        <VerificheTelefono />
      </div>
    );
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Censimento</h1>
        </div>
      </div>
      <Tabs value={tab} onChange={(t) => setQuery('tab', t)} tabs={[
        { id: 'avanzamento', label: 'Avanzamento', icon: <TrendingUp size={16} /> },
        { id: 'quadranti', label: 'Quadranti', icon: <Layers size={16} />, count: quadranti.length },
        { id: 'operatori', label: 'Operatori', icon: <Users size={16} />, count: operatori.length },
        { id: 'verifiche', label: 'Verifiche', icon: <ClipboardCheck size={16} />, count: verifiche.filter((v) => v.stato === 'aperta').length },
        { id: 'strutture', label: 'Colombari e cappelle', icon: <Building2 size={16} />, count: strutture.length },
      ]} />
      {tab === 'avanzamento' && <Avanzamento />}
      {tab === 'quadranti' && <Quadranti />}
      {tab === 'operatori' && <Operatori />}
      {tab === 'verifiche' && <Verifiche />}
      {tab === 'strutture' && <Strutture />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Avanzamento() {
  const schede = useSchedeCimitero();
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const { quadranti } = useDatiCimitero();
  const oggi = oggiISO();
  const stimate = quadranti.reduce((t, q) => t + q.stimaManufatti, 0);
  const giorni = useMemo(() => {
    const perGiorno = conta(schede, (s) => s.rilevatoIl.slice(0, 10));
    const out = [];
    for (let i = 44; i >= 0; i--) {
      const d = aggiungiGiorni(oggi, -i);
      out.push({ label: i % 7 === 0 ? d.slice(8, 10) : '', valore: perGiorno[d] ?? 0, titolo: `${dataBreve(d)}: ${perGiorno[d] ?? 0} schede` });
    }
    return out;
  }, [schede, oggi]);
  const ultimi30 = schede.filter((s) => s.rilevatoIl.slice(0, 10) >= aggiungiGiorni(oggi, -30)).length;
  const daVerificare = schede.filter((s) => s.stato === 'da_verificare').length;
  const incompleti = schede.filter((s) => s.defunti.some((d) => !d.dataMorte || !d.nome)).length;
  const media = Math.round(ultimi30 / 22);
  const restanti = Math.max(0, stimate - schede.length);
  const fine = media ? aggiungiGiorni(oggi, Math.ceil((restanti / media) * 1.4)) : null;
  const stati = config.stati.filter((x) => !x.archiviato);
  const perStato = useMemo(() => conta(schede, (s) => s.stato), [schede]);
  // per ogni tipologia: quante postazioni e quante libere
  const tipologie = useMemo(() => config.tipologie.filter((t) => !t.archiviata).map((t) => {
    const sue = schede.filter((s) => s.tipologia === t.id);
    return { ...t, totale: sue.length, libere: sue.filter((s) => s.stato === 'libero').length };
  }).filter((t) => t.totale > 0), [schede, config.tipologie]);
  const maxTip = Math.max(1, ...tipologie.map((t) => t.totale));

  return (
    <div className="col gap-16">
      <div className="kpi-grid">
        <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Schede censite</span><span className="kpi__value">{numero(schede.length)}<small>/ {numero(stimate)}</small></span><Progress value={schede.length} max={stimate} verde small /></span></div>
        <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Ultimi 30 giorni</span><span className="kpi__value">{numero(ultimi30)}</span><span className="kpi__sub">circa {media} schede per giorno lavorativo</span></span></div>
        <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Fine stimata</span><span className="kpi__value" style={{ fontSize: 22 }}>{fine ? dataBreve(fine) : '—'}</span><span className="kpi__sub">{numero(restanti)} postazioni da censire</span></span></div>
        <button className="card kpi-card card--link" onClick={() => setQuery('tab', 'verifiche')}><span className="kpi"><span className="kpi__label">Da verificare</span><span className="kpi__value" style={{ color: '#B8860B' }}>{daVerificare}</span><span className="kpi__sub">{incompleti} con dati anagrafici incompleti</span></span></button>
      </div>
      <div className="griglia griglia--3">
        <section className="card card--pad">
          <h3>Schede censite al giorno · ultime 6 settimane</h3>
          <div className="mt-16"><Barre dati={giorni} altezza={150} colore="#79AA4F" /></div>
        </section>
        <section className="card card--pad">
          <h3>Stato delle postazioni</h3>
          <div className="row gap-16 mt-16 row--wrap">
            <Ciambella size={150} spessore={20} dati={stati.map((x) => ({ id: x.id, label: x.label, valore: perStato[x.id] ?? 0, colore: x.colore }))}
              centro={<div className="display" style={{ fontSize: 22, fontWeight: 800 }}>{numero(schede.length)}</div>} sotto={<div className="tiny muted">schede</div>} />
            <div className="col gap-8 grow">
              {stati.map((x) => (
                <div key={x.id} className="row row--between gap-16 small">
                  <StatoBadge stato={x.id} small />
                  <span className="mono"><b>{numero(perStato[x.id] ?? 0)}</b> <span className="muted">· {percentuale(perStato[x.id] ?? 0, schede.length)}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card card--pad">
          <h3>Tipologie</h3>
          <div className="col gap-12 mt-16">
            {tipologie.map((t) => (
              <div key={t.id} className="tip-riga">
                <div className="row row--between small">
                  <b>{t.label}</b>
                  <span className="mono">{numero(t.totale)} <span className="muted">· {numero(t.libere)} libere</span></span>
                </div>
                <div className="tip-riga__barra" title={`${t.totale - t.libere} occupate o da controllare, ${t.libere} libere`}>
                  <span style={{ width: `${((t.totale - t.libere) / maxTip) * 100}%`, background: t.colore }} />
                  <span style={{ width: `${(t.libere / maxTip) * 100}%`, background: `${t.colore}55` }} />
                </div>
              </div>
            ))}
            {!tipologie.length && <p className="small muted">Nessuna scheda censita.</p>}
          </div>
        </section>
      </div>
      <section className="card">
        <div className="card__head"><h3>Avanzamento per quadrante</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Quadrante</th><th>Operatore</th><th style={{ width: '20%' }}>Avanzamento</th><th className="num">Censite</th><th className="num">Stimate</th>
                {stati.map((x) => <th key={x.id} className="num">{x.label}</th>)}
                <th>Ultimo rilievo</th>
              </tr>
            </thead>
            <tbody>
              {quadranti.map((q) => {
                const qs = schede.filter((s) => s.quadranteId === q.id);
                const op = db.operatori.find((o) => o.id === q.operatoreId);
                const ultimo = qs.reduce((m, s) => (s.rilevatoIl > m ? s.rilevatoIl : m), '');
                const p = percentuale(qs.length, q.stimaManufatti);
                return (
                  <tr key={q.id} className="clickable" onClick={() => vai(`/censimento?tab=quadranti&q=${q.id}`)}>
                    <td><span className="row gap-8"><span className="q-row__code" style={{ background: q.colore }}>{q.codice}</span><b>{q.nome.split('·')[1]?.trim() ?? q.nome}</b></span></td>
                    <td>{op ? <span className="row gap-8"><Avatar nome={op.nome} colore={op.colore} size="sm" />{op.nome}</span> : <span className="muted">Non assegnato</span>}</td>
                    <td><div className="row gap-8"><div className="grow"><Progress value={qs.length} max={q.stimaManufatti} colore={q.colore} /></div><b className="mono small">{p}%</b></div></td>
                    <td className="num">{numero(qs.length)}</td>
                    <td className="num">{numero(q.stimaManufatti)}</td>
                    {stati.map((x) => <td key={x.id} className="num">{numero(qs.filter((y) => y.stato === x.id).length)}</td>)}
                    <td className="small muted nowrap">{ultimo ? dataOra(ultimo) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!quadranti.length && <div className="empty"><h3>Nessun quadrante</h3><p>Disegnane uno nella linguetta Quadranti.</p></div>}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ModaleQuadrante({ q, poligono, onChiudi }: { q?: Quadrante; poligono?: LatLng[]; onChiudi: () => void }) {
  const cim = useCimitero();
  const operatori = useStore((s) => s.db.operatori);
  const quadranti = useStore((s) => s.db.quadranti).filter((x) => x.cimiteroId === cim.id);
  const dentro = poligono ? contaNelPoligono(poligono, cim.id) : 0;
  const [b, setB] = useState<Omit<Quadrante, 'id'>>(() =>
    q ?? {
      cimiteroId: cim.id, codice: String.fromCharCode(65 + quadranti.length), nome: `Quadrante ${String.fromCharCode(65 + quadranti.length)} · `, colore: COLORI[quadranti.length % COLORI.length],
      poligono: poligono ?? [], operatoreId: null, stato: 'da_avviare', stimaManufatti: Math.max(dentro, Math.round(dentro * 1.15)) || 50,
    },
  );
  const set = (p: Partial<typeof b>) => setB((x) => ({ ...x, ...p }));
  const salva = () => {
    if (!b.nome.trim()) return toast('Dai un nome al quadrante', 'errore');
    if (q) {
      aggiornaQuadrante(q.id, b);
      toast('Quadrante aggiornato');
    } else {
      creaQuadrante(b);
      toast(`Quadrante creato: ${dentro} schede assegnate`);
    }
    onChiudi();
  };
  return (
    <Modal titolo={q ? `Modifica ${q.nome}` : 'Nuovo quadrante'} sottotitolo={!q ? `Il poligono disegnato contiene ${dentro} schede già censite.` : undefined} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={salva}>Salva quadrante</button></>}>
      <div className="grid-form">
        <Field label="Codice"><input className="input" value={b.codice} maxLength={3} onChange={(e) => set({ codice: e.target.value.toUpperCase() })} /></Field>
        <Field label="Nome"><input className="input" value={b.nome} onChange={(e) => set({ nome: e.target.value })} /></Field>
        <Field label="Operatore assegnato">
          <select className="select" value={b.operatoreId ?? ''} onChange={(e) => set({ operatoreId: e.target.value || null })}>
            <option value="">Nessuno</option>
            {operatori.filter((o) => o.attivo).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </Field>
        <Field label="Postazioni stimate" hint="Serve a calcolare l'avanzamento"><input className="input" type="number" min={1} value={b.stimaManufatti} onChange={(e) => set({ stimaManufatti: Number(e.target.value) })} /></Field>
        <Field label="Stato">
          <select className="select" value={b.stato} onChange={(e) => set({ stato: e.target.value as Quadrante['stato'] })}>
            <option value="da_avviare">Da avviare</option><option value="in_corso">In corso</option><option value="completato">Completato</option>
          </select>
        </Field>
        <Field label="Colore">
          <div className="row row--wrap gap-4">
            {COLORI.map((c) => <button key={c} type="button" className={`swatch ${b.colore === c ? 'is-on' : ''}`} style={{ background: c }} onClick={() => set({ colore: c })} aria-label={c} />)}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

function Quadranti() {
  const cim = useCimitero();
  const schede = useSchedeCimitero();
  const db = useStore((s) => s.db);
  const { quadranti, viali, aree, strutture } = useDatiCimitero();
  const rotta = useRotta();
  const evid = rotta.query.get('q');
  const [disegno, setDisegno] = useState<LatLng[] | null>(null);
  const [modale, setModale] = useState<{ q?: Quadrante; poligono?: LatLng[] } | null>(null);
  const [mostraPin, setMostraPin] = useState(true);
  return (
    <div className="quad">
      <section className="card quad__map">
        <CemeteryMap
          cimitero={cim}
          schede={mostraPin ? schede : []}
          strutture={mostraPin ? strutture : []}
          quadranti={quadranti}
          mostraQuadranti
          evidenziaQuadrante={evid}
          viali={viali}
          aree={aree}
          stile="satellite"
          compatta
          mostraPartenza
          disegno={disegno}
          onMapClick={disegno ? (p) => setDisegno([...disegno, p]) : undefined}
          onSelect={disegno ? undefined : (id) => seleziona(id)}
          segueVolo={false}
        >
          <ZoomControls />
        </CemeteryMap>
        {disegno ? (
          <div className="draw-bar">
            <b>Disegna il quadrante</b>
            <span className="small muted">Clicca sulla mappa per aggiungere i vertici ({disegno.length})</span>
            <button className="btn btn--sm" disabled={!disegno.length} onClick={() => setDisegno(disegno.slice(0, -1))}><Undo2 size={14} />Annulla punto</button>
            <button className="btn btn--sm" onClick={() => setDisegno(null)}><X size={14} />Esci</button>
            <button className="btn btn--sm btn--primary" disabled={disegno.length < 3} onClick={() => { setModale({ poligono: disegno }); setDisegno(null); }}>Completa</button>
          </div>
        ) : (
          <div className="draw-bar draw-bar--soft">
            <label className="row small" style={{ cursor: 'pointer' }}><Switch small on={mostraPin} onChange={setMostraPin} />Schede</label>
            <button className="btn btn--sm btn--primary" onClick={() => setDisegno([])}><Plus size={14} />Disegna un nuovo quadrante</button>
          </div>
        )}
      </section>
      <section className="card quad__list">
        <div className="card__head"><h3>Quadranti · {cim.breve}</h3></div>
        <div className="list">
          {quadranti.map((q) => {
            const n = schede.filter((s) => s.quadranteId === q.id).length;
            const op = db.operatori.find((o) => o.id === q.operatoreId);
            return (
              <div key={q.id} className={`quad__item ${evid === q.id ? 'is-sel' : ''}`} onClick={() => setQuery('q', evid === q.id ? null : q.id)}>
                <span className="q-row__code" style={{ background: q.colore }}>{q.codice}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row row--between"><b className="ellipsis">{q.nome}</b><span className="small mono">{percentuale(n, q.stimaManufatti)}%</span></div>
                  <Progress value={n} max={q.stimaManufatti} small colore={q.colore} />
                  <div className="row row--between tiny muted mt-8">
                    <span>{op ? op.nome : 'Nessun operatore'}</span>
                    <span>{numero(n)} / {numero(q.stimaManufatti)}</span>
                  </div>
                </div>
                <div className="col gap-4" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn--xs btn--icon" title="Modifica" onClick={() => setModale({ q })}><Pencil size={13} /></button>
                  <button className="btn btn--xs btn--icon" title="Filtra sulla mappa" onClick={() => { resetFiltri({ quadranti: [q.id] }); vai('/mappa'); }}><MapPinned size={13} /></button>
                  <button className="btn btn--xs btn--icon btn--danger" title="Elimina" onClick={() => { if (confirm(`Eliminare ${q.nome}? Le schede restano, senza quadrante.`)) { eliminaQuadrante(q.id); toast('Quadrante eliminato'); } }}><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
          {!quadranti.length && <p className="small muted" style={{ padding: 16 }}>Nessun quadrante: disegnane uno sulla mappa.</p>}
        </div>
      </section>
      {modale && <ModaleQuadrante q={modale.q} poligono={modale.poligono} onChiudi={() => setModale(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Operatori() {
  const db = useStore((s) => s.db);
  const schede = useSchedeCimitero();
  const { quadranti } = useDatiCimitero();
  const oggi = oggiISO();
  return (
    <section className="card">
      <div className="card__head">
        <h3>Operatori</h3>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Operatore</th><th>Quadranti</th><th className="num">Schede rilevate</th><th className="num">Oggi</th><th>Ultima attività</th><th className="num">Verifiche aperte</th><th>Contatti</th></tr></thead>
          <tbody>
            {db.operatori.map((o) => {
              const sue = schede.filter((s) => s.rilevatoDa === o.id);
              const ultimo = sue.reduce((m, s) => (s.rilevatoIl > m ? s.rilevatoIl : m), '');
              const suoi = quadranti.filter((q) => q.operatoreId === o.id);
              return (
                <tr key={o.id}>
                  <td><span className="row gap-8"><Avatar nome={o.nome} colore={o.colore} /><span><b>{o.nome}</b>{!o.attivo && <div className="tiny muted">Non attivo</div>}</span></span></td>
                  <td>
                    <span className="row row--wrap gap-4">
                      {suoi.map((q) => <span key={q.id} className="badge badge--sm" style={{ background: `${q.colore}18`, color: q.colore }}>{q.codice}</span>)}
                      {!suoi.length && <span className="muted">—</span>}
                    </span>
                  </td>
                  <td className="num">{numero(sue.length)}</td>
                  <td className="num">{sue.filter((s) => s.rilevatoIl.startsWith(oggi)).length}</td>
                  <td className="small nowrap">{ultimo ? dataOra(ultimo) : '—'}</td>
                  <td className="num">{db.verifiche.filter((v) => v.operatoreId === o.id && v.stato === 'aperta').length}</td>
                  <td className="small">{o.telefono}<br /><span className="muted">{o.email}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function ModaleChiudiVerifica({ v, onChiudi }: { v: Verifica; onChiudi: () => void }) {
  const config = useStore((s) => s.config);
  const s = indiceSchede(useStore((st) => st.db.schede)).get(v.schedaId);
  const [esito, setEsito] = useState<NonNullable<Verifica['esito']>>('confermata');
  const [stato, setStato] = useState(s?.defunti.length || s?.strutturaId ? 'occupato' : 'libero');
  const [note, setNote] = useState('');
  return (
    <Modal titolo={`Chiudi la verifica ${v.id}`} sottotitolo={s ? `${s.id} · ${descrizioneScheda(s)}` : v.schedaId} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--success" onClick={() => { completaVerifica(v.id, esito, note, stato); toast('Verifica chiusa'); onChiudi(); }}><CheckCircle2 size={15} />Chiudi verifica</button></>}>
      <div className="col gap-16">
        <Field label="Esito">
          <Seg light value={esito} onChange={setEsito} options={[{ id: 'confermata', label: 'Dati confermati' }, { id: 'corretta', label: 'Dati corretti' }, { id: 'non_verificabile', label: 'Non verificabile' }]} />
        </Field>
        <Field label="Nuovo stato della scheda">
          <select className="select" value={stato} onChange={(e) => setStato(e.target.value)}>
            {config.stati.filter((x) => !x.archiviato).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </Field>
        <Field label="Note"><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. data di morte recuperata dal registro" /></Field>
        {esito === 'corretta' && s && <button className="btn btn--sm" onClick={() => { onChiudi(); seleziona(s.id); }}><Pencil size={14} />Apri la scheda per correggere i dati</button>}
      </div>
    </Modal>
  );
}

function Verifiche() {
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const schede = useSchedeCimitero();
  const indice = indiceSchede(db.schede);
  const ids = useMemo(() => new Set(schede.map((s) => s.id)), [schede]);
  const [filtro, setFiltro] = useState<'aperta' | 'completata'>('aperta');
  const [pagina, setPagina] = useState(0);
  const [chiudi, setChiudi] = useState<Verifica | null>(null);
  const oggi = oggiISO();
  const lista = db.verifiche.filter((v) => ids.has(v.schedaId) && v.stato === filtro).sort((a, b) => (filtro === 'aperta' ? a.scadenza.localeCompare(b.scadenza) : (b.completataIl ?? '').localeCompare(a.completataIl ?? '')));
  return (
    <section className="card">
      <div className="card__head">
        <Seg light small value={filtro} onChange={(f) => { setFiltro(f); setPagina(0); }} options={[{ id: 'aperta', label: `Aperte (${db.verifiche.filter((v) => ids.has(v.schedaId) && v.stato === 'aperta').length})` }, { id: 'completata', label: 'Completate' }]} />
        <button className="btn btn--sm btn--primary" onClick={() => apriModale({ tipo: 'verifica' })}><Plus size={14} />Assegna verifica</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>ID</th><th>Scheda</th><th>Motivo</th><th>Operatore</th><th>Assegnata</th><th>{filtro === 'aperta' ? 'Scadenza' : 'Esito'}</th><th /></tr></thead>
          <tbody>
            {paginaDi(lista, pagina).map((v) => {
              const s = indice.get(v.schedaId);
              const op = db.operatori.find((o) => o.id === v.operatoreId);
              const ritardo = v.stato === 'aperta' && v.scadenza < oggi;
              return (
                <tr key={v.id}>
                  <td className="id">{v.id}</td>
                  <td className="clickable" onClick={() => seleziona(v.schedaId)}><b>{v.schedaId}</b><div className="tiny muted">{s ? descrizioneScheda(s) : ''}</div></td>
                  <td>{labelLista(config.motiviVerifica, v.motivo)}</td>
                  <td>{op ? <span className="row gap-8"><Avatar nome={op.nome} colore={op.colore} size="sm" />{op.nome}</span> : '—'}</td>
                  <td className="nowrap">{data(v.assegnataIl)}</td>
                  <td className="nowrap">
                    {v.stato === 'aperta' ? <span className={`badge badge--sm ${ritardo ? 'badge--rosso' : 'badge--giallo'}`}><CalendarDays size={11} />{data(v.scadenza)}{ritardo ? ' · in ritardo' : ''}</span> : <span className="badge badge--verde badge--sm">{v.esito?.replace('_', ' ')} · {dataBreve(v.completataIl)}</span>}
                  </td>
                  <td>{v.stato === 'aperta' && <button className="btn btn--xs btn--success" onClick={() => setChiudi(v)}>Chiudi</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!lista.length && <div className="empty"><h3>Nessuna verifica {filtro === 'aperta' ? 'aperta' : 'completata'}</h3></div>}
      </div>
      <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
      {chiudi && <ModaleChiudiVerifica v={chiudi} onChiudi={() => setChiudi(null)} />}
    </section>
  );
}

/** Sul telefono: solo le verifiche aperte di chi è entrato (tutte, per l'Amministratore), a card. */
function VerificheTelefono() {
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const utente = useUtente();
  const indice = indiceSchede(db.schede);
  const [chiudi, setChiudi] = useState<Verifica | null>(null);
  const oggi = oggiISO();
  const lista = db.verifiche
    .filter((v) => v.stato === 'aperta' && (utente.amministratore || v.operatoreId === utente.operatoreId))
    .sort((a, b) => a.scadenza.localeCompare(b.scadenza));
  return (
    <div className="col gap-8">
      {lista.map((v) => {
        const s = indice.get(v.schedaId);
        const ritardo = v.scadenza < oggi;
        return (
          <div key={v.id} className="card card--pad col gap-8">
            <button className="ver-card" onClick={() => seleziona(v.schedaId)}>
              <span className="grow">
                <b>{s ? descrizioneScheda(s) : v.schedaId}</b>
                <span className="tiny muted">{v.schedaId}{s ? ` · ${s.viale}` : ''}</span>
              </span>
              <span className={`badge badge--sm ${ritardo ? 'badge--rosso' : 'badge--giallo'}`}>{dataBreve(v.scadenza)}{ritardo ? ' · in ritardo' : ''}</span>
            </button>
            <div className="small">{labelLista(config.motiviVerifica, v.motivo)}{v.note ? <span className="muted"> · {v.note}</span> : null}</div>
            <button className="btn btn--success btn--sm" onClick={() => setChiudi(v)}><CheckCircle2 size={15} />Chiudi</button>
          </div>
        );
      })}
      {!lista.length && <div className="card"><div className="empty"><h3>Nessuna verifica aperta</h3><p>Quando l'ufficio te ne assegna una, compare qui.</p></div></div>}
      {chiudi && <ModaleChiudiVerifica v={chiudi} onChiudi={() => setChiudi(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ModaleStruttura({ onChiudi }: { onChiudi: () => void }) {
  const cim = useCimitero();
  const { viali, quadranti } = useDatiCimitero();
  const [tipo, setTipo] = useState<Struttura['tipo']>('colombaio');
  const [nome, setNome] = useState('Colombario ');
  const [facce, setFacce] = useState<Faccia[]>([{ nome: 'Fronte', righe: 5, colonne: 12 }]);
  const [p, setP] = useState<LatLng>(cim.centro);
  const viale = vialePiuVicino(p, viali);
  const q = quadranteDi(p, quadranti);
  const posti = facce.reduce((t, f) => t + f.righe * f.colonne, 0);
  const setF = (i: number, patch: Partial<Faccia>) => setFacce(facce.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <Modal size="lg" titolo="Nuova struttura" sottotitolo="Le schede dei posti a parete nascono libere, pronte per il censimento." onClose={onChiudi}
      footer={<><span className="small muted grow">{posti} posti · {viale || 'viale da definire'}{q ? ` · ${q.nome}` : ''}</span><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" disabled={!nome.trim() || !posti} onClick={() => { const st = creaStruttura({ cimiteroId: cim.id, tipo, nome: nome.trim(), lat: p[0], lng: p[1], facce, viale, quadranteId: q?.id ?? null }); onChiudi(); apriParete(st.id); }}>Crea struttura</button></>}>
      <div className="col gap-16">
        <div className="grid-form">
          <Field label="Tipo">
            <Seg light value={tipo} onChange={(t) => {
              setTipo(t);
              setNome(t === 'cappella' ? 'Cappella Fam. ' : `${NOMI_STRUTTURA[t] === 'Colombaio' ? 'Colombario' : NOMI_STRUTTURA[t]} `);
              setFacce(t === 'cappella' ? [{ nome: 'Parete sinistra', righe: 3, colonne: 2 }, { nome: 'Parete destra', righe: 3, colonne: 2 }] : [{ nome: 'Fronte', righe: 5, colonne: 12 }]);
            }} options={(Object.keys(NOMI_STRUTTURA) as Struttura['tipo'][]).map((t) => ({ id: t, label: NOMI_STRUTTURA[t] }))} />
          </Field>
          <Field label="Nome"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
        </div>
        <Field label="Pareti con loculi">
          <div className="col gap-8">
            {facce.map((f, i) => (
              <div key={i} className="row gap-8">
                <input className="input input--sm" value={f.nome} onChange={(e) => setF(i, { nome: e.target.value })} style={{ flex: 2 }} />
                <label className="row gap-4 small">File<input className="input input--sm" type="number" min={1} max={12} value={f.righe} onChange={(e) => setF(i, { righe: Math.max(1, Number(e.target.value)) })} style={{ width: 64 }} /></label>
                <label className="row gap-4 small">Colonne<input className="input input--sm" type="number" min={1} max={60} value={f.colonne} onChange={(e) => setF(i, { colonne: Math.max(1, Number(e.target.value)) })} style={{ width: 70 }} /></label>
                <button className="btn btn--xs btn--icon btn--danger" disabled={facce.length === 1} onClick={() => setFacce(facce.filter((_, j) => j !== i))} aria-label="Rimuovi parete"><Trash2 size={13} /></button>
              </div>
            ))}
            {facce.length < (tipo === 'cappella' ? 3 : 2) && <button className="btn btn--sm" onClick={() => setFacce([...facce, { nome: tipo === 'cappella' ? 'Parete di fondo' : 'Retro', righe: facce[0].righe, colonne: facce[0].colonne }])}><Plus size={14} />Aggiungi parete</button>}
          </div>
        </Field>
        <Field label="Posizione"><LocationPicker cimitero={cim} valore={p} onChange={setP} altezza={300} /></Field>
      </div>
    </Modal>
  );
}

function Strutture() {
  const db = useStore((s) => s.db);
  const { strutture } = useDatiCimitero();
  const [tipo, setTipo] = useState<'tutte' | Struttura['tipo']>('tutte');
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(0);
  const [nuova, setNuova] = useState(false);
  const lista = strutture
    .filter((s) => (tipo === 'tutte' || s.tipo === tipo) && s.nome.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.tipo === b.tipo ? a.nome.localeCompare(b.nome) : ORDINE_STRUTTURE.indexOf(a.tipo) - ORDINE_STRUTTURE.indexOf(b.tipo)));
  const indice = indiceSchede(db.schede);
  return (
    <section className="card">
      <div className="card__head" style={{ flexWrap: 'wrap' }}>
        <div className="row gap-8 row--wrap">
          <Seg light small value={tipo} onChange={(t) => { setTipo(t); setPagina(0); }} options={[{ id: 'tutte', label: `Tutte (${strutture.length})` }, { id: 'colombaio', label: 'Colombari' }, { id: 'cappella', label: 'Cappelle' }, { id: 'ossario', label: 'Ossari' }, { id: 'cinerario', label: 'Cinerari' }]} />
          <div className="input-icon" style={{ width: 240 }}><Search size={15} /><input className="input input--sm" placeholder="Cerca struttura" value={q} onChange={(e) => { setQ(e.target.value); setPagina(0); }} /></div>
        </div>
        <button className="btn btn--primary btn--sm" onClick={() => setNuova(true)}><Plus size={14} />Nuova struttura</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Nome</th><th>Tipo</th><th>Viale</th><th className="num">Posti</th><th className="num">Occupati</th><th className="num">Liberi</th><th style={{ width: '16%' }}>Occupazione</th><th /></tr></thead>
          <tbody>
            {paginaDi(lista, pagina).map((st) => {
              const occ = occupazioneStruttura(db.schede, st.id);
              const cont = indice.get(st.schedaId);
              return (
                <tr key={st.id}>
                  <td><b>{st.nome}</b></td>
                  <td><span className={`badge badge--sm ${st.tipo === 'colombaio' ? 'badge--blu' : ''}`} style={st.tipo === 'cappella' ? { background: '#f3edf9', color: '#7B4FA8' } : undefined}>{NOMI_STRUTTURA[st.tipo]}</span></td>
                  <td className="nowrap">{st.viale}</td>
                  <td className="num">{numero(occ.totale)}</td>
                  <td className="num">{numero(occ.occupati)}</td>
                  <td className="num"><b style={{ color: occ.liberi ? '#3F9A3C' : undefined }}>{numero(occ.liberi)}</b></td>
                  <td><div className="row gap-8"><div className="grow"><Progress value={occ.occupati} max={occ.totale} verde small /></div><span className="mono small">{percentuale(occ.occupati, occ.totale)}%</span></div></td>
                  <td>
                    <span className="row gap-4" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn--xs btn--primary" onClick={() => apriParete(st.id)}><Grid3x3 size={12} />Griglia a parete</button>
                      {cont && <button className="btn btn--xs" onClick={() => seleziona(cont.id)}>Scheda</button>}
                      <button className="btn btn--xs" onClick={() => { vai('/mappa'); if (cont) seleziona(cont.id, { vola: true, pannello: false }); }}><MapPinned size={12} />Sulla mappa</button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!lista.length && <div className="empty"><h3>Nessuna struttura</h3></div>}
      </div>
      <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
      {nuova && <ModaleStruttura onChiudi={() => setNuova(false)} />}
    </section>
  );
}

