import { useMemo } from 'react';
import { CalendarClock, Euro, FileSpreadsheet, Lightbulb, Map as MapIcon } from 'lucide-react';
import { Barre, Ciambella, Dot, Progress, Tabs } from '../components/ui';
import { registraEsportazione, resetFiltri, seleziona, useStore } from '../data/store';
import { concessioneScheda, conta, descrizioneScheda, statoConcessione, useSchedeCimitero, valoreLeggibile } from '../data/selectors';
import type { Scheda } from '../data/types';
import { righeLampadeVotive, righeScadenze, scaricaExcel } from '../lib/excel';
import { aggiungiMesi, data, euro, numero, oggiISO, percentuale } from '../lib/format';
import { setQuery, useRotta, vai } from '../router';

type Vista = 'scadenze' | 'lampade' | 'pagamenti';

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
        { id: 'lampade', label: 'Lampade votive', icon: <Lightbulb size={16} /> },
        { id: 'pagamenti', label: 'Pagamenti', icon: <Euro size={16} /> },
      ]} />
      {vista === 'scadenze' && <Scadenze />}
      {vista === 'lampade' && <Lampade />}
      {vista === 'pagamenti' && <Pagamenti />}
    </div>
  );
}

function TabellaSchede({ lista, colonne }: { lista: Scheda[]; colonne: { label: string; v: (s: Scheda) => React.ReactNode; num?: boolean }[] }) {
  return (
    <div className="table-wrap" style={{ maxHeight: 560 }}>
      <table className="table">
        <thead><tr><th>ID</th><th>Defunto / postazione</th>{colonne.map((c) => <th key={c.label} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr></thead>
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
  const concessioni = useStore((st) => st.db.concessioni);
  // una riga per contratto: la prima scheda di ogni concessione in corso
  const con = useMemo(() => {
    const viste = new Set<string>();
    return schede.filter((s) => {
      const c = concessioneScheda(s);
      if (!c || viste.has(c.id)) return false;
      viste.add(c.id);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schede, concessioni]);
  const lista = useMemo(() => {
    if (periodo === 'scadute') return con.filter((s) => statoConcessione(s)?.stato === 'scaduta');
    const fino = aggiungiMesi(oggi, Number(periodo));
    return con.filter((s) => concessioneScheda(s)!.scadenza >= oggi && concessioneScheda(s)!.scadenza <= fino);
  }, [con, periodo, oggi]).sort((a, b) => concessioneScheda(a)!.scadenza.localeCompare(concessioneScheda(b)!.scadenza));
  const mesi = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { label: d.toLocaleDateString('it-IT', { month: 'short' }), valore: con.filter((s) => concessioneScheda(s)!.scadenza.startsWith(k)).length, titolo: d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }) };
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
            <button className="btn btn--sm btn--primary" onClick={() => { scaricaExcel(`CimiTera_scadenze_${oggi}`, [{ nome: 'Scadenze', righe: righeScadenze(lista, { config, db }) }]); registraEsportazione('Excel scadenze', lista.length); }}>
              <FileSpreadsheet size={14} />Excel
            </button>
          </div>
        </div>
        <TabellaSchede lista={lista} colonne={[
          { label: 'N. concessione', v: (s) => concessioneScheda(s)!.numero },
          { label: 'Concessionario', v: (s) => concessioneScheda(s)!.concessionario },
          { label: 'Scadenza', v: (s) => data(concessioneScheda(s)!.scadenza) },
          { label: 'Giorni', num: true, v: (s) => { const g = statoConcessione(s)!.giorni; return <b style={{ color: g < 0 ? '#D9473F' : g < 31 ? '#E07B22' : undefined }}>{g}</b>; } },
          { label: pag?.label ?? 'Pagamenti', v: (s) => (pag ? valoreLeggibile(pag, s.campi.stato_pagamenti) : '') },
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
          { label: 'Intestatario', v: (s) => concessioneScheda(s)?.concessionario ?? String(s.campi.intestatario_utenza ?? '') },
          { label: pag.label, v: (s) => valoreLeggibile(pag, s.campi.stato_pagamenti) },
        ]} />
      </section>
    </div>
  );
}
