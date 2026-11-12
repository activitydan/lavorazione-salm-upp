import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Download, ExternalLink, History, Lightbulb, LightbulbOff, Plus, Search, UserRoundPen, Wrench, X } from 'lucide-react';
import { BarraPagine, paginaDi } from '../components/Esporta';
import { SOGGETTO_VUOTO, SoggettoForm, soggettoIncompleto } from '../components/Soggetti';
import { Field, Modal, Seg, StatoBadge, Tabs } from '../components/ui';
import { concessioneDi, nomeSoggetto, rappresentanteDi } from '../data/concessioni';
import { aggiornaScheda, apriModale, indiceSchede, seleziona, toast, useStore } from '../data/store';
import { descrizioneScheda, useCimitero } from '../data/selectors';
import type { Abbonato, Scheda, StatoUtenza, UtenzaVotiva } from '../data/types';
import {
  CLASSE_STATO_UTENZA, NOMI_MOTIVO_CESSAZIONE, NOMI_STATO_UTENZA, allaccioEseguito, canoneAnnuo, cessaUtenza, disdettaUtenza, indiceUtenze,
  nomeDefuntoUtenza, nuovoAllaccio, primoImporto, riallacciaUtenza, sospendiUtenza, statoUtenza, volturaUtenza,
} from '../data/utenze';
import { scaricaExcel } from '../lib/excel';
import { data, euro, nomeCompleto, normalizza, numero, oggiISO } from '../lib/format';
import { setQuery, useRotta } from '../router';

type Tab = 'utenze' | 'lampade';
const STATI: StatoUtenza[] = ['da_allacciare', 'attiva', 'sospesa', 'cessata'];
const ETICHETTE: Record<StatoUtenza, string> = { da_allacciare: 'Da allacciare', attiva: 'Attive', sospesa: 'Sospese', cessata: 'Cessate' };

function BadgeUtenza({ u }: { u: UtenzaVotiva }) {
  const st = statoUtenza(u);
  return (
    <span className={`badge badge--sm ${CLASSE_STATO_UTENZA[st]}`}>
      {st === 'cessata' && u.motivoCessazione ? `Cessata: ${NOMI_MOTIVO_CESSAZIONE[u.motivoCessazione]}` : NOMI_STATO_UTENZA[st]}
    </span>
  );
}

export function IlluminazionePage() {
  const rotta = useRotta();
  const tab: Tab = rotta.query.get('tab') === 'lampade' ? 'lampade' : 'utenze';
  const selId = rotta.query.get('id');
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const schede = indiceSchede(db.schede);
  const utenze = useMemo(() => db.utenze.filter((u) => u.cimiteroId === cim.id), [db.utenze, cim.id]);
  const [q, setQ] = useState('');
  const [stati, setStati] = useState<StatoUtenza[]>(['da_allacciare', 'attiva', 'sospesa']);
  const [pagina, setPagina] = useState(0);
  const [nuova, setNuova] = useState<{ scheda?: Scheda } | null>(null);

  const lista = useMemo(() => {
    const t = normalizza(q);
    return utenze
      .filter((u) => stati.includes(statoUtenza(u)))
      .filter((u) => !t || normalizza(`${u.numero} ${nomeSoggetto(u.abbonato)} ${u.abbonato.codiceFiscale} ${u.schedaId} ${nomeDefuntoUtenza(u)}`).includes(t))
      .sort((a, b) => b.dataContratto.localeCompare(a.dataContratto));
  }, [utenze, stati, q]);
  useEffect(() => setPagina(0), [q, stati]);
  const conta = (st: StatoUtenza) => utenze.filter((u) => statoUtenza(u) === st).length;
  const attive = utenze.filter((u) => statoUtenza(u) === 'attiva');
  const conUtenza = indiceUtenze(db.utenze);
  // lampade viste accese sul campo su postazioni senza un'utenza attiva
  const daControllare = useMemo(
    () => db.schede.filter((s) => s.cimiteroId === cim.id && s.lampadaAccesa === true && !(conUtenza.get(s.id) ?? []).some((u) => u.stato === 'attiva')),
    [db.schede, cim.id, conUtenza],
  );
  const sel = selId ? db.utenze.find((u) => u.id === selId) : undefined;

  const ubicazione = (s?: Scheda) => (s ? `${s.viale}${s.posizione ? ` · fila ${s.posizione.fila} col. ${s.posizione.colonna}` : ''}` : '');
  const esporta = () => {
    const righe = lista.map((u) => ({
      Numero: u.numero, Abbonato: nomeSoggetto(u.abbonato), 'Codice fiscale': u.abbonato.codiceFiscale,
      'Indirizzo per la bolletta': u.abbonato.indirizzoBolletta || u.abbonato.indirizzo, 'ID scheda': u.schedaId, Defunto: nomeDefuntoUtenza(u),
      Ubicazione: ubicazione(schede.get(u.schedaId)), 'Punti luce': u.puntiLuce, 'Canone annuo €': canoneAnnuo(u, db.regole), Stato: NOMI_STATO_UTENZA[statoUtenza(u)],
    }));
    const totale = righe.reduce((t, r) => t + Number(r['Canone annuo €']), 0);
    scaricaExcel(`CimiTera_${cim.codice}_illuminazione_votiva_${oggiISO()}`, [{
      nome: 'Utenze votive',
      righe: [...righe, { Numero: 'TOTALE', Abbonato: `${righe.length} utenze`, 'Codice fiscale': '', 'Indirizzo per la bolletta': '', 'ID scheda': '', Defunto: '', Ubicazione: '', 'Punti luce': righe.reduce((t, r) => t + Number(r['Punti luce']), 0), 'Canone annuo €': totale, Stato: '' }],
    }]);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Illuminazione votiva</h1>
        </div>
        <div className="page-head__actions">
          {tab === 'utenze' && <button className="btn" disabled={!lista.length} onClick={esporta}><Download size={16} />Esporta {numero(lista.length)}</button>}
          <button className="btn btn--primary" onClick={() => setNuova({})}><Plus size={16} />Nuovo allaccio</button>
        </div>
      </div>
      <Tabs value={tab} onChange={(t) => setQuery('tab', t === 'utenze' ? null : t)} tabs={[
        { id: 'utenze', label: 'Utenze', icon: <Lightbulb size={16} />, count: utenze.filter((u) => statoUtenza(u) !== 'cessata').length },
        { id: 'lampade', label: 'Lampade da controllare', icon: <LightbulbOff size={16} />, count: daControllare.length },
      ]} />

      {tab === 'utenze' && (
        <div className="col gap-16">
          <div className="kpi-grid">
            <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Utenze attive</span><span className="kpi__value">{numero(attive.length)}</span></span></div>
            <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Punti luce accesi</span><span className="kpi__value">{numero(attive.reduce((t, u) => t + u.puntiLuce, 0))}</span></span></div>
            <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Canoni di un anno</span><span className="kpi__value">{euro(attive.reduce((t, u) => t + canoneAnnuo(u, db.regole), 0))}</span></span></div>
            <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Da allacciare</span><span className="kpi__value" style={{ color: conta('da_allacciare') ? '#2F6FB3' : undefined }}>{conta('da_allacciare')}</span></span></div>
          </div>
          <section className="card">
            <div className="card__head" style={{ flexWrap: 'wrap' }}>
              <div className="row gap-8 row--wrap">
                <div className="input-icon" style={{ width: 280 }}>
                  <Search size={16} />
                  <input className="input input--sm" placeholder="Cerca numero, abbonato, defunto o scheda" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                {STATI.map((st) => (
                  <button key={st} className={`chip chip--sm ${stati.includes(st) ? 'is-on' : ''}`} onClick={() => setStati(stati.includes(st) ? stati.filter((x) => x !== st) : [...stati, st])}>
                    {ETICHETTE[st]}<span className="chip__n">{conta(st)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Numero</th><th>Abbonato</th><th>Postazione e defunto</th><th className="num">Punti luce</th><th className="num">Canone annuo</th><th>Allacciata il</th><th>Stato</th></tr></thead>
                <tbody>
                  {paginaDi(lista, pagina).map((u) => {
                    const s = schede.get(u.schedaId);
                    return (
                      <tr key={u.id} className={`clickable ${selId === u.id ? 'is-sel' : ''}`} onClick={() => setQuery('id', u.id)}>
                        <td className="id">{u.numero}</td>
                        <td><b>{nomeSoggetto(u.abbonato)}</b></td>
                        <td>
                          <span className="id">{u.schedaId}</span> · {nomeDefuntoUtenza(u)}
                          <div className="tiny muted">{ubicazione(s)}</div>
                        </td>
                        <td className="num">{u.puntiLuce}</td>
                        <td className="num">{euro(canoneAnnuo(u, db.regole))}</td>
                        <td className="nowrap">{data(u.allacciataIl)}</td>
                        <td><BadgeUtenza u={u} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!lista.length && <div className="empty"><h3>Nessuna utenza con questi filtri</h3></div>}
            </div>
            <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
          </section>
        </div>
      )}

      {tab === 'lampade' && (
        <section className="card">
          <div className="card__head"><h3>Lampade viste accese senza un'utenza</h3></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Scheda</th><th>Defunto / postazione</th><th>Viale</th><th>Vista il</th><th /></tr></thead>
              <tbody>
                {daControllare.map((s) => (
                  <tr key={s.id}>
                    <td className="id clickable" onClick={() => seleziona(s.id)}>{s.id}</td>
                    <td><b>{descrizioneScheda(s)}</b></td>
                    <td className="nowrap">{s.viale}</td>
                    <td className="nowrap">{data(s.lampadaVistaIl)}</td>
                    <td>
                      <span className="row gap-4" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn--xs btn--primary" onClick={() => setNuova({ scheda: s })}><Plus size={12} />Nuovo allaccio</button>
                        <button className="btn btn--xs" onClick={() => { aggiornaScheda(s.id, { lampadaAccesa: undefined, lampadaVistaIl: undefined }, 'Lampada controllata dall\'ufficio'); toast('Segnata come controllata'); }}>Controllata</button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!daControllare.length && <div className="empty"><h3>Nessuna lampada da controllare</h3><p>Compaiono qui le lampade che un operatore vede accese su una postazione senza utenza.</p></div>}
          </div>
        </section>
      )}

      {sel && <Dettaglio u={sel} onChiudi={() => setQuery('id', null)} />}
      {nuova && <ModaleAllaccio schedaIniziale={nuova.scheda} onChiudi={() => setNuova(null)} onCreata={(id) => { setNuova(null); setQuery('tab', null); setQuery('id', id); }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dettaglio dell'utenza e azioni
// ---------------------------------------------------------------------------

function Dettaglio({ u, onChiudi }: { u: UtenzaVotiva; onChiudi: () => void }) {
  const db = useStore((s) => s.db);
  const s = indiceSchede(db.schede).get(u.schedaId);
  const st = statoUtenza(u);
  const [voltura, setVoltura] = useState(false);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onChiudi()}>
      <div className="modal modal--lg" role="dialog" aria-modal="true">
        <div className="modal__head">
          <div>
            <BadgeUtenza u={u} />
            <h2 className="mt-8">Utenza {u.numero}</h2>
            <p>{s ? `${s.id} · ${descrizioneScheda(s)} · ${s.viale}` : u.schedaId}</p>
          </div>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={onChiudi} aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="modal__body col gap-16">
          <section className="sez">
            <h4 className="sez__t">Utenza</h4>
            <dl className="kv">
              <dt>Contratto</dt><dd>{data(u.dataContratto)}</dd>
              <dt>Per</dt><dd>{nomeDefuntoUtenza(u)}</dd>
              <dt>Punti luce</dt><dd>{u.puntiLuce} · canone annuo {euro(canoneAnnuo(u, db.regole))}</dd>
              <dt>Allacciata il</dt><dd>{data(u.allacciataIl)}</dd>
              {u.disdettaDal && st !== 'cessata' && (<><dt>Disdetta</dt><dd>vale dal {data(u.disdettaDal)}</dd></>)}
              {st === 'cessata' && (<><dt>Cessata il</dt><dd>{data(u.cessataIl ?? u.disdettaDal)}{u.motivoCessazione ? ` · ${NOMI_MOTIVO_CESSAZIONE[u.motivoCessazione]}` : ' · disdetta'}</dd></>)}
            </dl>
          </section>
          <section className="sez">
            <h4 className="sez__t">Abbonato</h4>
            <div className="soggetto">
              <div className="row gap-8"><b>{nomeSoggetto(u.abbonato)}</b>{u.abbonato.tipo === 'ente' && <span className="badge badge--sm">Ente</span>}{u.abbonato.legameDefunto && <span className="badge badge--sm">{u.abbonato.legameDefunto}</span>}</div>
              <div className="small muted">{u.abbonato.codiceFiscale} · {u.abbonato.indirizzo}</div>
              {u.abbonato.indirizzoBolletta && <div className="small muted">Bolletta a: {u.abbonato.indirizzoBolletta}</div>}
              <div className="small muted">{[u.abbonato.telefono, u.abbonato.email].filter(Boolean).join(' · ')}</div>
            </div>
          </section>
          <section className="sez">
            <h4 className="sez__t"><History size={14} /> Storico</h4>
            <ol className="timeline">
              {[...u.storico].reverse().map((ev, i) => (
                <li key={i}><b>{ev.azione}</b><span className="tiny muted">{data(ev.data)} · {ev.operatore}</span></li>
              ))}
            </ol>
          </section>
        </div>
        <div className="modal__foot">
          {s && <button className="btn" onClick={() => { onChiudi(); seleziona(s.id); }}><ExternalLink size={15} />Apri scheda</button>}
          {st !== 'cessata' && <button className="btn" onClick={() => apriModale({ tipo: 'manutenzione', schedaId: u.schedaId, categoria: 'lampada_guasta' })}><Wrench size={15} />Segnala guasto</button>}
          {st !== 'cessata' && <button className="btn" onClick={() => setVoltura(true)}><UserRoundPen size={15} />Voltura</button>}
          {st === 'attiva' && !u.disdettaDal && <button className="btn" onClick={() => disdettaUtenza(u.id)}><Ban size={15} />Disdetta</button>}
          {st === 'attiva' && <button className="btn" onClick={() => sospendiUtenza(u.id)}><LightbulbOff size={15} />Sospendi</button>}
          {st === 'sospesa' && <button className="btn btn--success" onClick={() => riallacciaUtenza(u.id)}><Lightbulb size={15} />Riaccendi</button>}
          {st === 'sospesa' && <button className="btn btn--danger" onClick={() => { cessaUtenza(u.id, 'morosita'); toast('Utenza cessata per morosità'); }}><Ban size={15} />Cessa per morosità</button>}
          {st === 'da_allacciare' && <button className="btn btn--success" onClick={() => allaccioEseguito(u.id)}><CheckCircle2 size={15} />Allaccio eseguito</button>}
        </div>
      </div>
      {voltura && <ModaleVoltura u={u} onChiudi={() => setVoltura(false)} />}
    </div>
  );
}

function ModaleVoltura({ u, onChiudi }: { u: UtenzaVotiva; onChiudi: () => void }) {
  const [nuovo, setNuovo] = useState<Abbonato>({ ...SOGGETTO_VUOTO });
  const [motivo, setMotivo] = useState<'consenso' | 'decesso'>('consenso');
  const salva = () => {
    const err = soggettoIncompleto(nuovo);
    if (err) return toast(err, 'errore');
    volturaUtenza(u.id, nuovo, motivo);
    onChiudi();
  };
  return (
    <Modal titolo={`Voltura · ${u.numero}`} sottotitolo={`Oggi l'abbonato è ${nomeSoggetto(u.abbonato)}. Lo storico dell'utenza resta.`} size="lg" onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={salva}>Registra la voltura</button></>}>
      <div className="col gap-16">
        <Field label="Motivo">
          <Seg light value={motivo} onChange={setMotivo} options={[{ id: 'consenso', label: 'Consenso del precedente abbonato' }, { id: 'decesso', label: 'Decesso del precedente abbonato' }]} />
        </Field>
        <div>
          <h3 className="section-title">Nuovo abbonato</h3>
          <AbbonatoForm valore={nuovo} onChange={setNuovo} />
        </div>
      </div>
    </Modal>
  );
}

function AbbonatoForm({ valore, onChange }: { valore: Abbonato; onChange: (a: Abbonato) => void }) {
  return (
    <div className="col gap-12">
      <SoggettoForm valore={valore} onChange={onChange} />
      <div className="grid-form">
        <Field label="Indirizzo per la bolletta" hint="Solo se è diverso dall'indirizzo qui sopra">
          <input className="input" value={valore.indirizzoBolletta ?? ''} onChange={(e) => onChange({ ...valore, indirizzoBolletta: e.target.value || undefined })} />
        </Field>
        <Field label="Legame con il defunto">
          <input className="input" value={valore.legameDefunto ?? ''} onChange={(e) => onChange({ ...valore, legameDefunto: e.target.value || undefined })} placeholder="Per esempio: figlia" />
        </Field>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nuovo allaccio
// ---------------------------------------------------------------------------

function ModaleAllaccio({ schedaIniziale, onChiudi, onCreata }: { schedaIniziale?: Scheda; onChiudi: () => void; onCreata: (id: string) => void }) {
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const [q, setQ] = useState('');
  const [scheda, setScheda] = useState<Scheda | null>(schedaIniziale ?? null);
  const [defunto, setDefunto] = useState<number>(0); // -1 = tutta la tomba di famiglia
  const [punti, setPunti] = useState(1);
  const [abbonato, setAbbonato] = useState<Abbonato>({ ...SOGGETTO_VUOTO });
  const inCorso = indiceUtenze(db.utenze);

  const candidate = useMemo(() => {
    const t = normalizza(q);
    if (t.length < 2) return [];
    return db.schede.filter((s) => s.cimiteroId === cim.id && s.tipologia !== 'struttura' && s.defunti.length > 0 && normalizza(`${s.id} ${descrizioneScheda(s)} ${s.viale}`).includes(t)).slice(0, 8);
  }, [q, db.schede, cim.id]);

  const famiglia = scheda?.tipologia === 'tomba_famiglia';
  const occupati = scheda ? (inCorso.get(scheda.id) ?? []) : [];
  const giaServito = (i: number) => {
    const d = scheda!.defunti[i];
    return occupati.some((u) => u.defunto && u.defunto.nome === d.nome && u.defunto.cognome === d.cognome);
  };
  const conc = scheda ? concessioneDi(scheda.id) : undefined;
  const importo = primoImporto(punti, oggiISO(), db.regole);
  const copia = () => {
    const r = conc && rappresentanteDi(conc);
    if (!r) return;
    const { rappresentante: _r, ...resto } = r;
    void _r;
    setAbbonato({ ...abbonato, ...resto });
  };
  const salva = () => {
    if (!scheda) return toast('Scegli la postazione', 'errore');
    if (defunto >= 0 && giaServito(defunto)) return toast('Questo defunto ha già un\'utenza in corso', 'errore');
    const err = soggettoIncompleto(abbonato);
    if (err) return toast(err, 'errore');
    const d = defunto >= 0 ? scheda.defunti[defunto] : null;
    const u = nuovoAllaccio({ scheda, defunto: d ? { nome: d.nome, cognome: d.cognome } : null, abbonato, puntiLuce: famiglia ? punti : 1 });
    onCreata(u.id);
  };

  return (
    <Modal titolo="Nuovo allaccio" size="lg" onClose={onChiudi} icona={<span className="list-item__icon" style={{ background: '#fff7e0', color: '#B8860B' }}><Lightbulb size={18} /></span>}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={salva}>Registra l'utenza</button></>}>
      <div className="col gap-16">
        <Field label="Postazione">
          {scheda ? (
            <div className="scheda-pick">
              <div className="grow"><b>{scheda.id}</b> · {descrizioneScheda(scheda)}<div className="small muted">{scheda.viale}</div></div>
              <StatoBadge stato={scheda.stato} small />
              <button className="btn btn--xs" onClick={() => setScheda(null)}>Cambia</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input className="input" placeholder="Cerca per ID, defunto o viale…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
              {candidate.length > 0 && (
                <div className="popover" style={{ left: 0, right: 0 }}>
                  {candidate.map((s) => (
                    <button key={s.id} className="popover__item" onClick={() => { setScheda(s); setDefunto(0); setQ(''); }}>
                      <b>{s.id}</b><span className="grow ellipsis">{descrizioneScheda(s)} · {s.viale}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Field>
        {scheda && (
          <>
            <div className="grid-form">
              <Field label="Per quale defunto">
                <select className="select" value={defunto} onChange={(e) => setDefunto(Number(e.target.value))}>
                  {scheda.defunti.map((d, i) => <option key={i} value={i} disabled={giaServito(i)}>{nomeCompleto(d)}{giaServito(i) ? ' · ha già un\'utenza' : ''}</option>)}
                  {famiglia && <option value={-1}>Tutta la tomba di famiglia</option>}
                </select>
              </Field>
              <Field label="Punti luce" hint={famiglia ? undefined : 'Più di uno solo nelle tombe di famiglia'}>
                <input className="input" type="number" min={1} max={8} value={famiglia ? punti : 1} readOnly={!famiglia} onChange={(e) => setPunti(Math.max(1, Number(e.target.value)))} />
              </Field>
            </div>
            <p className="callout">
              Da pagare all'allaccio: {euro(importo.allaccio)} di allaccio più {euro(importo.dodicesimi)} di canone ({importo.mesi} dodicesimi, fino al 31 dicembre). Totale <b>{euro(importo.totale)}</b>.
            </p>
            <div>
              <div className="row row--between">
                <h3 className="section-title" style={{ margin: 0 }}>Abbonato</h3>
                {conc && <button className="btn btn--xs" onClick={copia}>Copia dal concessionario</button>}
              </div>
              <div className="mt-8"><AbbonatoForm valore={abbonato} onChange={setAbbonato} /></div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
