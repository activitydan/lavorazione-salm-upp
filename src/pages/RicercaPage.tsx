import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ClipboardCheck, Download, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react';
import { BarraPagine, FinestraEsporta, PER_PAGINA, paginaDi } from '../components/Esporta';
import { FilterPanel } from '../components/FilterPanel';
import { Field, Modal, Seg, StatoBadge, TipologiaBadge } from '../components/ui';
import { aggiornaScheda, creaVerifica, seleziona, toast, useStore } from '../data/store';
import { campiPer, contaFiltriAttivi, descrizioneScheda, statoDef, useSchedeCimitero, useSchedeFiltrate, valoreLeggibile } from '../data/selectors';
import type { Defunto, Scheda } from '../data/types';
import type { Riga } from '../lib/excel';
import { aggiungiGiorni, data, eta, nomeCompleto, normalizza, numero, oggiISO } from '../lib/format';
import { fotoUrl } from '../lib/photo';
import { useTelefono } from '../lib/schermo';
import { setQuery, useRotta, vai } from '../router';

type Vista = 'schede' | 'defunti';
type Ordine = 'id' | 'nome' | 'morte' | 'stato' | 'viale' | 'tipologia';

function chiave(s: Scheda, o: Ordine): string {
  switch (o) {
    case 'nome':
      return descrizioneScheda(s).toLowerCase();
    case 'morte':
      return s.defunti[0]?.dataMorte ?? '';
    case 'stato':
      return s.stato;
    case 'viale':
      return s.viale;
    case 'tipologia':
      return s.tipologia;
    default:
      return s.id;
  }
}

export function RicercaPage() {
  const rotta = useRotta();
  const telefono = useTelefono();
  const vista: Vista = rotta.query.get('vista') === 'defunti' ? 'defunti' : 'schede';
  const tutte = useSchedeCimitero();
  const filtrate = useSchedeFiltrate();
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const foto = useStore((s) => s.foto);
  const filtri = useStore((s) => s.filtri);
  const selezionata = useStore((s) => s.ui.selezionata);
  const [ordine, setOrdine] = useState<{ k: Ordine; dir: 1 | -1 }>({ k: 'id', dir: 1 });
  const [pagina, setPagina] = useState(0);
  const [scelte, setScelte] = useState<Set<string>>(new Set());
  const [filtriMobile, setFiltriMobile] = useState(false);
  const [esporta, setEsporta] = useState(false);
  const [modVer, setModVer] = useState(false);
  const extra = campiPer(config, undefined, (c) => c.inTabella);

  // i risultati cambiano: si torna alla prima pagina
  useEffect(() => setPagina(0), [filtri, vista]);

  const ordinate = useMemo(() => [...filtrate].sort((a, b) => chiave(a, ordine.k).localeCompare(chiave(b, ordine.k)) * ordine.dir), [filtrate, ordine]);
  const righe = paginaDi(ordinate, pagina);
  const selezionate = useMemo(() => ordinate.filter((s) => scelte.has(s.id)), [ordinate, scelte]);
  const daEsportare = selezionate.length ? selezionate : ordinate;

  // una riga per defunto; con il filtro sul nome restano i defunti che corrispondono
  // (tutti, se la scheda è stata trovata per il concessionario)
  const defunti = useMemo(() => {
    const parole = normalizza(filtri.nominativo).split(/\s+/).filter(Boolean);
    const out: { d: Defunto; s: Scheda }[] = [];
    for (const s of filtrate) {
      const corrispondono = parole.length ? s.defunti.filter((d) => parole.every((p) => normalizza(nomeCompleto(d)).includes(p))) : s.defunti;
      for (const d of corrispondono.length ? corrispondono : s.defunti) out.push({ d, s });
    }
    return out.sort((a, b) => `${a.d.cognome} ${a.d.nome}`.localeCompare(`${b.d.cognome} ${b.d.nome}`));
  }, [filtrate, filtri.nominativo]);
  const righeDefunti = paginaDi(defunti, pagina);
  const nomeStruttura = (s: Scheda) => db.strutture.find((x) => x.id === s.posizione?.strutturaId)?.nome;
  const ubicazione = (s: Scheda) => `${s.viale}${nomeStruttura(s) ? ` · ${nomeStruttura(s)}` : ''}${s.posizione ? ` · fila ${s.posizione.fila} col. ${s.posizione.colonna}` : ''}`;
  const excelDefunti = (): Riga[] => defunti.map(({ d, s }) => ({
    Cognome: d.cognome, Nome: d.nome, Sesso: d.sesso ?? '', 'Data di nascita': data(d.dataNascita), 'Data di morte': data(d.dataMorte), Età: eta(d),
    'ID scheda': s.id, Ubicazione: ubicazione(s), Stato: statoDef(config, s.stato).label,
  }));

  const totale = vista === 'defunti' ? defunti.length : ordinate.length;
  const quantiEsporta = vista === 'defunti' ? defunti.length : daEsportare.length;

  const th = (k: Ordine, label: string) => (
    <th className="sortable" onClick={() => setOrdine((o) => ({ k, dir: o.k === k ? (o.dir === 1 ? -1 : 1) : 1 }))}>
      <span className="row gap-4" style={{ display: 'inline-flex' }}>
        {label}
        {ordine.k === k && (ordine.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </span>
    </th>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Ricerca</h1>
        </div>
        <div className="page-head__actions">
          <button className="btn ricerca__filtri-btn" onClick={() => setFiltriMobile(true)}><SlidersHorizontal size={16} />Filtri ({contaFiltriAttivi(filtri)})</button>
          {!telefono && <button className="btn" onClick={() => vai('/mappa')}><MapIcon size={16} />Vedi sulla mappa</button>}
          {!telefono && <button className="btn btn--primary" disabled={!quantiEsporta} onClick={() => setEsporta(true)}><Download size={16} />Esporta {numero(quantiEsporta)}</button>}
        </div>
      </div>
      <div className="ricerca">
        <aside className={`card ricerca__filtri ${filtriMobile ? 'is-open' : ''}`}>
          <FilterPanel risultati={filtrate.length} totale={tutte.length} onChiudi={filtriMobile ? () => setFiltriMobile(false) : undefined} />
        </aside>
        <section className="card ricerca__tab">
          {scelte.size > 0 && vista === 'schede' && !telefono ? (
            <div className="bulk">
              <b>{scelte.size} selezionate</b>
              <button className="btn btn--sm" onClick={() => setModVer(true)}><ClipboardCheck size={14} />Assegna verifica</button>
              <select
                className="select select--sm"
                style={{ width: 'auto' }}
                value=""
                onChange={(e) => {
                  const st = config.stati.find((x) => x.id === e.target.value);
                  if (!st) return;
                  for (const id of scelte) aggiornaScheda(id, { stato: st.id }, `Stato: ${st.label} (modifica multipla)`);
                  toast(`${scelte.size} schede impostate su “${st.label}”`);
                }}
              >
                <option value="">Cambia stato…</option>
                {config.stati.filter((x) => !x.archiviato).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
              <button className="btn btn--sm btn--ghost" onClick={() => setScelte(new Set())}><X size={14} />Deseleziona</button>
            </div>
          ) : (
            <div className="bulk bulk--soft">
              <Seg small options={[{ id: 'schede', label: 'Schede' }, { id: 'defunti', label: 'Defunti' }]} value={vista} onChange={(v) => setQuery('vista', v === 'defunti' ? 'defunti' : null)} />
              <span className="small muted">
                <b className="mono" style={{ color: 'var(--text)' }}>{numero(totale)}</b> {vista === 'defunti' ? 'defunti' : 'schede'}
              </span>
            </div>
          )}

          {telefono ? (
            <div className="ricerca__card-list">
              {vista === 'schede' && righe.map((s) => (
                <button key={s.id} className="ricerca__card" onClick={() => seleziona(s.id)}>
                  <img className="list-item__thumb" src={fotoUrl(s, foto)} alt="" loading="lazy" />
                  <span className="grow">
                    <b className="ellipsis">{descrizioneScheda(s)}</b>
                    <span className="tiny muted">{s.id} · {s.viale}</span>
                  </span>
                  <StatoBadge stato={s.stato} small />
                </button>
              ))}
              {vista === 'defunti' && righeDefunti.map(({ d, s }, i) => (
                <button key={`${s.id}-${i}`} className="ricerca__card" onClick={() => seleziona(s.id)}>
                  <img className="list-item__thumb" src={fotoUrl(s, foto)} alt="" loading="lazy" />
                  <span className="grow">
                    <b className="ellipsis">{d.cognome} {d.nome}</b>
                    <span className="tiny muted">{s.id} · {s.viale}</span>
                  </span>
                  <StatoBadge stato={s.stato} small />
                </button>
              ))}
              {!totale && <div className="empty"><h3>Nessun risultato</h3><p>Prova ad allargare la ricerca o azzera i filtri.</p></div>}
            </div>
          ) : vista === 'schede' ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        className="check"
                        aria-label="Seleziona tutte le righe della pagina"
                        checked={righe.length > 0 && righe.every((r) => scelte.has(r.id))}
                        onChange={(e) => {
                          const n = new Set(scelte);
                          for (const r of righe) e.target.checked ? n.add(r.id) : n.delete(r.id);
                          setScelte(n);
                        }}
                      />
                    </th>
                    <th style={{ width: 56 }} />
                    {th('id', 'ID')}
                    {th('nome', 'Defunto / postazione')}
                    {th('morte', 'Data di morte')}
                    {th('tipologia', 'Tipologia')}
                    {th('stato', 'Stato')}
                    {th('viale', 'Viale')}
                    <th>Quadrante</th>
                    {extra.map((c) => <th key={c.id}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {righe.map((s) => (
                    <tr key={s.id} className={`clickable ${selezionata === s.id ? 'is-sel' : ''}`} onClick={() => seleziona(s.id)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="check"
                          aria-label={`Seleziona ${s.id}`}
                          checked={scelte.has(s.id)}
                          onChange={(e) => {
                            const n = new Set(scelte);
                            e.target.checked ? n.add(s.id) : n.delete(s.id);
                            setScelte(n);
                          }}
                        />
                      </td>
                      <td><img className="list-item__thumb" src={fotoUrl(s, foto)} alt="" loading="lazy" /></td>
                      <td className="id">{s.id}</td>
                      <td>
                        <b>{descrizioneScheda(s)}</b>
                        {s.posizione && <div className="tiny muted">{nomeStruttura(s)} · fila {s.posizione.fila} col. {s.posizione.colonna}</div>}
                      </td>
                      <td className="nowrap">{data(s.defunti[0]?.dataMorte)}</td>
                      <td><TipologiaBadge tipologia={s.tipologia} small /></td>
                      <td><StatoBadge stato={s.stato} small /></td>
                      <td className="nowrap">{s.viale}</td>
                      <td className="nowrap">{db.quadranti.find((q) => q.id === s.quadranteId)?.codice ?? '—'}</td>
                      {extra.map((c) => <td key={c.id} className="nowrap">{valoreLeggibile(c, s.campi[c.id])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!righe.length && <div className="empty"><h3>Nessuna scheda corrisponde ai filtri</h3><p>Prova ad allargare la ricerca o azzera i filtri.</p></div>}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Cognome</th><th>Nome</th><th>Nascita</th><th>Morte</th><th className="num">Età</th><th>Ubicazione</th><th>Stato</th></tr>
                </thead>
                <tbody>
                  {righeDefunti.map(({ d, s }, i) => (
                    <tr key={`${s.id}-${i}`} className={`clickable ${selezionata === s.id ? 'is-sel' : ''}`} onClick={() => seleziona(s.id)}>
                      <td><b>{d.cognome || '—'}</b></td>
                      <td>{d.nome || <span className="badge badge--giallo badge--sm">Da completare</span>}</td>
                      <td className="nowrap">{data(d.dataNascita)}</td>
                      <td className="nowrap">{d.dataMorte ? data(d.dataMorte) : <span className="badge badge--giallo badge--sm">Da completare</span>}</td>
                      <td className="num">{eta(d) ?? '—'}</td>
                      <td>
                        <span className="id">{s.id}</span>
                        <div className="tiny muted">{ubicazione(s)}</div>
                      </td>
                      <td><StatoBadge stato={s.stato} small /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!righeDefunti.length && <div className="empty"><h3>Nessun defunto corrisponde ai filtri</h3><p>Prova ad allargare la ricerca o azzera i filtri.</p></div>}
            </div>
          )}
          <BarraPagine pagina={pagina} totale={totale} perPagina={PER_PAGINA} onPagina={setPagina} />
        </section>
      </div>
      {esporta && (
        <FinestraEsporta
          schede={daEsportare}
          cosa={vista === 'defunti' ? `${numero(defunti.length)} defunti` : selezionate.length ? `${numero(selezionate.length)} schede selezionate` : `${numero(ordinate.length)} risultati`}
          righeDefunti={vista === 'defunti' ? excelDefunti() : undefined}
          onChiudi={() => setEsporta(false)}
        />
      )}
      {modVer && <VerificaMultipla ids={[...scelte]} onChiudi={() => setModVer(false)} />}
    </div>
  );
}

function VerificaMultipla({ ids, onChiudi }: { ids: string[]; onChiudi: () => void }) {
  const config = useStore((s) => s.config);
  const operatori = useStore((s) => s.db.operatori).filter((o) => o.attivo);
  const [op, setOp] = useState(operatori[0]?.id ?? '');
  const [motivo, setMotivo] = useState(config.motiviVerifica[0]?.id ?? '');
  const [scad, setScad] = useState(aggiungiGiorni(oggiISO(), 14));
  return (
    <Modal titolo={`Assegna verifica a ${ids.length} schede`} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={() => { ids.forEach((id) => creaVerifica({ schedaId: id, operatoreId: op, motivo, scadenza: scad }, true)); toast(`${ids.length} verifiche assegnate`); onChiudi(); }}>Assegna</button></>}>
      <div className="grid-form">
        <Field label="Operatore"><select className="select" value={op} onChange={(e) => setOp(e.target.value)}>{operatori.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
        <Field label="Motivo"><select className="select" value={motivo} onChange={(e) => setMotivo(e.target.value)}>{config.motiviVerifica.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></Field>
        <Field label="Entro il"><input className="input" type="date" value={scad} onChange={(e) => setScad(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
