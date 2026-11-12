import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, Grid3x3, MapPin, Plus, RotateCcw, ScanText } from 'lucide-react';
import { LocationPicker } from '../components/map/LocationPicker';
import { LetturaLapide, type EsitoLettura } from '../components/rilievo/LetturaLapide';
import { InputCampo } from '../components/scheda/Campi';
import { ScegliFoto } from '../components/scheda/Media';
import { EditorDefunti } from '../components/scheda/SchedaForm';
import { Dot, Field, Icona, Switch } from '../components/ui';
import {
  aggiornaScheda, aggiungiFoto, apriParete, creaScheda, creaStruttura, firmaCorrente, loculiPerStruttura, prossimoId, seleziona, toast, useStore,
} from '../data/store';
import { campiPer, descrizioneScheda, statoDef, tipologiaDef, useCimitero, useDatiCimitero } from '../data/selectors';
import type { Defunto, Faccia, LatLng, Scheda, ValoreCampo } from '../data/types';
import { decedutoDa, nomeCompleto } from '../lib/format';
import { quadranteDi, vialePiuVicino } from '../lib/geo';
import { precaricaMotore } from '../lib/ocr';
import { riduciFoto } from '../lib/photo';
import { href, vai } from '../router';

const PASSI = ['Foto', 'Posizione', 'Classificazione', 'Anagrafica', 'Flag e dati', 'Riepilogo'];

interface Bozza {
  /** Foto in alta risoluzione per la lettura della lapide; si riduce al salvataggio. */
  foto: string | null;
  /** Anagrafica compilata dalla lettura della foto. */
  daFoto: boolean;
  pos: LatLng;
  tipologia: string;
  stato: string;
  defunti: Defunto[];
  viale: string;
  area: string;
  numeroPosto: string;
  nomeManufatto: string;
  facce: Faccia[];
  campi: Record<string, ValoreCampo>;
  note: string;
}

export function RilievoPage() {
  const cim = useCimitero();
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const { viali, quadranti, strutture } = useDatiCimitero();
  const ultimo = useMemo(() => [...db.schede].filter((s) => s.cimiteroId === cim.id && !s.posizione).sort((a, b) => b.rilevatoIl.localeCompare(a.rilevatoIl))[0], [db.schede, cim.id]);
  const iniziale = (): Bozza => ({
    foto: null,
    daFoto: false,
    pos: ultimo ? [ultimo.lat, ultimo.lng] : cim.puntoPartenza,
    tipologia: 'tomba',
    stato: 'occupato',
    defunti: [{ nome: '', cognome: '', dataNascita: null, dataMorte: null }],
    viale: '',
    area: '',
    numeroPosto: '',
    nomeManufatto: '',
    facce: [{ nome: 'Parete sinistra', righe: 3, colonne: 2 }, { nome: 'Parete destra', righe: 3, colonne: 2 }],
    campi: {},
    note: '',
  });
  const [b, setB] = useState<Bozza>(iniziale);
  const [passo, setPasso] = useState(0);
  const [inStruttura, setInStruttura] = useState(false);
  const [str, setStr] = useState('');
  const [cella, setCella] = useState({ faccia: 0, fila: 1, colonna: 1 });
  const [salvata, setSalvata] = useState<Scheda | null>(null);
  const [salvando, setSalvando] = useState(false);
  // ultima lettura della lapide, anche se l'operatore non ha ancora premuto "Usa questi dati"
  const esitoFoto = useRef<EsitoLettura | null>(null);
  const letturaRifiutata = useRef(false);
  const set = (p: Partial<Bozza>) => setB((x) => ({ ...x, ...p }));

  // il motore di lettura si scarica mentre l'operatore inquadra la lapide
  useEffect(() => {
    const t = window.setTimeout(precaricaMotore, 1200);
    return () => window.clearTimeout(t);
  }, []);

  const nuovaFoto = (f: string) => {
    esitoFoto.current = null;
    letturaRifiutata.current = false;
    set({ foto: f, daFoto: false });
  };

  const applicaLettura = (e: EsitoLettura) => {
    setB((x) => ({
      ...x,
      defunti: e.defunti.length ? e.defunti : x.defunti,
      daFoto: e.defunti.length > 0,
      stato: e.defunti.length && x.stato === 'libero' ? 'occupato' : x.stato,
      note: [x.note, ...e.note.filter((n) => !x.note.includes(n))].filter(Boolean).join('\n'),
      nomeManufatto: x.nomeManufatto || (e.famiglia ? `Cappella Fam. ${e.famiglia}` : ''),
    }));
  };
  const tip = tipologiaDef(config, b.tipologia);
  const contenitore = !!config.tipologie.find((t) => t.id === b.tipologia)?.contenitore;
  const vialeAuto = vialePiuVicino(b.pos, viali);
  const q = quadranteDi(b.pos, quadranti);
  const campiApp = campiPer(config, b.tipologia, (c) => c.inApp);
  const id = prossimoId(cim.id, db);
  const strutturaScelta = strutture.find((s) => s.id === str);
  const loculoEsistente = strutturaScelta ? (loculiPerStruttura(db.schede).get(strutturaScelta.id) ?? []).find((l) => l.posizione!.faccia === cella.faccia && l.posizione!.fila === cella.fila && l.posizione!.colonna === cella.colonna) : undefined;

  const valido = () => {
    if (passo === 3 && !contenitore && b.tipologia !== 'vuota' && b.tipologia !== 'in_costruzione' && b.stato !== 'libero') {
      if (!b.defunti.some((d) => d.cognome.trim() || d.nome.trim())) return 'Inserisci almeno il cognome del defunto, oppure segna il posto come Libero';
    }
    if (passo === 2 && contenitore && !b.nomeManufatto.trim()) return 'Dai un nome alla struttura';
    if (passo === 4) {
      const mancanti = campiApp.filter((c) => c.obbligatorio && (b.campi[c.id] === undefined || b.campi[c.id] === null || b.campi[c.id] === ''));
      if (mancanti.length) return `Compila: ${mancanti.map((c) => c.label).join(', ')}`;
    }
    return null;
  };

  const avanti = () => {
    const err = valido();
    if (err) return toast(err, 'errore');
    // dalla foto si va avanti anche senza "Usa questi dati": la lettura non va persa
    if (passo === 0 && b.foto && !b.daFoto && !letturaRifiutata.current && esitoFoto.current?.defunti.length) {
      applicaLettura(esitoFoto.current);
      toast('Anagrafica compilata dalla foto: la controlli al passo 4');
    }
    setPasso((p) => Math.min(PASSI.length - 1, p + 1));
  };

  const salva = async () => {
    if (salvando) return;
    setSalvando(true);
    let fotoId: string | undefined;
    try {
      fotoId = b.foto ? aggiungiFoto(await riduciFoto(b.foto)) : undefined;
    } catch {
      toast('Foto non salvata: potrai aggiungerla dalla scheda', 'errore');
    }
    setSalvando(false);
    const viale = b.viale || vialeAuto;
    if (contenitore) {
      const st = creaStruttura({ cimiteroId: cim.id, tipo: b.tipologia === 'colombaio' ? 'colombaio' : 'cappella', nome: b.nomeManufatto.trim(), lat: b.pos[0], lng: b.pos[1], facce: b.facce, viale, quadranteId: q?.id ?? null });
      const s = useStore.getState().db.schede.find((x) => x.id === st.schedaId)!;
      aggiornaScheda(s.id, { fotoId, stato: b.stato, campi: { ...s.campi, ...b.campi } }, 'Dati del rilievo sul campo');
      setSalvata(s);
    } else {
      const defunti = b.stato === 'libero' || b.tipologia === 'vuota' || b.tipologia === 'in_costruzione' ? [] : b.defunti.filter((d) => d.cognome.trim() || d.nome.trim());
      const s = creaScheda({
        cimiteroId: cim.id, tipologia: b.tipologia, stato: b.stato, lat: b.pos[0], lng: b.pos[1], viale, quadranteId: q?.id ?? null,
        defunti, concessione: null, campi: { ...b.campi, tomba_singola: b.campi.tomba_singola ?? (defunti.length === 1 && b.tipologia === 'tomba') },
        rilevatoDa: firmaCorrente(), area: b.area || undefined, numeroPosto: b.numeroPosto || undefined, note: b.note || undefined, fotoId,
      });
      if (b.daFoto && defunti.length) aggiornaScheda(s.id, {}, 'Anagrafica letta dalla foto della lapide e controllata');
      setSalvata(s);
    }
    toast('Scheda salvata');
  };

  if (salvata)
    return (
      <div className="page rilievo">
        <div className="card rilievo__ok">
          <CheckCircle2 size={44} color="#3F9A3C" />
          <h1>Scheda salvata</h1>
          <div className="qr-big">
            <div className="qr-big__id">{salvata.id}</div>
            <div className="muted">{descrizioneScheda(salvata)} · {salvata.viale}</div>
          </div>
          <div className="row gap-8 row--wrap" style={{ justifyContent: 'center' }}>
            <button className="btn btn--success btn--lg" onClick={() => { const p = b.pos; esitoFoto.current = null; setB({ ...iniziale(), pos: p }); setPasso(0); setSalvata(null); }}><Plus size={18} />Rilievo successivo</button>
            <button className="btn btn--lg" onClick={() => { vai('/mappa'); seleziona(salvata.id, { vola: true }); }}><MapPin size={18} />Vedi sulla mappa</button>
            {salvata.strutturaId && <button className="btn btn--lg" onClick={() => apriParete(salvata.strutturaId!)}><Grid3x3 size={18} />Griglia a parete</button>}
          </div>
          <p className="small muted">Il rilievo successivo riparte da questa posizione, come sul campo.</p>
        </div>
      </div>
    );

  return (
    <div className="page rilievo">
      <div className="rilievo__head">
        <div>
          <h1>Nuovo rilievo</h1>
          <p className="muted">{cim.nome} · la scheda riceverà l'ID <b className="mono" style={{ color: '#0A2F55' }}>{id}</b></p>
        </div>
        <button className="btn btn--sm btn--ghost" onClick={() => { esitoFoto.current = null; setB(iniziale()); setPasso(0); }}><RotateCcw size={14} />Ricomincia</button>
      </div>
      <ol className="passi">
        {PASSI.map((p, i) => (
          <li key={p} className={i === passo ? 'is-on' : i < passo ? 'is-done' : ''}>
            <button onClick={() => i < passo && setPasso(i)} disabled={i > passo}>
              <span className="passi__n">{i < passo ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
              <span className="passi__l">{p}</span>
            </button>
          </li>
        ))}
      </ol>

      <section className="card rilievo__card">
        {/* resta montato negli altri passi, così tornando indietro la lettura non riparte da capo */}
        <div className="col gap-16" style={passo === 0 ? undefined : { display: 'none' }}>
          <h2>Fotografa la lapide</h2>
          <p className="muted small">
            Inquadra la lapide intera, dritta e senza riflessi. CimiTera legge nomi e date e prepara l'anagrafica: tu controlli e confermi. Sul telefono si apre direttamente la fotocamera.
          </p>
          {b.foto ? (
            <>
              <LetturaLapide
                foto={b.foto}
                cimiteroId={cim.id}
                onFoto={nuovaFoto}
                onEsito={(e) => (esitoFoto.current = e)}
                onUsa={(e) => {
                  applicaLettura(e);
                  setPasso(1);
                  toast('Anagrafica compilata dalla foto: la controlli al passo 4');
                }}
                onSalta={() => {
                  letturaRifiutata.current = true;
                  set({ daFoto: false });
                  setPasso(1);
                }}
                testoUsa="Usa questi dati e continua"
              />
              <ScegliFoto className="btn" lato={2000} onFoto={nuovaFoto}><Camera size={16} />Scatta di nuovo</ScegliFoto>
            </>
          ) : (
            <ScegliFoto className="drop drop--big" lato={2000} onFoto={nuovaFoto}>
              <Camera size={34} />
              <div className="strong mt-8">Scatta o carica la foto</div>
              <div className="small">Nomi e date vengono letti in automatico · JPG o PNG</div>
            </ScegliFoto>
          )}
        </div>

        {passo === 1 && (
          <div className="col gap-16">
            <h2>Posizione GPS</h2>
            <p className="muted small">Il punto parte dal GPS del telefono (o dall'ultimo rilievo). Se serve, sposta la mappa finché il segnaposto non è sulla postazione, come nelle app di consegna.</p>
            <LocationPicker cimitero={cim} valore={b.pos} onChange={(p) => set({ pos: p })} altezza={380} />
            <div className="row row--wrap gap-8 small">
              <span className="badge badge--blu">Viale più vicino: {vialeAuto || '—'}</span>
              {q && <span className="badge" style={{ background: `${q.colore}18`, color: q.colore }}>{q.nome}</span>}
            </div>
            <label className="row small" style={{ cursor: 'pointer' }}>
              <Switch small on={inStruttura} onChange={setInStruttura} />
              La postazione è un loculo dentro un colombaio o una cappella già censiti
            </label>
            {inStruttura && (
              <div className="callout">
                <div className="col gap-8 grow">
                  <div className="grid-form grid-form--3">
                    <Field label="Struttura" className="span-all">
                      <select className="select" value={str} onChange={(e) => { setStr(e.target.value); setCella({ faccia: 0, fila: 1, colonna: 1 }); }}>
                        <option value="">Scegli…</option>
                        {strutture.map((s) => <option key={s.id} value={s.id}>{s.nome} · {s.viale}</option>)}
                      </select>
                    </Field>
                    {strutturaScelta && (
                      <>
                        <Field label="Parete"><select className="select" value={cella.faccia} onChange={(e) => setCella({ ...cella, faccia: Number(e.target.value) })}>{strutturaScelta.facce.map((f, i) => <option key={i} value={i}>{f.nome}</option>)}</select></Field>
                        <Field label="Fila (dal basso)"><input className="input" type="number" min={1} max={strutturaScelta.facce[cella.faccia].righe} value={cella.fila} onChange={(e) => setCella({ ...cella, fila: Number(e.target.value) })} /></Field>
                        <Field label="Colonna"><input className="input" type="number" min={1} max={strutturaScelta.facce[cella.faccia].colonne} value={cella.colonna} onChange={(e) => setCella({ ...cella, colonna: Number(e.target.value) })} /></Field>
                      </>
                    )}
                  </div>
                  {loculoEsistente && (
                    <div className="row row--between row--wrap gap-8">
                      <span className="small">Questo posto ha già la scheda <b>{loculoEsistente.id}</b> ({descrizioneScheda(loculoEsistente)}): aggiornala direttamente.</span>
                      <div className="row gap-4">
                        <a className="btn btn--sm btn--primary" href={href(`/scheda/${loculoEsistente.id}`)}>Apri e aggiorna</a>
                        <button className="btn btn--sm" onClick={() => apriParete(strutturaScelta!.id, loculoEsistente.id)}><Grid3x3 size={14} />Griglia</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {passo === 2 && (
          <div className="col gap-16">
            <h2>Classificazione</h2>
            <div className="tip-grid">
              {config.tipologie.filter((t) => !t.archiviata).map((t) => (
                <button key={t.id} className={`tip-card ${b.tipologia === t.id ? 'is-on' : ''}`} onClick={() => set({ tipologia: t.id, stato: t.id === 'vuota' ? 'libero' : t.id === 'in_costruzione' ? 'inaccessibile' : b.stato })} style={{ ['--c' as string]: t.colore }}>
                  <Icona nome={t.icona} size={26} />
                  <b>{t.label}</b>
                </button>
              ))}
            </div>
            <Field label="Stato della postazione">
              <div className="stati-picker">
                {config.stati.filter((s) => !s.archiviato).map((s) => (
                  <button key={s.id} className={`stato-opt ${b.stato === s.id ? 'is-on' : ''}`} onClick={() => set({ stato: s.id })}><Dot colore={s.colore} />{s.label}</button>
                ))}
              </div>
            </Field>
            {contenitore && (
              <div className="col gap-12">
                <Field label={`Nome ${b.tipologia === 'cappella' ? 'della cappella' : 'del colombaio'}`}>
                  <input className="input" value={b.nomeManufatto} placeholder={b.tipologia === 'cappella' ? 'Cappella Fam. …' : 'Colombario …'} onChange={(e) => set({ nomeManufatto: e.target.value })} />
                </Field>
                <Field label="Pareti con loculi" hint="Per ogni parete: file (dal basso) e colonne. Le schede dei loculi vengono create libere.">
                  <div className="col gap-8">
                    {b.facce.map((f, i) => (
                      <div key={i} className="row gap-8 row--wrap">
                        <input className="input input--sm" style={{ flex: '2 1 140px' }} value={f.nome} onChange={(e) => set({ facce: b.facce.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} />
                        <label className="row gap-4 small">File<input className="input input--sm" type="number" min={1} max={12} style={{ width: 62 }} value={f.righe} onChange={(e) => set({ facce: b.facce.map((x, j) => (j === i ? { ...x, righe: Math.max(1, Number(e.target.value)) } : x)) })} /></label>
                        <label className="row gap-4 small">Colonne<input className="input input--sm" type="number" min={1} max={60} style={{ width: 68 }} value={f.colonne} onChange={(e) => set({ facce: b.facce.map((x, j) => (j === i ? { ...x, colonne: Math.max(1, Number(e.target.value)) } : x)) })} /></label>
                      </div>
                    ))}
                    {b.facce.length < 3 && <button className="btn btn--sm" onClick={() => set({ facce: [...b.facce, { nome: 'Parete di fondo', righe: 3, colonne: 2 }] })}><Plus size={14} />Aggiungi parete</button>}
                  </div>
                </Field>
              </div>
            )}
          </div>
        )}

        {passo === 3 && (
          <div className="col gap-16">
            <h2>Anagrafica e ubicazione</h2>
            {contenitore || b.tipologia === 'vuota' || b.tipologia === 'in_costruzione' || b.stato === 'libero' ? (
              <p className="callout">Per {b.stato === 'libero' ? 'un posto libero' : `una ${tip.label.toLowerCase()}`} non servono dati anagrafici{contenitore ? ': i defunti si registrano poi nei singoli loculi.' : '.'}</p>
            ) : (
              <>
                {b.daFoto && (
                  <div className="callout callout--ok">
                    <ScanText size={16} />
                    <div className="grow">Nomi e date sono stati letti dalla foto della lapide. Controllali prima di salvare.</div>
                    <button className="btn btn--xs" onClick={() => setPasso(0)}>Rivedi la lettura</button>
                  </div>
                )}
                <EditorDefunti defunti={b.defunti} onChange={(d) => set({ defunti: d })} />
                {b.defunti.filter((d) => d.dataMorte).map((d, i) => <span key={i} className="badge badge--blu">{nomeCompleto(d)}: {decedutoDa(d)}</span>)}
              </>
            )}
            <div className="grid-form">
              <Field label="Via / viale" hint={`Proposto dal GPS: ${vialeAuto || '—'}`}>
                <select className="select" value={b.viale || vialeAuto} onChange={(e) => set({ viale: e.target.value })}>
                  {viali.map((v) => <option key={v.id} value={v.nome}>{v.nome}</option>)}
                </select>
              </Field>
              <Field label="Quadrante"><input className="input" value={q?.nome ?? 'Fuori dai quadranti'} readOnly /></Field>
              {!contenitore && (
                <>
                  <Field label="Area / campo"><input className="input" value={b.area} onChange={(e) => set({ area: e.target.value })} placeholder="es. Campo 9" /></Field>
                  <Field label="Posto"><input className="input" value={b.numeroPosto} onChange={(e) => set({ numeroPosto: e.target.value })} placeholder="es. Fila 3 · n. 12" /></Field>
                </>
              )}
            </div>
          </div>
        )}

        {passo === 4 && (
          <div className="col gap-16">
            <h2>Flag e informazioni aggiuntive</h2>
            <p className="muted small">Questi campi si configurano in Impostazioni → Scheda Pro (“Visibile nel rilievo”): aggiungere un flag o un menu a tendina lo fa comparire qui.</p>
            {config.sezioni.map((sez) => {
              const cs = campiApp.filter((c) => c.sezione === sez.id);
              if (!cs.length) return null;
              const flag = cs.filter((c) => c.tipo === 'flag');
              const altri = cs.filter((c) => c.tipo !== 'flag');
              return (
                <div key={sez.id} className="col gap-8">
                  <div className="upper muted">{sez.label}</div>
                  {flag.length > 0 && <div className="row row--wrap gap-8">{flag.map((c) => <InputCampo key={c.id} campo={c} valore={b.campi[c.id]} onChange={(v) => set({ campi: { ...b.campi, [c.id]: v } })} />)}</div>}
                  {altri.length > 0 && (
                    <div className="grid-form">
                      {altri.map((c) => (
                        <Field key={c.id} label={c.label} req={c.obbligatorio} hint={c.aiuto}>
                          <InputCampo campo={c} valore={b.campi[c.id]} onChange={(v) => set({ campi: { ...b.campi, [c.id]: v } })} />
                        </Field>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <Field label="Note"><textarea className="textarea" value={b.note} onChange={(e) => set({ note: e.target.value })} placeholder="Annotazioni per l'ufficio" /></Field>
          </div>
        )}

        {passo === 5 && (
          <div className="riepilogo">
            <div className="col gap-12">
              <h2>Riepilogo</h2>
              {b.foto ? <div className="foto"><img src={b.foto} alt="" /></div> : <div className="callout callout--warn">Nessuna foto: potrai aggiungerla dalla scheda.</div>}
              <dl className="kv">
                <dt>ID automatico</dt><dd className="mono">{id}</dd>
                <dt>Tipologia</dt><dd>{tip.label}</dd>
                <dt>Stato</dt><dd><span className="row gap-4"><Dot colore={statoDef(config, b.stato).colore} />{statoDef(config, b.stato).label}</span></dd>
                {contenitore ? (<><dt>Nome</dt><dd>{b.nomeManufatto}</dd><dt>Posti</dt><dd>{b.facce.reduce((t, f) => t + f.righe * f.colonne, 0)} loculi</dd></>) : (
                  <><dt>Defunti</dt><dd>{b.defunti.filter((d) => d.cognome || d.nome).map((d) => nomeCompleto(d)).join(', ') || '—'}</dd></>
                )}
                {b.daFoto && !contenitore && <><dt>Anagrafica</dt><dd><span className="row gap-4"><ScanText size={14} />Letta dalla foto della lapide</span></dd></>}
                <dt>Viale</dt><dd>{b.viale || vialeAuto}</dd>
                <dt>Quadrante</dt><dd>{q?.nome ?? '—'}</dd>
                <dt>GPS</dt><dd className="mono">{b.pos[0].toFixed(6)}, {b.pos[1].toFixed(6)}</dd>
                <dt>Flag</dt><dd>{campiApp.filter((c) => c.tipo === 'flag' && b.campi[c.id] === true).map((c) => c.label).join(', ') || '—'}</dd>
                {b.note && <><dt>Note</dt><dd style={{ whiteSpace: 'pre-line', fontWeight: 600 }}>{b.note}</dd></>}
              </dl>
            </div>
          </div>
        )}
      </section>

      <div className="rilievo__nav">
        <button className="btn btn--lg" disabled={passo === 0} onClick={() => setPasso(passo - 1)}><ArrowLeft size={18} />Indietro</button>
        {passo === 0 && !b.foto && <button className="btn btn--lg btn--ghost" onClick={() => setPasso(1)}>Salta la foto</button>}
        {passo < PASSI.length - 1 ? (
          <button className="btn btn--lg btn--primary" onClick={avanti}>Avanti<ArrowRight size={18} /></button>
        ) : (
          <button className="btn btn--lg btn--success" disabled={salvando} onClick={() => void salva()}><Check size={18} />Salva scheda</button>
        )}
      </div>
    </div>
  );
}
