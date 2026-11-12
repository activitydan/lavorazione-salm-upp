import { useMemo, useState } from 'react';
import { FileSpreadsheet, Search, UserRound, Users } from 'lucide-react';
import { StatoBadge, Tabs } from '../components/ui';
import { registraEsportazione, resetFiltri, seleziona, useStore } from '../data/store';
import { statoConcessione, useSchedeCimitero } from '../data/selectors';
import type { Defunto, Scheda } from '../data/types';
import { scaricaExcel } from '../lib/excel';
import { data, decedutoDa, eta, normalizza, numero, oggiISO } from '../lib/format';
import { setQuery, useRotta, vai } from '../router';

const LETTERE = 'ABCDEFGHILMNOPQRSTUVZ'.split('');
const PER_PAGINA = 60;

export function AnagrafePage() {
  const rotta = useRotta();
  const tab = (rotta.query.get('tab') as 'defunti' | 'concessionari') ?? 'defunti';
  const schede = useSchedeCimitero();
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Anagrafe</h1>
        </div>
      </div>
      <Tabs
        value={tab}
        onChange={(t) => setQuery('tab', t)}
        tabs={[
          { id: 'defunti', label: 'Defunti', icon: <UserRound size={16} />, count: schede.reduce((t, s) => t + s.defunti.length, 0) },
          { id: 'concessionari', label: 'Concessionari', icon: <Users size={16} /> },
        ]}
      />
      {tab === 'defunti' ? <Defunti schede={schede} /> : <Concessionari schede={schede} />}
    </div>
  );
}

function Defunti({ schede }: { schede: Scheda[] }) {
  const db = useStore((s) => s.db);
  const [q, setQ] = useState('');
  const [lettera, setLettera] = useState('');
  const [pagina, setPagina] = useState(0);
  const oggi = oggiISO();
  const tutti = useMemo(() => schede.flatMap((s) => s.defunti.map((d) => ({ d, s }))).sort((a, b) => `${a.d.cognome} ${a.d.nome}`.localeCompare(`${b.d.cognome} ${b.d.nome}`)), [schede]);
  const lista = useMemo(() => {
    const t = normalizza(q);
    return tutti.filter(({ d, s }) => (!lettera || normalizza(d.cognome).startsWith(lettera.toLowerCase())) && (!t || normalizza(`${d.nome} ${d.cognome} ${d.cognome} ${d.nome} ${s.id}`).includes(t)));
  }, [tutti, q, lettera]);
  const stat = useMemo(() => ({
    uomini: tutti.filter((x) => x.d.sesso === 'M').length,
    donne: tutti.filter((x) => x.d.sesso === 'F').length,
    incompleti: tutti.filter((x) => !x.d.dataMorte || !x.d.nome).length,
  }), [tutti]);
  const pagine = Math.max(1, Math.ceil(lista.length / PER_PAGINA));
  const p = Math.min(pagina, pagine - 1);
  const righe = lista.slice(p * PER_PAGINA, (p + 1) * PER_PAGINA);
  const esporta = () => {
    scaricaExcel(`CimiTera_anagrafe_${oggi}`, [{
      nome: 'Defunti',
      righe: lista.map(({ d, s }) => ({ Cognome: d.cognome, Nome: d.nome, Sesso: d.sesso ?? '', 'Data di nascita': data(d.dataNascita), 'Data di morte': data(d.dataMorte), Età: eta(d), 'ID scheda': s.id, Viale: s.viale })),
    }]);
    registraEsportazione('Excel anagrafe', lista.length);
  };

  return (
    <>
      <div className="anagrafe-stat">
        <div className="card card--pad kpi"><span className="kpi__label">Defunti</span><span className="kpi__value">{numero(tutti.length)}</span><span className="kpi__sub">{numero(stat.uomini)} uomini · {numero(stat.donne)} donne</span></div>
        <div className="card card--pad kpi"><span className="kpi__label">Dati da completare</span><span className="kpi__value" style={{ color: stat.incompleti ? '#B8860B' : undefined }}>{stat.incompleti}</span><span className="kpi__sub">nome o data di morte mancanti</span></div>
      </div>
      <section className="card mt-16">
        <div className="card__head" style={{ flexWrap: 'wrap' }}>
          <div className="input-icon" style={{ flex: '1 1 260px', maxWidth: 380 }}>
            <Search size={16} />
            <input className="input" placeholder="Cerca nominativo o ID" value={q} onChange={(e) => { setQ(e.target.value); setPagina(0); }} />
          </div>
          <div className="lettere">
            <button className={!lettera ? 'is-on' : ''} onClick={() => setLettera('')}>Tutti</button>
            {LETTERE.map((l) => <button key={l} className={lettera === l ? 'is-on' : ''} onClick={() => { setLettera(l); setPagina(0); }}>{l}</button>)}
          </div>
          <button className="btn btn--sm" onClick={esporta}><FileSpreadsheet size={14} />Excel</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Cognome</th><th>Nome</th><th>Nascita</th><th>Morte</th><th className="num">Età</th><th>Deceduto da</th><th>Ubicazione</th><th>Stato</th></tr>
            </thead>
            <tbody>
              {righe.map(({ d, s }, i) => (
                <RigaDefunto key={`${s.id}-${i}`} d={d} s={s} struttura={db.strutture.find((x) => x.id === s.posizione?.strutturaId)?.nome} />
              ))}
            </tbody>
          </table>
          {!righe.length && <div className="empty"><h3>Nessun defunto trovato</h3></div>}
        </div>
        <div className="pager">
          <span className="small muted">{numero(lista.length)} nominativi</span>
          <div className="row gap-4">
            <button className="btn btn--sm" disabled={p === 0} onClick={() => setPagina(p - 1)}>Precedente</button>
            <span className="small strong">{p + 1} / {pagine}</span>
            <button className="btn btn--sm" disabled={p >= pagine - 1} onClick={() => setPagina(p + 1)}>Successiva</button>
          </div>
        </div>
      </section>
    </>
  );
}

function RigaDefunto({ d, s, struttura }: { d: Defunto; s: Scheda; struttura?: string }) {
  const e = eta(d);
  return (
    <tr className="clickable" onClick={() => seleziona(s.id)}>
      <td><b>{d.cognome || '—'}</b></td>
      <td>{d.nome || <span className="badge badge--giallo badge--sm">Da completare</span>}</td>
      <td className="nowrap">{data(d.dataNascita)}</td>
      <td className="nowrap">{d.dataMorte ? data(d.dataMorte) : <span className="badge badge--giallo badge--sm">Da completare</span>}</td>
      <td className="num">{e ?? '—'}</td>
      <td className="nowrap small muted">{decedutoDa(d)?.replace(/^decedut[oa] da /, '') ?? '—'}</td>
      <td>
        <span className="id">{s.id}</span>
        <div className="tiny muted">{s.viale}{struttura ? ` · ${struttura}` : ''}</div>
      </td>
      <td><StatoBadge stato={s.stato} small /></td>
    </tr>
  );
}

function Concessionari({ schede }: { schede: Scheda[] }) {
  const config = useStore((s) => s.config);
  const [q, setQ] = useState('');
  const pag = config.campi.find((c) => c.id === 'stato_pagamenti');
  const gruppi = useMemo(() => {
    const m = new Map<string, Scheda[]>();
    for (const s of schede) {
      const n = s.concessione?.intestatario;
      if (!n) continue;
      const l = m.get(n);
      if (l) l.push(s);
      else m.set(n, [s]);
    }
    return [...m.entries()].map(([nome, lista]) => {
      const prossima = lista.map((s) => s.concessione!.dataScadenza).sort()[0];
      const morosi = lista.filter((s) => s.campi.stato_pagamenti === 'moroso').length;
      return { nome, lista, prossima, morosi, lampade: lista.filter((s) => s.campi.lampada_votiva === true).length, scadute: lista.filter((s) => statoConcessione(s)?.stato === 'scaduta').length };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [schede]);
  const t = normalizza(q);
  const lista = gruppi.filter((g) => !t || normalizza(g.nome).includes(t)).slice(0, 300);
  return (
    <section className="card">
      <div className="card__head">
        <div className="input-icon" style={{ flex: '1 1 260px', maxWidth: 380 }}>
          <Search size={16} />
          <input className="input" placeholder="Cerca intestatario" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="small muted">{numero(gruppi.length)} intestatari · {numero(gruppi.reduce((t2, g) => t2 + g.morosi, 0))} posizioni morose</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Intestatario</th><th className="num">Concessioni</th><th>Prossima scadenza</th><th className="num">Lampade votive</th><th>{pag?.label ?? 'Pagamenti'}</th><th /></tr></thead>
          <tbody>
            {lista.map((g) => (
              <tr key={g.nome}>
                <td><b>{g.nome}</b><div className="tiny muted">{g.lista.slice(0, 3).map((s) => s.id).join(', ')}{g.lista.length > 3 ? '…' : ''}</div></td>
                <td className="num">{g.lista.length}</td>
                <td className="nowrap">{data(g.prossima)} {g.scadute > 0 && <span className="badge badge--rosso badge--sm">{g.scadute} scadute</span>}</td>
                <td className="num">{g.lampade}</td>
                <td>{g.morosi ? <span className="badge badge--rosso badge--sm">Moroso ({g.morosi})</span> : <span className="badge badge--verde badge--sm">Regolare</span>}</td>
                <td><button className="btn btn--xs" onClick={() => { resetFiltri({ nominativo: g.nome }); vai('/ricerca'); }}>Schede</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
