import { useMemo } from 'react';
import { BellPlus, CalendarClock, Euro, FileSpreadsheet, Lightbulb, Map as MapIcon, PieChart, SquareDashed } from 'lucide-react';
import { Barre, Ciambella, Dot, Progress, StatoBadge, Tabs } from '../components/ui';
import { apriParete, creaAlert, registraEsportazione, resetFiltri, seleziona, useStore } from '../data/store';
import { conta, descrizioneScheda, statoConcessione, tipologiaDef, useCimitero, useDatiCimitero, useSchedeCimitero, valoreLeggibile } from '../data/selectors';
import type { Scheda } from '../data/types';
import { righeLampadeVotive, righeScadenze, scaricaExcel } from '../lib/excel';
import { aggiungiMesi, data, euro, numero, oggiISO, percentuale } from '../lib/format';
import { setQuery, useRotta, vai } from '../router';

type Vista = 'scadenze' | 'libere' | 'lampade' | 'pagamenti' | 'statistiche';

export function ReportPage() {
  const rotta = useRotta();
  const vista = (rotta.query.get('vista') as Vista) ?? 'scadenze';
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Report</h1>
        </div>
      </div>
      <Tabs value={vista} onChange={(v) => setQuery('vista', v)} tabs={[
        { id: 'scadenze', label: 'Scadenze concessioni', icon: <CalendarClock size={16} /> },
        { id: 'libere', label: 'Postazioni libere', icon: <SquareDashed size={16} /> },
        { id: 'lampade', label: 'Lampade votive', icon: <Lightbulb size={16} /> },
        { id: 'pagamenti', label: 'Pagamenti', icon: <Euro size={16} /> },
        { id: 'statistiche', label: 'Statistiche', icon: <PieChart size={16} /> },
      ]} />
      {vista === 'scadenze' && <Scadenze />}
      {vista === 'libere' && <Libere />}
      {vista === 'lampade' && <Lampade />}
      {vista === 'pagamenti' && <Pagamenti />}
      {vista === 'statistiche' && <Statistiche />}
    </div>
  );
}

function TabellaSchede({ lista, colonne }: { lista: Scheda[]; colonne: { label: string; v: (s: Scheda) => React.ReactNode; num?: boolean }[] }) {
  return (
    <div className="table-wrap" style={{ maxHeight: 560 }}>
      <table className="table">
        <thead><tr><th>ID</th><th>Defunto / manufatto</th>{colonne.map((c) => <th key={c.label} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr></thead>
        <tbody>
          {lista.map((s) => (
            <tr key={s.id} className="clickable" onClick={() => seleziona(s.id)}>
              <td className="id">{s.id}</td>
              <td><b>{descrizioneScheda(s)}</b><div className="tiny muted">{s.viale}</div></td>
              {colonne.map((c) => <td key={c.label} className={c.num ? 'num' : 'nowrap'}>{c.v(s)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!lista.length && <div className="empty"><h3>Nessuna scheda</h3></div>}
    </div>
  );
}

function Scadenze() {
  const schede = useSchedeCimitero();
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const rotta = useRotta();
  const periodo = rotta.query.get('periodo') ?? '6';
  const oggi = oggiISO();
  const con = useMemo(() => schede.filter((s) => s.concessione), [schede]);
  const lista = useMemo(() => {
    if (periodo === 'scadute') return con.filter((s) => statoConcessione(s)?.stato === 'scaduta');
    const fino = aggiungiMesi(oggi, Number(periodo));
    return con.filter((s) => s.concessione!.dataScadenza >= oggi && s.concessione!.dataScadenza <= fino);
  }, [con, periodo, oggi]).sort((a, b) => a.concessione!.dataScadenza.localeCompare(b.concessione!.dataScadenza));
  const mesi = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { label: d.toLocaleDateString('it-IT', { month: 'short' }), valore: con.filter((s) => s.concessione!.dataScadenza.startsWith(k)).length, titolo: d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }) };
  }), [con]);
  const scadute = con.filter((s) => statoConcessione(s)?.stato === 'scaduta').length;
  const pag = config.campi.find((c) => c.id === 'stato_pagamenti');

  return (
    <div className="report-grid">
      <section className="card card--pad">
        <div className="row row--between row--wrap">
          <div>
            <h3>Concessioni in scadenza nei prossimi 12 mesi</h3>
            <p className="small muted">{scadute} concessioni risultano già scadute.</p>
          </div>
          <div className="seg seg--sm seg--light">
            {[['1', '1 mese'], ['3', '3 mesi'], ['6', '6 mesi'], ['12', '12 mesi'], ['scadute', 'Scadute']].map(([k, l]) => (
              <button key={k} className={periodo === k ? 'is-on' : ''} onClick={() => setQuery('periodo', k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="mt-16"><Barre dati={mesi} altezza={130} colore="#8E5BB5" /></div>
      </section>
      <section className="card">
        <div className="card__head">
          <h3>{lista.length} concessioni {periodo === 'scadute' ? 'scadute' : `in scadenza entro ${periodo} ${periodo === '1' ? 'mese' : 'mesi'}`}</h3>
          <div className="row gap-4">
            <button className="btn btn--sm" disabled={!lista.length} onClick={() => creaAlert({ tipo: 'scadenze', priorita: 'media', titolo: `${lista.length} concessioni ${periodo === 'scadute' ? 'scadute' : 'in scadenza'}`, messaggio: 'Preparare le comunicazioni agli intestatari per il rinnovo.', data: oggi })}>
              <BellPlus size={14} />Crea alert
            </button>
            <button className="btn btn--sm btn--primary" onClick={() => { scaricaExcel(`CimiTera_scadenze_${oggi}`, [{ nome: 'Scadenze', righe: righeScadenze(lista, { config, db }) }]); registraEsportazione('Excel scadenze', lista.length); }}>
              <FileSpreadsheet size={14} />Excel
            </button>
          </div>
        </div>
        <TabellaSchede lista={lista} colonne={[
          { label: 'N. concessione', v: (s) => s.concessione!.numero },
          { label: 'Intestatario', v: (s) => s.concessione!.intestatario },
          { label: 'Scadenza', v: (s) => data(s.concessione!.dataScadenza) },
          { label: 'Giorni', num: true, v: (s) => { const g = statoConcessione(s)!.giorni; return <b style={{ color: g < 0 ? '#D9473F' : g < 31 ? '#E07B22' : undefined }}>{g}</b>; } },
          { label: pag?.label ?? 'Pagamenti', v: (s) => (pag ? valoreLeggibile(pag, s.campi.stato_pagamenti) : '') },
        ]} />
      </section>
    </div>
  );
}

function Libere() {
  const schede = useSchedeCimitero();
  const config = useStore((s) => s.config);
  const { quadranti, strutture } = useDatiCimitero();
  const libere = useMemo(() => schede.filter((s) => s.stato === 'libero' && !s.strutturaId), [schede]);
  const perTip = conta(libere, (s) => s.tipologia);
  const perStr = useMemo(() => strutture.map((st) => ({ st, n: libere.filter((s) => s.posizione?.strutturaId === st.id).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n), [libere, strutture]);
  return (
    <div className="report-grid">
      <div className="kpi-grid">
        <div className="card kpi-card"><span className="kpi-card__icon" style={{ background: '#eef6e7', color: '#3F9A3C' }}><SquareDashed size={20} /></span><span className="kpi"><span className="kpi__label">Postazioni libere</span><span className="kpi__value">{libere.length}</span></span></div>
        {config.tipologie.filter((t) => perTip[t.id]).map((t) => (
          <div key={t.id} className="card kpi-card"><span className="kpi-card__icon" style={{ background: `${t.colore}18`, color: t.colore }}><Dot colore={t.colore} size="lg" /></span><span className="kpi"><span className="kpi__label">{t.label}</span><span className="kpi__value">{perTip[t.id]}</span></span></div>
        ))}
      </div>
      <div className="report-2col">
        <section className="card">
          <div className="card__head">
            <h3>Dove sono i posti liberi</h3>
            <button className="btn btn--sm btn--primary" onClick={() => { resetFiltri({ stati: ['libero'] }); vai('/mappa'); }}><MapIcon size={14} />Vedi sulla mappa</button>
          </div>
          <div className="card__body bar-list">
            {quadranti.map((q) => {
              const n = libere.filter((s) => s.quadranteId === q.id).length;
              return (
                <div key={q.id} className="bar-list__row">
                  <span className="row gap-4"><Dot colore={q.colore} />{q.nome}</span>
                  <Progress value={n} max={Math.max(1, ...quadranti.map((x) => libere.filter((s) => s.quadranteId === x.id).length))} colore={q.colore} small />
                  <span className="num">{n}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="card">
          <div className="card__head"><h3>Loculi liberi per struttura</h3></div>
          <div className="list" style={{ maxHeight: 360, overflow: 'auto' }}>
            {perStr.slice(0, 30).map(({ st, n }) => (
              <button key={st.id} className="list-item" onClick={() => { resetFiltri({ stati: ['libero'] }); apriParete(st.id); }} title="Apri la griglia a parete con i posti liberi evidenziati">
                <span className="grow"><b>{st.nome}</b><div className="tiny muted">{st.viale}</div></span>
                <span className="badge badge--verde">{n} liberi</span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="card">
        <div className="card__head"><h3>Elenco postazioni libere</h3></div>
        <TabellaSchede lista={libere} colonne={[
          { label: 'Tipologia', v: (s) => tipologiaDef(config, s.tipologia).label },
          { label: 'Posizione', v: (s) => (s.posizione ? `${strutture.find((x) => x.id === s.posizione!.strutturaId)?.nome ?? ''} · fila ${s.posizione.fila} col. ${s.posizione.colonna}` : `${s.area ?? ''} ${s.numeroPosto ?? ''}`) },
          { label: 'Quadrante', v: (s) => quadranti.find((q) => q.id === s.quadranteId)?.codice ?? '—' },
        ]} />
      </section>
    </div>
  );
}

function Lampade() {
  const schede = useSchedeCimitero();
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const lampade = useMemo(() => schede.filter((s) => s.campi.lampada_votiva === true), [schede]);
  const canone = lampade.reduce((t, s) => t + (typeof s.campi.canone_lampada === 'number' ? s.campi.canone_lampada : 24), 0);
  const morosi = lampade.filter((s) => s.campi.stato_pagamenti === 'moroso');
  const perViale = Object.entries(conta(lampade, (s) => s.viale)).sort((a, b) => b[1] - a[1]);
  const oggi = oggiISO();
  return (
    <div className="report-grid">
      <div className="kpi-grid">
        <div className="card kpi-card"><span className="kpi-card__icon" style={{ background: '#fff7e0', color: '#B8860B' }}><Lightbulb size={20} /></span><span className="kpi"><span className="kpi__label">Lampade attive</span><span className="kpi__value">{numero(lampade.length)}</span><span className="kpi__sub">{percentuale(lampade.length, schede.filter((s) => s.defunti.length).length)}% dei posti occupati</span></span></div>
        <div className="card kpi-card"><span className="kpi-card__icon" style={{ background: '#eef6e7', color: '#3F9A3C' }}><Euro size={20} /></span><span className="kpi"><span className="kpi__label">Canone annuo</span><span className="kpi__value">{euro(canone)}</span></span></div>
        <div className="card kpi-card"><span className="kpi-card__icon" style={{ background: '#fdeeed', color: '#D9473F' }}><Euro size={20} /></span><span className="kpi"><span className="kpi__label">Utenze morose</span><span className="kpi__value" style={{ color: '#D9473F' }}>{morosi.length}</span><span className="kpi__sub">{euro(morosi.reduce((t, s) => t + (typeof s.campi.canone_lampada === 'number' ? s.campi.canone_lampada : 24), 0))} da incassare</span></span></div>
      </div>
      <div className="callout callout--ok">
        <FileSpreadsheet size={18} />
        <div className="grow">
          <b>Excel pronto per fatturare.</b> Codice utenza, intestatario, ubicazione, canone e stato pagamenti, con il totale in fondo.
        </div>
        <button className="btn btn--success btn--sm" onClick={() => { scaricaExcel(`CimiTera_lampade_votive_${oggi}`, [{ nome: 'Lampade votive', righe: righeLampadeVotive(lampade, { config, db }) }, { nome: 'Morosi', righe: righeLampadeVotive(morosi, { config, db }) }]); registraEsportazione('Excel lampade votive', lampade.length); }}>
          Scarica Excel
        </button>
      </div>
      <div className="report-2col">
        <section className="card">
          <div className="card__head"><h3>Lampade per viale</h3></div>
          <div className="card__body bar-list">
            {perViale.map(([v, n]) => (
              <div key={v} className="bar-list__row"><span className="ellipsis">{v}</span><Progress value={n} max={perViale[0][1]} colore="#E9BE1F" small /><span className="num">{n}</span></div>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="card__head">
            <h3>Utenze morose</h3>
            <button className="btn btn--sm" onClick={() => { resetFiltri({ campi: { lampada_votiva: 'si', stato_pagamenti: ['moroso'] } }); vai('/mappa'); }}><MapIcon size={14} />Sulla mappa</button>
          </div>
          <TabellaSchede lista={morosi} colonne={[
            { label: 'Codice', v: (s) => String(s.campi.codice_utenza ?? '') },
            { label: 'Intestatario', v: (s) => String(s.campi.intestatario_utenza ?? '') },
            { label: 'Canone', num: true, v: (s) => euro(typeof s.campi.canone_lampada === 'number' ? s.campi.canone_lampada : 24) },
          ]} />
        </section>
      </div>
    </div>
  );
}

function Pagamenti() {
  const schede = useSchedeCimitero();
  const config = useStore((s) => s.config);
  const pag = config.campi.find((c) => c.id === 'stato_pagamenti');
  const con = schede.filter((s) => s.campi.stato_pagamenti);
  const per = conta(con, (s) => String(s.campi.stato_pagamenti));
  if (!pag) return <div className="callout callout--warn">Il campo “Stato pagamenti” è stato rimosso dalla configurazione.</div>;
  const opz = (pag.opzioni ?? []).filter((o) => !o.archiviata);
  const problemi = con.filter((s) => s.campi.stato_pagamenti !== opz[0]?.id);
  return (
    <div className="report-2col">
      <section className="card card--pad">
        <h3>{pag.label}</h3>
        <p className="small muted">Concessioni e utenze con stato pagamenti registrato.</p>
        <div className="row gap-16 mt-16 row--wrap">
          <Ciambella size={170} spessore={22} dati={opz.map((o) => ({ id: o.id, label: o.label, valore: per[o.id] ?? 0, colore: o.colore ?? '#9AA6B2' }))}
            centro={<div className="display" style={{ fontSize: 24, fontWeight: 800 }}>{percentuale(per[opz[0]?.id] ?? 0, con.length)}%</div>} sotto={<div className="tiny muted">{opz[0]?.label.toLowerCase()}</div>} />
          <div className="col gap-8">
            {opz.map((o) => (
              <button key={o.id} className="legend__item" style={{ border: 'none', background: 'none', padding: 0 }} onClick={() => { resetFiltri({ campi: { stato_pagamenti: [o.id] } }); vai('/ricerca'); }}>
                <Dot colore={o.colore ?? '#9AA6B2'} size="lg" /><b>{o.label}</b><span className="muted">{numero(per[o.id] ?? 0)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="card">
        <div className="card__head"><h3>Posizioni da sollecitare o verificare</h3><span className="badge">{problemi.length}</span></div>
        <TabellaSchede lista={problemi} colonne={[
          { label: 'Intestatario', v: (s) => s.concessione?.intestatario ?? String(s.campi.intestatario_utenza ?? '') },
          { label: pag.label, v: (s) => valoreLeggibile(pag, s.campi.stato_pagamenti) },
        ]} />
      </section>
    </div>
  );
}

function Statistiche() {
  const schede = useSchedeCimitero();
  const config = useStore((s) => s.config);
  const { quadranti } = useDatiCimitero();
  const perStato = conta(schede, (s) => s.stato);
  const perTip = conta(schede, (s) => s.tipologia);
  const cim = useCimitero();
  return (
    <div className="report-grid">
      <div className="report-2col">
        <section className="card card--pad">
          <h3>Stato dei manufatti</h3>
          <div className="row gap-16 mt-16 row--wrap">
            <Ciambella size={170} spessore={22} dati={config.stati.map((s) => ({ id: s.id, label: s.label, valore: perStato[s.id] ?? 0, colore: s.colore }))}
              centro={<div className="display" style={{ fontSize: 24, fontWeight: 800 }}>{numero(schede.length)}</div>} sotto={<div className="tiny muted">schede</div>} />
            <div className="col gap-8">{config.stati.map((s) => <StatoRiga key={s.id} id={s.id} n={perStato[s.id] ?? 0} tot={schede.length} />)}</div>
          </div>
        </section>
        <section className="card card--pad">
          <h3>Tipologie</h3>
          <div className="mt-16">
            <Barre dati={config.tipologie.map((t) => ({ label: t.label, valore: perTip[t.id] ?? 0 }))} altezza={150} />
          </div>
        </section>
      </div>
      <section className="card">
        <div className="card__head"><h3>Riepilogo per quadrante · {cim.breve}</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Quadrante</th><th className="num">Censite</th><th className="num">Stimate</th><th>Avanzamento</th>{config.stati.map((s) => <th key={s.id} className="num">{s.label}</th>)}</tr></thead>
            <tbody>
              {quadranti.map((q) => {
                const qs = schede.filter((s) => s.quadranteId === q.id);
                return (
                  <tr key={q.id}>
                    <td><span className="row gap-4"><Dot colore={q.colore} /><b>{q.nome}</b></span></td>
                    <td className="num">{qs.length}</td>
                    <td className="num">{q.stimaManufatti}</td>
                    <td style={{ minWidth: 140 }}><Progress value={qs.length} max={q.stimaManufatti} small colore={q.colore} /></td>
                    {config.stati.map((s) => <td key={s.id} className="num">{qs.filter((x) => x.stato === s.id).length}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatoRiga({ id, n, tot }: { id: string; n: number; tot: number }) {
  return (
    <div className="row row--between gap-16 small">
      <StatoBadge stato={id} small />
      <span className="mono"><b>{numero(n)}</b> <span className="muted">· {percentuale(n, tot)}%</span></span>
    </div>
  );
}
