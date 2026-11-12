import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ClipboardCheck, FileSpreadsheet, FileText, Map as MapIcon, QrCode, SlidersHorizontal, X } from 'lucide-react';
import { FilterPanel } from '../components/FilterPanel';
import { Field, Modal, StatoBadge, TipologiaBadge } from '../components/ui';
import { aggiornaScheda, creaVerifica, registraEsportazione, seleziona, toast, useStore } from '../data/store';
import { campiPer, contaFiltriAttivi, descrizioneScheda, useSchedeCimitero, useSchedeFiltrate, valoreLeggibile } from '../data/selectors';
import type { Scheda } from '../data/types';
import { colonneDisponibili, colonnePredefinite, righeSchede, scaricaExcel } from '../lib/excel';
import { aggiungiGiorni, data, numero, oggiISO } from '../lib/format';
import { pdfEtichetteQr, pdfSchede } from '../lib/pdf';
import { fotoUrl } from '../lib/photo';
import { vai } from '../router';

type Ordine = 'id' | 'nome' | 'morte' | 'stato' | 'viale' | 'tipologia';
const PER_PAGINA = 50;

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
  const [lavoro, setLavoro] = useState<string | null>(null);
  const [modVer, setModVer] = useState(false);
  const extra = campiPer(config, undefined, (c) => c.inTabella);

  const ordinate = useMemo(() => [...filtrate].sort((a, b) => chiave(a, ordine.k).localeCompare(chiave(b, ordine.k)) * ordine.dir), [filtrate, ordine]);
  const pagine = Math.max(1, Math.ceil(ordinate.length / PER_PAGINA));
  const p = Math.min(pagina, pagine - 1);
  const righe = ordinate.slice(p * PER_PAGINA, (p + 1) * PER_PAGINA);
  const lista = scelte.size ? ordinate.filter((s) => scelte.has(s.id)) : ordinate;
  const ctx = { config, db };

  const th = (k: Ordine, label: string) => (
    <th className="sortable" onClick={() => setOrdine((o) => ({ k, dir: o.k === k ? (o.dir === 1 ? -1 : 1) : 1 }))}>
      <span className="row gap-4" style={{ display: 'inline-flex' }}>
        {label}
        {ordine.k === k && (ordine.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </span>
    </th>
  );

  const excel = () => {
    const cols = colonneDisponibili(config).filter((c) => colonnePredefinite(config).includes(c.id));
    scaricaExcel(`CimiTera_ricerca_${oggiISO()}`, [{ nome: 'Schede', righe: righeSchede(lista, cols, ctx) }]);
    registraEsportazione('Excel ricerca', lista.length);
  };
  const pdf = async () => {
    if (lista.length > 150 && !confirm(`Stai per generare un PDF di ${lista.length} pagine. Continuare?`)) return;
    setLavoro('PDF 0%');
    await pdfSchede(lista, { config, db, foto }, (n) => setLavoro(`PDF ${Math.round((n / lista.length) * 100)}%`));
    registraEsportazione('PDF schede', lista.length);
    setLavoro(null);
  };
  const etichette = async () => {
    setLavoro('Etichette…');
    await pdfEtichetteQr(lista);
    registraEsportazione('Etichette QR', lista.length);
    setLavoro(null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Ricerca</h1>
        </div>
        <div className="page-head__actions">
          <button className="btn ricerca__filtri-btn" onClick={() => setFiltriMobile(true)}><SlidersHorizontal size={16} />Filtri ({contaFiltriAttivi(filtri)})</button>
          <button className="btn" onClick={() => vai('/mappa')}><MapIcon size={16} />Vedi sulla mappa</button>
          <button className="btn btn--primary" onClick={excel}><FileSpreadsheet size={16} />Excel ({numero(lista.length)})</button>
        </div>
      </div>
      <div className="ricerca">
        <aside className={`card ricerca__filtri ${filtriMobile ? 'is-open' : ''}`}>
          <FilterPanel risultati={filtrate.length} totale={tutte.length} onChiudi={filtriMobile ? () => setFiltriMobile(false) : undefined} />
        </aside>
        <section className="card ricerca__tab">
          {scelte.size > 0 && (
            <div className="bulk">
              <b>{scelte.size} selezionate</b>
              <button className="btn btn--sm" onClick={excel}><FileSpreadsheet size={14} />Excel</button>
              <button className="btn btn--sm" onClick={pdf} disabled={!!lavoro}><FileText size={14} />PDF schede</button>
              <button className="btn btn--sm" onClick={etichette} disabled={!!lavoro}><QrCode size={14} />Etichette QR</button>
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
              {lavoro && <span className="small muted row gap-4"><span className="spinner" />{lavoro}</span>}
            </div>
          )}
          {!scelte.size && (
            <div className="bulk bulk--soft">
              <span className="small muted">
                <b className="mono" style={{ color: 'var(--text)' }}>{numero(filtrate.length)}</b> risultati · seleziona le righe per le azioni multiple, oppure esporta tutto
              </span>
              <button className="btn btn--sm" onClick={pdf} disabled={!!lavoro || !filtrate.length}><FileText size={14} />PDF di tutte</button>
              <button className="btn btn--sm" onClick={etichette} disabled={!!lavoro || !filtrate.length}><QrCode size={14} />Etichette QR</button>
              {lavoro && <span className="small muted row gap-4"><span className="spinner" />{lavoro}</span>}
            </div>
          )}
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
                  {th('nome', 'Defunto / manufatto')}
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
                      {s.posizione && <div className="tiny muted">{db.strutture.find((x) => x.id === s.posizione!.strutturaId)?.nome} · fila {s.posizione.fila} col. {s.posizione.colonna}</div>}
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
          <div className="pager">
            <span className="small muted">
              {numero(p * PER_PAGINA + (righe.length ? 1 : 0))}–{numero(p * PER_PAGINA + righe.length)} di {numero(ordinate.length)}
            </span>
            <div className="row gap-4">
              <button className="btn btn--sm" disabled={p === 0} onClick={() => setPagina(p - 1)}>Precedente</button>
              <span className="small strong">{p + 1} / {pagine}</span>
              <button className="btn btn--sm" disabled={p >= pagine - 1} onClick={() => setPagina(p + 1)}>Successiva</button>
            </div>
          </div>
        </section>
      </div>
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
