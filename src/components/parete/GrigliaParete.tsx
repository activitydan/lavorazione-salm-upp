import { NOMI_STRUTTURA } from '../../config/defaults';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Grid3x3, Maximize2, Search, X } from 'lucide-react';
import { apriParete, indiceSchede, loculiPerStruttura, seleziona, useStore } from '../../data/store';
import { contaFiltriAttivi, descrizioneScheda, filtraSchede, occupazioneStruttura, statoDef, tipologiaDef } from '../../data/selectors';
import type { Scheda, Struttura } from '../../data/types';
import { data, decedutoDa, nomeCompleto, normalizza } from '../../lib/format';
import { href } from '../../router';
import { FotoScheda } from '../scheda/Media';
import { Dot, Progress, StatoBadge } from '../ui';

// Griglia a parete delle strutture (colombari, cappelle, ossari, cinerari): una griglia per ogni parete, file dal basso.

function Griglia({ struttura, loculi, coloreDi, evidenzia, selezionata, onSel }: {
  struttura: Struttura; loculi: Scheda[]; coloreDi: (s: Scheda) => string; evidenzia: Set<string> | null; selezionata: string | null; onSel: (id: string) => void;
}) {
  const perCella = useMemo(() => new Map(loculi.map((l) => [`${l.posizione!.faccia}|${l.posizione!.fila}|${l.posizione!.colonna}`, l])), [loculi]);
  return (
    <div className="griglia2d">
      {struttura.facce.map((f, fi) => (
        <div key={fi} className="griglia2d__faccia">
          <h4>{f.nome}</h4>
          <div className="griglia2d__wrap">
            <div className="griglia2d__righe">
              {Array.from({ length: f.righe }, (_, i) => <span key={i}>{f.righe - i}</span>)}
            </div>
            <div className="griglia2d__cells" style={{ gridTemplateColumns: `repeat(${f.colonne}, minmax(74px, 1fr))` }}>
              {Array.from({ length: f.righe }, (_, r) => f.righe - r).flatMap((fila) =>
                Array.from({ length: f.colonne }, (_, c) => {
                  const l = perCella.get(`${fi}|${fila}|${c + 1}`);
                  const col = l ? coloreDi(l) : '#D5D8DD';
                  const spento = !!(l && evidenzia && !evidenzia.has(l.id));
                  const d = l?.defunti[0];
                  return (
                    <button
                      key={`${fila}-${c}`}
                      data-scheda={l?.id}
                      className={`cella2d ${l?.id === selezionata ? 'is-sel' : ''} ${spento ? 'is-off' : ''}`}
                      style={{ ['--c' as string]: col.toUpperCase() === '#FFFFFF' ? '#cfd6de' : col }}
                      onClick={() => l && onSel(l.id)}
                      title={l ? `${l.id} · fila ${fila}, colonna ${c + 1}` : 'Cella senza scheda'}
                    >
                      {d ? (
                        <>
                          <b>{(d.cognome || '?').toUpperCase()}</b>
                          <span>{d.nome}</span>
                          <span className="tiny">{(d.dataMorte ?? '????').slice(0, 4)}</span>
                        </>
                      ) : (
                        <span className="tiny muted">{l ? 'Libero' : '—'}</span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
          <div className="griglia2d__col tiny muted">Colonne 1 → {f.colonne}, file dal basso</div>
        </div>
      ))}
    </div>
  );
}

export function GrigliaParete() {
  const v = useStore((s) => s.ui.parete);
  if (!v) return null;
  return <Contenuto key={`${v.strutturaId}|${v.schedaId ?? ''}`} v={v} />;
}

function Contenuto({ v }: { v: { strutturaId: string; schedaId?: string } }) {
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const filtri = useStore((s) => s.filtri);
  const coloraPer = useStore((s) => s.ui.coloraPer);
  const [sel, setSel] = useState<string | null>(v.schedaId ?? null);
  const [cerca, setCerca] = useState('');
  const [usaFiltri, setUsaFiltri] = useState(true);
  const stage = useRef<HTMLDivElement>(null);

  const struttura = db.strutture.find((s) => s.id === v.strutturaId);
  const loculi = useMemo(() => (struttura ? loculiPerStruttura(db.schede).get(struttura.id) ?? [] : []), [db.schede, struttura]);
  const coloreDi = useCallback(
    (s: Scheda) => (coloraPer === 'stato' ? statoDef(config, s.stato).colore : tipologiaDef(config, s.tipologia).colore),
    [config, coloraPer],
  );
  const filtriAttivi = contaFiltriAttivi(filtri) > 0;
  const evidenzia = useMemo(() => {
    const t = normalizza(cerca);
    if (t) return new Set(loculi.filter((l) => normalizza(`${l.id} ${l.defunti.map((d) => `${d.nome} ${d.cognome}`).join(' ')}`).includes(t)).map((l) => l.id));
    if (filtriAttivi && usaFiltri) return new Set(filtraSchede(loculi, filtri, config, db.strutture).map((l) => l.id));
    return null;
  }, [cerca, loculi, filtri, config, db.strutture, filtriAttivi, usaFiltri]);

  // se si arriva da una scheda, la cella del loculo viene portata in vista
  useEffect(() => {
    if (!v.schedaId) return;
    const cella = stage.current?.querySelector(`[data-scheda="${v.schedaId}"]`);
    cella?.scrollIntoView({ block: 'center', inline: 'center' });
  }, [v.schedaId]);

  if (!struttura) return null;
  const chiudi = () => apriParete(null);
  const contenitore = indiceSchede(db.schede).get(struttura.schedaId);
  const occ = occupazioneStruttura(db.schede, struttura.id);
  const scelto = sel ? indiceSchede(db.schede).get(sel) : undefined;
  const conteggio = Object.fromEntries(config.stati.map((st) => [st.id, loculi.filter((l) => l.stato === st.id).length]));

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && chiudi()}>
      <div className="modal modal--xl parete">
        <div className="modal__head">
          <div className="row gap-12">
            <span className="list-item__icon" style={{ background: '#EAF2F9', color: '#1B5A8F' }}><Grid3x3 size={20} /></span>
            <div>
              <h2>{struttura.nome}</h2>
              <p>
                {NOMI_STRUTTURA[struttura.tipo]} · {struttura.viale} · {occ.occupati} occupati su {occ.totale} posti
              </p>
            </div>
          </div>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={chiudi} aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="parete__body">
          <div className="parete__stage" ref={stage}>
            <Griglia struttura={struttura} loculi={loculi} coloreDi={coloreDi} evidenzia={evidenzia} selezionata={sel} onSel={setSel} />
          </div>
          <aside className="parete__side">
            <div className="input-icon">
              <Search size={16} />
              <input className="input input--sm" placeholder="Cerca un nome in questa struttura" value={cerca} onChange={(e) => setCerca(e.target.value)} />
            </div>
            {filtriAttivi && !cerca && (
              <label className="row small mt-8" style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="check" checked={usaFiltri} onChange={(e) => setUsaFiltri(e.target.checked)} />
                Evidenzia i risultati dei filtri attivi ({evidenzia?.size ?? 0})
              </label>
            )}
            {scelto ? (
              <div className="parete__card">
                <FotoScheda s={scelto} modificabile={false} />
                <div className="row row--between mt-12">
                  <b className="display" style={{ color: '#0A2F55' }}>{scelto.id}</b>
                  <StatoBadge stato={scelto.stato} small />
                </div>
                {scelto.defunti.length ? (
                  scelto.defunti.map((d, i) => (
                    <div key={i} className="mt-8">
                      <div className="strong">{nomeCompleto(d)}</div>
                      <div className="small muted">{data(d.dataNascita)} – {data(d.dataMorte)}</div>
                      {decedutoDa(d) && <span className="badge badge--blu badge--sm mt-8">{decedutoDa(d)}</span>}
                    </div>
                  ))
                ) : (
                  <p className="small muted mt-8">Posto libero, disponibile per una nuova concessione.</p>
                )}
                {scelto.posizione && (
                  <p className="small mt-8">
                    {struttura.facce[scelto.posizione.faccia]?.nome} · fila <b>{scelto.posizione.fila}</b> · colonna <b>{scelto.posizione.colonna}</b>
                  </p>
                )}
                <div className="row gap-4 mt-12">
                  <button className="btn btn--sm btn--primary grow" onClick={() => { chiudi(); seleziona(scelto.id); }}>Apri scheda</button>
                  <a className="btn btn--sm" href={href(`/scheda/${scelto.id}`)} onClick={chiudi} title="Vista estesa"><Maximize2 size={14} /></a>
                </div>
              </div>
            ) : (
              <div className="parete__card">
                <p className="small muted">Seleziona un loculo nella griglia per vederne i dati.</p>
                {contenitore && (
                  <button className="btn btn--sm mt-12" onClick={() => { chiudi(); seleziona(contenitore.id); }}>
                    Scheda della struttura · {descrizioneScheda(contenitore)}
                  </button>
                )}
              </div>
            )}
            <div className="parete__legend">
              <div className="upper muted">Legenda {coloraPer === 'stato' ? 'stati' : 'tipologie'}</div>
              {config.stati.map((st) => (
                <div key={st.id} className="row row--between small">
                  <span className="row gap-4"><Dot colore={st.colore} />{st.label}</span>
                  <b className="mono">{conteggio[st.id] ?? 0}</b>
                </div>
              ))}
              <Progress value={occ.occupati} max={occ.totale} verde small />
              <span className="tiny muted">Occupazione {occ.totale ? Math.round((occ.occupati / occ.totale) * 100) : 0}%</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
