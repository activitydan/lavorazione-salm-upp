import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crop, Maximize, Plus, RefreshCw, RotateCw, ScanText, Trash2, TriangleAlert } from 'lucide-react';
import { Field, Progress } from '../ui';
import { useStore } from '../../data/store';
import { descrizioneScheda } from '../../data/selectors';
import type { Defunto, Scheda } from '../../data/types';
import { chiave, creaDizionario, noteDaLettura, type Affidabilita, type CampoLetto, type DefuntoLetto } from '../../lib/lapide';
import { leggiFoto, type Area, type RisultatoLettura } from '../../lib/ocr';
import { data, oggiISO } from '../../lib/format';
import { ruotaFoto } from '../../lib/photo';
import { href } from '../../router';

/** Quello che la lettura consegna alla scheda: defunti, note (solo anni, età, "in …") e cognome di famiglia. */
export interface EsitoLettura {
  defunti: Defunto[];
  note: string[];
  famiglia?: string;
}

type Voce = Omit<DefuntoLetto, 'aff'> & { id: number; aff: Record<CampoLetto, Affidabilita | 'ok'> };

type Stato =
  | { fase: 'ferma' }
  | { fase: 'lettura'; testo: string; p: number | null }
  | { fase: 'fatto'; r: RisultatoLettura }
  | { fase: 'errore'; msg: string };

let prossimaVoce = 1;
const vuota = (): Voce => ({
  id: prossimaVoce++,
  nome: '',
  cognome: '',
  dataNascita: null,
  dataMorte: null,
  corretti: [],
  box: [],
  aff: { nome: 'ok', cognome: 'ok', sesso: 'ok', dataNascita: 'ok', dataMorte: 'ok' },
});

export function esitoDa(voci: Voce[], famiglia?: string): EsitoLettura {
  const utili = voci.filter((v) => v.nome.trim() || v.cognome.trim() || v.dataMorte || v.dataNascita);
  return {
    defunti: utili.map((v) => ({ nome: v.nome.trim(), cognome: v.cognome.trim(), sesso: v.sesso, dataNascita: v.dataNascita, dataMorte: v.dataMorte })),
    note: noteDaLettura(utili.map((v) => ({ ...v, aff: { nome: 'alta', cognome: 'alta', sesso: 'alta', dataNascita: 'alta', dataMorte: 'alta' } }))),
    famiglia,
  };
}

/** Defunti letti che risultano già in un'altra scheda dello stesso cimitero (stesso nome e date compatibili). */
function giaCensiti(voci: Voce[], schede: Scheda[], cimiteroId: string, escludi?: string) {
  const out: { voce: Voce; scheda: Scheda; d: Defunto }[] = [];
  for (const v of voci) {
    const c = chiave(v.cognome);
    const n = chiave(v.nome);
    if (!c || (!n && !v.dataMorte)) continue;
    for (const s of schede) {
      if (s.cimiteroId !== cimiteroId || s.id === escludi) continue;
      for (const d of s.defunti) {
        if (chiave(d.cognome) !== c || (n && chiave(d.nome) !== n)) continue;
        if (v.dataMorte && d.dataMorte && v.dataMorte !== d.dataMorte) continue;
        if (v.dataNascita && d.dataNascita && v.dataNascita !== d.dataNascita) continue;
        out.push({ voce: v, scheda: s, d });
      }
    }
  }
  return out.slice(0, 4);
}

export function LetturaLapide({
  foto,
  cimiteroId,
  schedaId,
  onFoto,
  onEsito,
  onUsa,
  onSalta,
  testoUsa = 'Usa questi dati',
  testoSalta = 'Compila a mano',
}: {
  foto: string;
  cimiteroId: string;
  /** Scheda che si sta modificando: non va segnalata come doppione di se stessa. */
  schedaId?: string;
  /** Se presente, si può ruotare la foto: riceve la foto ruotata. */
  onFoto?: (f: string) => void;
  /** Riceve l'esito aggiornato a ogni correzione (null mentre legge). */
  onEsito?: (e: EsitoLettura | null) => void;
  onUsa: (e: EsitoLettura) => void;
  onSalta?: () => void;
  testoUsa?: string;
  testoSalta?: string;
}) {
  const schede = useStore((s) => s.db.schede);
  const diz = useMemo(() => creaDizionario(schede.flatMap((s) => s.defunti)), [schede]);
  const dizRef = useRef(diz);
  dizRef.current = diz;
  const esitoRef = useRef(onEsito);
  esitoRef.current = onEsito;

  const [stato, setStato] = useState<Stato>({ fase: 'ferma' });
  const [voci, setVoci] = useState<Voce[]>([]);
  const [area, setArea] = useState<Area | null>(null);
  const [ritaglio, setRitaglio] = useState(false);
  const [sel, setSel] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const [ruotando, setRuotando] = useState(false);
  const giro = useRef(0);

  const leggi = async (a: Area | null) => {
    const n = ++giro.current;
    setStato({ fase: 'lettura', testo: 'Preparo il riconoscimento…', p: null });
    try {
      const r = await leggiFoto(foto, a, dizRef.current, (testo, p) => {
        if (n === giro.current) setStato({ fase: 'lettura', testo, p });
      });
      if (n !== giro.current) return;
      setVoci(r.lettura.defunti.map((d) => ({ ...d, id: prossimaVoce++ })));
      setStato({ fase: 'fatto', r });
    } catch (e) {
      console.error(e);
      if (n === giro.current) setStato({ fase: 'errore', msg: 'Il riconoscimento non è partito. Controlla la connessione la prima volta che lo usi, poi riprova.' });
    }
  };

  useEffect(() => {
    setArea(null);
    setRitaglio(false);
    setVoci([]);
    void leggi(null);
    return () => {
      giro.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foto]);

  const famiglia = stato.fase === 'fatto' ? stato.r.lettura.famiglia : undefined;
  useEffect(() => {
    esitoRef.current?.(stato.fase === 'fatto' ? esitoDa(voci, famiglia) : null);
  }, [voci, stato.fase, famiglia]);

  const doppi = useMemo(() => (stato.fase === 'fatto' ? giaCensiti(voci, schede, cimiteroId, schedaId) : []), [voci, schede, cimiteroId, schedaId, stato.fase]);
  const daControllare = voci.reduce((t, v) => t + (Object.keys(v.aff) as CampoLetto[]).filter((k) => v.aff[k] !== 'ok' && v.aff[k] !== 'alta' && valore(v, k)).length, 0);

  const set = (id: number, patch: Partial<Voce>, campo?: CampoLetto) =>
    setVoci((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch, aff: campo ? { ...v.aff, [campo]: 'ok' } : v.aff } : v)));

  // selezione dell'area con la scritta, direttamente sulla foto
  const punto = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const c = (v: number) => Math.min(1, Math.max(0, v));
    return { x: c((e.clientX - r.left) / r.width), y: c((e.clientY - r.top) / r.height) };
  };
  const W = dim?.w ?? 1;
  const H = dim?.h ?? 1;
  const leggendo = stato.fase === 'lettura';
  const righe = stato.fase === 'fatto' ? stato.r.righe : [];

  return (
    <div className="lettura">
      <div className="lettura__foto">
        <div className={`lettura__img ${leggendo ? 'is-lettura' : ''}`}>
          <img src={foto} alt="Foto della lapide" onLoad={(e) => setDim({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
          {dim && (
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className={ritaglio ? 'is-ritaglio' : ''}
              onPointerDown={(e) => {
                if (!ritaglio) return;
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  // senza cattura la selezione funziona lo stesso finché il dito resta sulla foto
                }
                const p = punto(e);
                setSel({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
              }}
              onPointerMove={(e) => {
                if (!sel) return;
                const p = punto(e);
                setSel({ ...sel, x1: p.x, y1: p.y });
              }}
              onPointerUp={() => {
                if (!sel) return;
                const a = { x: Math.min(sel.x0, sel.x1), y: Math.min(sel.y0, sel.y1), w: Math.abs(sel.x1 - sel.x0), h: Math.abs(sel.y1 - sel.y0) };
                setSel(null);
                if (a.w < 0.06 || a.h < 0.04) return;
                setArea(a);
                setRitaglio(false);
                void leggi(a);
              }}
            >
              {area && !sel && (
                <path
                  className="lettura__fuori"
                  fillRule="evenodd"
                  d={`M0 0H${W}V${H}H0Z M${area.x * W} ${area.y * H}h${area.w * W}v${area.h * H}h${-area.w * W}Z`}
                />
              )}
              {!leggendo &&
                righe.flatMap((r, i) =>
                  r.parole.map((p, j) => (
                    <rect key={`${i}-${j}`} className="lettura__parola" x={p.bbox.x0} y={p.bbox.y0} width={p.bbox.x1 - p.bbox.x0} height={p.bbox.y1 - p.bbox.y0} rx={W / 300} />
                  )),
                )}
              {!leggendo &&
                voci.map((v, i) =>
                  v.box.map((b, k) => (
                    <g key={`${v.id}-${k}`} className="lettura__usata">
                      <rect x={b.x0 - W / 160} y={b.y0 - W / 160} width={b.x1 - b.x0 + W / 80} height={b.y1 - b.y0 + W / 80} rx={W / 160} />
                      {k === 0 && (
                        <>
                          <circle cx={b.x0 - W / 160} cy={b.y0 - W / 160} r={W / 45} />
                          <text x={b.x0 - W / 160} y={b.y0 - W / 160} fontSize={W / 32} textAnchor="middle" dominantBaseline="central">{i + 1}</text>
                        </>
                      )}
                    </g>
                  )),
                )}
              {sel && <rect className="lettura__sel" x={Math.min(sel.x0, sel.x1) * W} y={Math.min(sel.y0, sel.y1) * H} width={Math.abs(sel.x1 - sel.x0) * W} height={Math.abs(sel.y1 - sel.y0) * H} />}
            </svg>
          )}
          {ritaglio && !sel && <div className="lettura__guida">Trascina un rettangolo intorno a nomi e date</div>}
        </div>
        <div className="lettura__strumenti">
          <button type="button" className={`btn btn--sm ${ritaglio ? 'btn--primary' : ''}`} disabled={leggendo} onClick={() => setRitaglio(!ritaglio)}>
            <Crop size={14} />
            {ritaglio ? 'Annulla selezione' : 'Seleziona la scritta'}
          </button>
          {area && (
            <button type="button" className="btn btn--sm" disabled={leggendo} onClick={() => { setArea(null); void leggi(null); }}>
              <Maximize size={14} />
              Tutta la foto
            </button>
          )}
          {onFoto && (
            <button
              type="button"
              className="btn btn--sm"
              disabled={leggendo || ruotando}
              onClick={async () => {
                setRuotando(true);
                try {
                  onFoto(await ruotaFoto(foto));
                } finally {
                  setRuotando(false);
                }
              }}
            >
              <RotateCw size={14} />
              Ruota
            </button>
          )}
          <button type="button" className="btn btn--sm btn--ghost" disabled={leggendo} onClick={() => void leggi(area)}>
            <RefreshCw size={14} />
            Rileggi
          </button>
        </div>
      </div>

      <div className="lettura__esito">
        {leggendo && (
          <div className="lettura__stato">
            <div className="row gap-8">
              <span className="spinner" />
              <b>{stato.testo}</b>
              {stato.p !== null && <span className="muted">{Math.round(stato.p * 100)}%</span>}
            </div>
            <Progress value={stato.p === null ? 8 : 8 + stato.p * 92} small />
            <span className="small muted">La prima volta scarica il modello della lingua italiana (circa 5 MB); poi funziona anche senza connessione.</span>
          </div>
        )}

        {stato.fase === 'errore' && (
          <div className="callout callout--danger">
            <TriangleAlert size={16} />
            <div className="col gap-8">
              <span>{stato.msg}</span>
              <button type="button" className="btn btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => void leggi(area)}>
                <RefreshCw size={14} />
                Riprova
              </button>
            </div>
          </div>
        )}

        {stato.fase === 'fatto' && (
          <>
            <div className="lettura__titolo">
              <h3>
                <ScanText size={18} />
                Dati letti dalla lapide
              </h3>
              <span className="small muted">
                {voci.length === 1 ? '1 defunto' : `${voci.length} defunti`}
                {daControllare > 0 ? ` · ${daControllare} ${daControllare === 1 ? 'dato' : 'dati'} da controllare` : voci.length ? ' · tutto leggibile' : ''}
              </span>
            </div>

            {voci.length === 0 && (
              <div className="callout callout--warn">
                <TriangleAlert size={16} />
                <div>
                  <b>Non ho trovato nomi o date.</b> Prova a selezionare solo la scritta, a fotografarla più da vicino e dritta, evitando riflessi e ombre. Oppure compila a mano.
                </div>
              </div>
            )}

            {famiglia && (
              <div className="small">
                Sulla lapide: <span className="badge badge--blu">Famiglia {famiglia}</span>
              </div>
            )}

            {voci.map((v, i) => (
              <div key={v.id} className="lettura__voce">
                <div className="lettura__voce-head">
                  <span className="lettura__n">{i + 1}</span>
                  <b className="grow">{[v.nome, v.cognome].filter(Boolean).join(' ') || 'Defunto'}</b>
                  <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Togli questo defunto" title="Togli" onClick={() => setVoci(voci.filter((x) => x.id !== v.id))}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid-form">
                  <Field label="Nome" hint={aff(v.aff.nome, !!v.nome)}>
                    <input className={`input ${cls(v.aff.nome, !!v.nome)}`} value={v.nome} onChange={(e) => set(v.id, { nome: e.target.value }, 'nome')} />
                  </Field>
                  <Field label="Cognome" hint={aff(v.aff.cognome, !!v.cognome)}>
                    <input className={`input ${cls(v.aff.cognome, !!v.cognome)}`} value={v.cognome} onChange={(e) => set(v.id, { cognome: e.target.value }, 'cognome')} />
                  </Field>
                  <Field label="Data di nascita" hint={!v.dataNascita && v.annoNascita ? `Sulla lapide solo l'anno ${v.annoNascita}: va nelle note` : aff(v.aff.dataNascita, !!v.dataNascita)}>
                    <input className={`input ${cls(v.aff.dataNascita, !!v.dataNascita)}`} type="date" max={oggiISO()} value={v.dataNascita ?? ''} onChange={(e) => set(v.id, { dataNascita: e.target.value || null }, 'dataNascita')} />
                  </Field>
                  <Field label="Data di morte" hint={!v.dataMorte && v.annoMorte ? `Sulla lapide solo l'anno ${v.annoMorte}: va nelle note` : aff(v.aff.dataMorte, !!v.dataMorte)}>
                    <input className={`input ${cls(v.aff.dataMorte, !!v.dataMorte)}`} type="date" max={oggiISO()} value={v.dataMorte ?? ''} onChange={(e) => set(v.id, { dataMorte: e.target.value || null }, 'dataMorte')} />
                  </Field>
                </div>
                <div className="row row--between row--wrap gap-8">
                  <div className={`seg seg--sm seg--light ${v.sesso && v.aff.sesso !== 'ok' && v.aff.sesso !== 'alta' ? 'lettura__seg-dubbio' : ''}`}>
                    {(['M', 'F'] as const).map((x) => (
                      <button key={x} type="button" className={v.sesso === x ? 'is-on' : ''} onClick={() => set(v.id, { sesso: x }, 'sesso')}>
                        {x === 'M' ? 'Uomo' : 'Donna'}
                      </button>
                    ))}
                  </div>
                  <div className="row row--wrap gap-4">
                    {v.coniuge && <span className="badge badge--sm badge--outline">{v.coniuge}</span>}
                    {v.eta !== undefined && <span className="badge badge--sm badge--outline">di anni {v.eta}</span>}
                    {v.corretti.map((c) => (
                      <span key={c} className="badge badge--sm badge--giallo" title="Parola corretta rispetto al testo letto">
                        Corretto: {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => setVoci([...voci, { ...vuota(), cognome: famiglia ?? voci[0]?.cognome ?? '' }])}>
              <Plus size={15} />
              Aggiungi un defunto
            </button>

            {doppi.length > 0 && (
              <div className="callout callout--warn">
                <TriangleAlert size={16} />
                <div className="col gap-4">
                  <b>Forse è già censito</b>
                  {doppi.map(({ voce, scheda, d }) => (
                    <span key={`${voce.id}-${scheda.id}`}>
                      {[d.nome, d.cognome].filter(Boolean).join(' ')}
                      {d.dataMorte ? ` (morto/a il ${data(d.dataMorte)})` : ''} è nella scheda{' '}
                      <a href={href(`/scheda/${scheda.id}`)} target="_blank" rel="noreferrer" className="strong">
                        {scheda.id}
                      </a>{' '}
                      · {descrizioneScheda(scheda)}, {scheda.viale}
                    </span>
                  ))}
                  <span className="small">Se è la stessa postazione, aggiorna quella scheda invece di crearne una nuova.</span>
                </div>
              </div>
            )}

            {righe.length > 0 && (
              <details className="lettura__testo">
                <summary>Testo letto dalla foto · {righe.length} {righe.length === 1 ? 'riga' : 'righe'}</summary>
                <ol>
                  {righe.map((r, i) => (
                    <li key={i}>
                      <span>{r.testo}</span>
                      <span className="muted small">{Math.round(r.conf)}%</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <div className="lettura__azioni">
              <button type="button" className="btn btn--primary" disabled={!voci.length} onClick={() => onUsa(esitoDa(voci, famiglia))}>
                <Check size={16} />
                {testoUsa}
              </button>
              {onSalta && (
                <button type="button" className="btn btn--ghost" onClick={onSalta}>
                  {testoSalta}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function valore(v: Voce, k: CampoLetto) {
  return k === 'sesso' ? v.sesso : v[k];
}

function cls(a: Affidabilita | 'ok', pieno: boolean) {
  if (!pieno || a === 'ok' || a === 'alta') return '';
  return a === 'bassa' ? 'lettura__in--bassa' : 'lettura__in--media';
}

/** Sotto il campo compare qualcosa solo se c'è da guardare: i dati letti bene non fanno rumore. */
function aff(a: Affidabilita | 'ok', pieno: boolean) {
  if (!pieno) return <span className="muted">Non trovato sulla lapide</span>;
  if (a === 'ok' || a === 'alta') return undefined;
  return <span className={`lettura__aff lettura__aff--${a}`}>{a === 'media' ? 'Da verificare' : 'Lettura incerta: controlla'}</span>;
}
