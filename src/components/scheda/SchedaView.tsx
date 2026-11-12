import { useState } from 'react';
import { ClipboardCheck, Crosshair, FileText, Grid3x3, History, MapPinned, Navigation, Pencil, Wrench } from 'lucide-react';
import { NOMI_STRUTTURA, STATI_MANUTENZIONE } from '../../config/defaults';
import {
  aggiornaCampo, aggiornaScheda, apriParete, apriModale, indiceSchede, loculiPerStruttura, seleziona, toast, useStore,
} from '../../data/store';
import {
  campiPer, descrizioneScheda, labelLista, occupazioneStruttura, prioritaDef, statoConcessione, statoDef, valoreLeggibile,
} from '../../data/selectors';
import type { Scheda } from '../../data/types';
import { anniVita, data, dataBreve, dataOra, decedutoDa, eta, nomeCompleto } from '../../lib/format';
import { formatCoord, googleMapsIndicazioni } from '../../lib/geo';
import { pdfScheda } from '../../lib/pdf';
import { href, useRotta, vai } from '../../router';
import { Dot, Progress, Switch, TipologiaBadge } from '../ui';
import { InputCampo, ValoreOpzione } from './Campi';
import { FotoScheda } from './Media';
import { SchedaForm } from './SchedaForm';

export function SchedaView({ s, estesa }: { s: Scheda; estesa?: boolean }) {
  const [modifica, setModifica] = useState(false);
  const [pdf, setPdf] = useState(false);
  const sullaMappa = useRotta().path === '/mappa';
  const config = useStore((st) => st.config);
  const db = useStore((st) => st.db);
  const foto = useStore((st) => st.foto);
  const operatore = db.operatori.find((o) => o.id === s.rilevatoDa);
  const quadrante = db.quadranti.find((q) => q.id === s.quadranteId);
  const strId = s.posizione?.strutturaId ?? s.strutturaId;
  const struttura = strId ? db.strutture.find((x) => x.id === strId) : undefined;
  const manutenzioni = db.manutenzioni.filter((m) => m.schedaId === s.id).sort((a, b) => b.segnalataIl.localeCompare(a.segnalataIl));
  const verifiche = db.verifiche.filter((v) => v.schedaId === s.id);
  const conc = statoConcessione(s);
  const flag = campiPer(config, s.tipologia, (c) => c.tipo === 'flag');

  if (modifica) return <SchedaForm s={s} onChiudi={() => setModifica(false)} />;

  const scaricaPdf = async () => {
    setPdf(true);
    try {
      await pdfScheda(s, { config, db, foto });
    } finally {
      setPdf(false);
    }
  };

  const contenitore = s.posizione && struttura ? indiceSchede(db.schede).get(struttura.schedaId) : undefined;

  const colonnaSinistra = (
    <>
      <FotoScheda s={s} />
      <div className="scheda-id">
        <div>
          <div className="scheda-id__code">{s.id}</div>
          <div className="scheda-id__name">{descrizioneScheda(s)}</div>
        </div>
        <TipologiaBadge tipologia={s.tipologia} />
      </div>

      <div className="field">
        <label>Stato della postazione</label>
        <div className="stati-picker">
          {config.stati.filter((x) => !x.archiviato || x.id === s.stato).map((st) => (
            <button
              key={st.id}
              className={`stato-opt ${s.stato === st.id ? 'is-on' : ''}`}
              onClick={() => s.stato !== st.id && aggiornaScheda(s.id, { stato: st.id }, `Stato: ${st.label}`)}
              title={st.descrizione}
            >
              <Dot colore={st.colore} />
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Flag</label>
        <div className="row row--wrap gap-4">
          {flag.map((c) => (
            <InputCampo key={c.id} campo={c} valore={s.campi[c.id]} compatto onChange={(v) => aggiornaCampo(s.id, c.id, v, c.label)} />
          ))}
          <label className="flag-pubblico" title="Se è spento, il Cittadino non trova i defunti di questa scheda">
            <Switch small on={s.visibilePubblico !== false} label="Visibile al pubblico"
              onChange={(v) => aggiornaScheda(s.id, { visibilePubblico: v }, `Visibile al pubblico: ${v ? 'sì' : 'no'}`)} />
            Visibile al pubblico
          </label>
        </div>
      </div>

      <div className="azioni-grid">
        <button className="azione" onClick={() => setModifica(true)}><Pencil size={17} />Modifica</button>
        <button className="azione" onClick={() => apriModale({ tipo: 'gps', schedaId: s.id })}><Crosshair size={17} />Modifica GPS</button>
        <button className="azione" onClick={scaricaPdf} disabled={pdf}>{pdf ? <span className="spinner" /> : <FileText size={17} />}Scheda PDF</button>
        <button className="azione" onClick={() => apriModale({ tipo: 'manutenzione', schedaId: s.id })}><Wrench size={17} />Segnala</button>
        <button className="azione" onClick={() => apriModale({ tipo: 'verifica', schedaId: s.id })}><ClipboardCheck size={17} />Verifica</button>
        <a className="azione" href={googleMapsIndicazioni(s.lat, s.lng)} target="_blank" rel="noreferrer"><Navigation size={17} />Indicazioni</a>
        {!sullaMappa && <button className="azione" onClick={() => { vai('/mappa'); seleziona(s.id, { vola: true }); }}><MapPinned size={17} />Sulla mappa</button>}
      </div>
    </>
  );

  const colonnaDestra = (
    <>
      {s.defunti.length > 0 && (
        <section className="sez">
          <h4 className="sez__t">{s.defunti.length > 1 ? `Defunti (${s.defunti.length})` : 'Defunto'}</h4>
          <div className="col">
            {s.defunti.map((d, i) => (
              <div className="defunto" key={i}>
                <div className="defunto__nome">{nomeCompleto(d)}</div>
                <div className="defunto__date">
                  {data(d.dataNascita)} – {data(d.dataMorte)}
                  {eta(d) !== null && <span className="muted"> · {eta(d)} anni</span>}
                </div>
                {decedutoDa(d) && <span className="badge badge--blu badge--sm">{decedutoDa(d)}</span>}
                {!d.dataMorte && <span className="badge badge--giallo badge--sm">Data di morte da recuperare</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {s.strutturaId && struttura && <RiepilogoStruttura strutturaId={struttura.id} />}

      <section className="sez">
        <h4 className="sez__t">Ubicazione</h4>
        <dl className="kv">
          <dt>Via / viale</dt>
          <dd>{s.viale || '—'}</dd>
          <dt>Quadrante</dt>
          <dd>{quadrante ? <span className="row gap-4" style={{ display: 'inline-flex' }}><Dot colore={quadrante.colore} />{quadrante.nome}</span> : '—'}</dd>
          {s.area && (<><dt>Area</dt><dd>{s.area}{s.numeroPosto ? ` · ${s.numeroPosto}` : ''}</dd></>)}
          {struttura && s.posizione && (
            <>
              <dt>Struttura</dt>
              <dd>
                {contenitore ? <a href={href(`/scheda/${contenitore.id}`)}>{struttura.nome}</a> : struttura.nome}
                <div className="small muted">{struttura.facce[s.posizione.faccia]?.nome} · fila {s.posizione.fila} · colonna {s.posizione.colonna}</div>
                <button className="btn btn--xs mt-8" onClick={() => apriParete(struttura.id, s.id)}><Grid3x3 size={12} />Vedi nella griglia a parete</button>
              </dd>
            </>
          )}
          <dt>Coordinate GPS</dt>
          <dd className="mono">{formatCoord(s.lat, s.lng)}</dd>
        </dl>
      </section>

      {s.concessione && (
        <section className="sez">
          <h4 className="sez__t">
            Concessione
            {conc?.stato === 'scaduta' && <span className="badge badge--rosso badge--sm">Scaduta da {Math.abs(conc.giorni)} giorni</span>}
            {conc?.stato === 'in_scadenza' && <span className="badge badge--arancio badge--sm">Scade tra {conc.giorni} giorni</span>}
            {conc?.stato === 'valida' && <span className="badge badge--verde badge--sm">Valida</span>}
          </h4>
          <dl className="kv">
            <dt>Numero</dt>
            <dd>{s.concessione.numero}</dd>
            <dt>Concessionario</dt>
            <dd>{s.concessione.intestatario}</dd>
            <dt>Periodo</dt>
            <dd>{data(s.concessione.dataInizio)} → {data(s.concessione.dataScadenza)}</dd>
            <dt>Durata</dt>
            <dd>{s.concessione.durataAnni} anni{s.concessione.rinnovi ? ` · ${s.concessione.rinnovi} rinnovi` : ''}</dd>
          </dl>
        </section>
      )}

      {(manutenzioni.length > 0 || verifiche.length > 0) && (
        <section className="sez">
          <h4 className="sez__t">Manutenzioni e verifiche</h4>
          <div className="col">
            {manutenzioni.map((m) => {
              const st = STATI_MANUTENZIONE.find((x) => x.id === m.stato)!;
              return (
                <a key={m.id} className="mini-row" href={href(`/manutenzioni?id=${m.id}`)}>
                  <Wrench size={15} color={st.colore} />
                  <span className="grow">
                    <b>{labelLista(config.categorieManutenzione, m.categoria)}</b>
                    <span className="small muted"> · {dataBreve(m.segnalataIl)}</span>
                  </span>
                  <span className="badge badge--sm" style={{ background: `${st.colore}1a`, color: st.colore }}>{st.label}</span>
                  {m.stato !== 'risolta' && <span className="badge badge--sm" style={{ color: prioritaDef(m.priorita).colore }}>{prioritaDef(m.priorita).label}</span>}
                </a>
              );
            })}
            {verifiche.map((v) => (
              <a key={v.id} className="mini-row" href={href('/censimento?tab=verifiche')}>
                <ClipboardCheck size={15} color={v.stato === 'aperta' ? '#E9BE1F' : '#3F9A3C'} />
                <span className="grow">
                  <b>{labelLista(config.motiviVerifica, v.motivo)}</b>
                  <span className="small muted"> · {db.operatori.find((o) => o.id === v.operatoreId)?.nome}</span>
                </span>
                <span className={`badge badge--sm ${v.stato === 'aperta' ? 'badge--giallo' : 'badge--verde'}`}>{v.stato === 'aperta' ? `Entro ${dataBreve(v.scadenza)}` : v.esito}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {config.sezioni.filter((z) => z.id !== 'flag').map((sez) => {
        const campi = campiPer(config, s.tipologia, (c) => c.sezione === sez.id);
        if (!campi.length) return null;
        return (
          <section className="sez" key={sez.id}>
            <h4 className="sez__t">{sez.label}</h4>
            <dl className="kv">
              {campi.map((c) => (
                <FragmentKV key={c.id} k={c.label} v={c.tipo === 'select' ? <ValoreOpzione campo={c} valore={s.campi[c.id]} /> : valoreLeggibile(c, s.campi[c.id])} />
              ))}
            </dl>
          </section>
        );
      })}

      {s.note && (
        <section className="sez">
          <h4 className="sez__t">Note</h4>
          <p>{s.note}</p>
        </section>
      )}

      <section className="sez">
        <h4 className="sez__t"><History size={14} /> Storico</h4>
        <ol className="timeline">
          {[...(s.storico ?? [])].reverse().map((e, i) => (
            <li key={i}>
              <b>{e.azione}</b>
              <span className="tiny muted">{dataOra(e.data)} · {e.utente}</span>
            </li>
          ))}
          <li>
            <b>Rilevata sul campo</b>
            <span className="tiny muted">{dataOra(s.rilevatoIl)} · {operatore?.nome ?? s.rilevatoDa}</span>
          </li>
        </ol>
      </section>
    </>
  );

  if (estesa) {
    return (
      <div className="scheda-estesa">
        <div className="scheda-estesa__side">
          {colonnaSinistra}
        </div>
        <div className="scheda-estesa__main">{colonnaDestra}</div>
      </div>
    );
  }
  return (
    <div className="scheda">
      {colonnaSinistra}
      {colonnaDestra}
    </div>
  );
}

function FragmentKV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </>
  );
}

/** Riepilogo delle strutture: occupazione e mini-griglia delle pareti. */
export function RiepilogoStruttura({ strutturaId }: { strutturaId: string }) {
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const st = db.strutture.find((x) => x.id === strutturaId);
  if (!st) return null;
  const occ = occupazioneStruttura(db.schede, strutturaId);
  const loculi = loculiPerStruttura(db.schede).get(strutturaId) ?? [];
  return (
    <section className="sez">
      <h4 className="sez__t">Posti a parete · {NOMI_STRUTTURA[st.tipo]}</h4>
      <div className="row row--between small">
        <span><b>{occ.occupati}</b> occupati · <b>{occ.liberi}</b> liberi su {occ.totale}</span>
        <span className="muted">{st.facce.length} {st.facce.length === 1 ? 'parete' : 'pareti'}</span>
      </div>
      <Progress value={occ.occupati} max={occ.totale} verde small />
      <div className="mini-griglie">
        {st.facce.map((f, fi) => (
          <div key={fi} className="mini-griglia">
            <div className="tiny muted">{f.nome}</div>
            <div className="mini-griglia__cells" style={{ gridTemplateColumns: `repeat(${f.colonne}, 1fr)` }}>
              {Array.from({ length: f.righe }, (_, r) => f.righe - r).flatMap((fila) =>
                Array.from({ length: f.colonne }, (_, c) => {
                  const l = loculi.find((x) => x.posizione!.faccia === fi && x.posizione!.fila === fila && x.posizione!.colonna === c + 1);
                  const col = l ? statoDef(config, l.stato).colore : '#E2E7EE';
                  return (
                    <button
                      key={`${fila}-${c}`}
                      className="mini-cell"
                      style={{ background: col.toUpperCase() === '#FFFFFF' ? '#fff' : col }}
                      title={l ? `${l.id} · ${descrizioneScheda(l)}${l.defunti[0] ? ` (${anniVita(l.defunti[0])})` : ''}` : 'Vuoto'}
                      onClick={() => l && apriParete(strutturaId, l.id)}
                    />
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn--primary btn--sm mt-12" onClick={() => apriParete(strutturaId)}>
        <Grid3x3 size={15} /> Apri la griglia a parete
      </button>
    </section>
  );
}

export function copiaTesto(t: string) {
  navigator.clipboard?.writeText(t).then(() => toast('Copiato negli appunti'));
}
