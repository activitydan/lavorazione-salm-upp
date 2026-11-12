import { useState } from 'react';
import { Plus, Save, ScanText, Trash2, X } from 'lucide-react';
import { aggiornaScheda, aggiungiFoto, toast, useStore } from '../../data/store';
import { campiPer } from '../../data/selectors';
import type { Defunto, Scheda } from '../../data/types';
import { decedutoDa, oggiISO } from '../../lib/format';
import { chiave } from '../../lib/lapide';
import { riduciFoto } from '../../lib/photo';
import { LetturaLapide, type EsitoLettura } from '../rilievo/LetturaLapide';
import { Field } from '../ui';
import { InputCampo } from './Campi';
import { ScegliFoto } from './Media';

export function EditorDefunti({ defunti, onChange }: { defunti: Defunto[]; onChange: (d: Defunto[]) => void }) {
  const set = (i: number, patch: Partial<Defunto>) => onChange(defunti.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <div className="col gap-12">
      {defunti.map((d, i) => (
        <div key={i} className="defunto-edit">
          <div className="grid-form">
            <Field label="Nome"><input className="input" value={d.nome} onChange={(e) => set(i, { nome: e.target.value })} /></Field>
            <Field label="Cognome"><input className="input" value={d.cognome} onChange={(e) => set(i, { cognome: e.target.value })} /></Field>
            <Field label="Data di nascita"><input className="input" type="date" value={d.dataNascita ?? ''} onChange={(e) => set(i, { dataNascita: e.target.value || null })} /></Field>
            <Field label="Data di morte" hint={decedutoDa(d) ?? undefined}>
              <input className="input" type="date" max={oggiISO()} value={d.dataMorte ?? ''} onChange={(e) => set(i, { dataMorte: e.target.value || null })} />
            </Field>
          </div>
          <div className="row row--between mt-8">
            <div className="seg seg--sm seg--light">
              {(['M', 'F'] as const).map((x) => (
                <button key={x} type="button" className={d.sesso === x ? 'is-on' : ''} onClick={() => set(i, { sesso: x })}>{x === 'M' ? 'Uomo' : 'Donna'}</button>
              ))}
            </div>
            <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => onChange(defunti.filter((_, j) => j !== i))}>
              <Trash2 size={14} /> Rimuovi
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn--sm" onClick={() => onChange([...defunti, { nome: '', cognome: defunti[0]?.cognome ?? '', dataNascita: null, dataMorte: null }])}>
        <Plus size={15} /> Aggiungi defunto
      </button>
    </div>
  );
}

export function SchedaForm({ s, onChiudi }: { s: Scheda; onChiudi: () => void }) {
  const config = useStore((st) => st.config);
  const viali = useStore((st) => st.db.viali).filter((v) => v.cimiteroId === s.cimiteroId);
  const quadranti = useStore((st) => st.db.quadranti).filter((q) => q.cimiteroId === s.cimiteroId);
  const [b, setB] = useState<Scheda>(() => structuredClone(s));
  const set = (patch: Partial<Scheda>) => setB((x) => ({ ...x, ...patch }));
  const campi = campiPer(config, b.tipologia);
  const archivioFoto = useStore((st) => st.foto);
  // lettura della lapide: sulla foto della scheda o su una nuova, in alta risoluzione
  const [lettura, setLettura] = useState<string | null>(null);
  const [daFoto, setDaFoto] = useState(false);
  const fotoScheda = b.fotoId ? archivioFoto[b.fotoId] : undefined;

  const nuovaFotoLapide = async (f: string) => {
    set({ fotoId: aggiungiFoto(await riduciFoto(f)) });
    setLettura(f);
  };

  /** I defunti letti si aggiungono a quelli già in scheda; se c'è già lo stesso nome si completano solo i dati mancanti. */
  const inserisciLettura = (e: EsitoLettura) => {
    const k = (d: Defunto) => `${chiave(d.nome)}|${chiave(d.cognome)}`;
    const out = b.defunti.filter((d) => d.nome.trim() || d.cognome.trim() || d.dataMorte || d.dataNascita);
    for (const n of e.defunti) {
      const i = out.findIndex((d) => k(d) === k(n));
      if (i >= 0) out[i] = { ...out[i], dataNascita: out[i].dataNascita || n.dataNascita, dataMorte: out[i].dataMorte || n.dataMorte, sesso: out[i].sesso ?? n.sesso };
      else out.push(n);
    }
    const note = [b.note ?? '', ...e.note.filter((n) => !(b.note ?? '').includes(n))].filter(Boolean).join('\n');
    set({ defunti: out, note: note || undefined, stato: out.length && b.stato === 'libero' ? 'occupato' : b.stato });
    setDaFoto(true);
    setLettura(null);
    toast('Dati della lapide inseriti: controllali e salva la scheda');
  };

  const salva = () => {
    const mancanti = campi.filter((c) => c.obbligatorio && (b.campi[c.id] === undefined || b.campi[c.id] === null || b.campi[c.id] === ''));
    if (mancanti.length) {
      toast(`Compila: ${mancanti.map((c) => c.label).join(', ')}`, 'errore');
      return;
    }
    const cambiati: string[] = [];
    if (b.tipologia !== s.tipologia) cambiati.push('tipologia');
    if (b.stato !== s.stato) cambiati.push('stato');
    if (JSON.stringify(b.defunti) !== JSON.stringify(s.defunti)) cambiati.push(daFoto ? 'defunti (letti dalla foto della lapide)' : 'defunti');
    if (b.fotoId !== s.fotoId) cambiati.push('foto');
    if (b.viale !== s.viale || b.quadranteId !== s.quadranteId) cambiati.push('ubicazione');
    for (const c of config.campi) if (JSON.stringify(b.campi[c.id]) !== JSON.stringify(s.campi[c.id])) cambiati.push(c.label.toLowerCase());
    if ((b.note ?? '') !== (s.note ?? '')) cambiati.push('note');
    aggiornaScheda(s.id, b, cambiati.length ? `Modificati: ${cambiati.join(', ')}` : 'Scheda salvata');
    toast('Scheda aggiornata');
    onChiudi();
  };

  return (
    <div className="scheda-form">
      <div className="row row--between">
        <h3>Modifica {s.id}</h3>
        <button className="btn btn--ghost btn--icon btn--sm" onClick={onChiudi} aria-label="Annulla"><X size={18} /></button>
      </div>

      <section className="sez">
        <h4 className="sez__t">Classificazione</h4>
        <div className="grid-form">
          <Field label="Tipologia">
            <select className="select" value={b.tipologia} onChange={(e) => set({ tipologia: e.target.value })}>
              {config.tipologie.filter((t) => !t.archiviata || t.id === b.tipologia).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Stato">
            <select className="select" value={b.stato} onChange={(e) => set({ stato: e.target.value })}>
              {config.stati.filter((t) => !t.archiviato || t.id === b.stato).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          {(b.nomeManufatto !== undefined || b.strutturaId) && (
            <Field label="Nome della postazione" className="span-2">
              <input className="input" value={b.nomeManufatto ?? ''} onChange={(e) => set({ nomeManufatto: e.target.value })} />
            </Field>
          )}
        </div>
      </section>

      {!b.strutturaId && (
        <section className="sez">
          <h4 className="sez__t">
            Anagrafica
            {!lettura &&
              (fotoScheda ? (
                <button type="button" className="btn btn--xs" onClick={() => setLettura(fotoScheda)}>
                  <ScanText size={13} />
                  Leggi dalla foto
                </button>
              ) : (
                <ScegliFoto className="btn btn--xs" lato={2000} onFoto={(f) => void nuovaFotoLapide(f)}>
                  <ScanText size={13} />
                  Fotografa la lapide
                </ScegliFoto>
              ))}
          </h4>
          {lettura && (
            <div className="sez__lettura">
              <LetturaLapide foto={lettura} cimiteroId={s.cimiteroId} schedaId={s.id} onUsa={inserisciLettura} onSalta={() => setLettura(null)} testoUsa="Inserisci nella scheda" testoSalta="Chiudi" />
            </div>
          )}
          <EditorDefunti defunti={b.defunti} onChange={(d) => set({ defunti: d })} />
        </section>
      )}

      <section className="sez">
        <h4 className="sez__t">Ubicazione</h4>
        <div className="grid-form">
          <Field label="Via / viale">
            <select className="select" value={b.viale} onChange={(e) => set({ viale: e.target.value })}>
              {!viali.some((v) => v.nome === b.viale) && <option value={b.viale}>{b.viale || '—'}</option>}
              {viali.map((v) => <option key={v.id} value={v.nome}>{v.nome}</option>)}
            </select>
          </Field>
          <Field label="Quadrante">
            <select className="select" value={b.quadranteId ?? ''} onChange={(e) => set({ quadranteId: e.target.value || null })}>
              <option value="">—</option>
              {quadranti.map((q) => <option key={q.id} value={q.id}>{q.nome}</option>)}
            </select>
          </Field>
          {!b.posizione && (
            <>
              <Field label="Area"><input className="input" value={b.area ?? ''} onChange={(e) => set({ area: e.target.value })} /></Field>
              <Field label="Posto"><input className="input" value={b.numeroPosto ?? ''} onChange={(e) => set({ numeroPosto: e.target.value })} /></Field>
            </>
          )}
        </div>
      </section>

      {config.sezioni.map((sez) => {
        const cs = campi.filter((c) => c.sezione === sez.id);
        if (!cs.length) return null;
        const soloFlag = cs.every((c) => c.tipo === 'flag');
        return (
          <section className="sez" key={sez.id}>
            <h4 className="sez__t">{sez.label}</h4>
            {soloFlag ? (
              <div className="row row--wrap gap-4">
                {cs.map((c) => <InputCampo key={c.id} campo={c} valore={b.campi[c.id]} onChange={(v) => set({ campi: { ...b.campi, [c.id]: v } })} />)}
              </div>
            ) : (
              <div className="grid-form">
                {cs.map((c) => (
                  <Field key={c.id} label={c.label} req={c.obbligatorio} hint={c.aiuto} className={c.tipo === 'testo_lungo' || c.tipo === 'multiselect' ? 'span-2' : ''}>
                    <InputCampo campo={c} valore={b.campi[c.id]} onChange={(v) => set({ campi: { ...b.campi, [c.id]: v } })} />
                  </Field>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="sez">
        <h4 className="sez__t">Note</h4>
        <textarea className="textarea" value={b.note ?? ''} onChange={(e) => set({ note: e.target.value })} placeholder="Annotazioni per l'ufficio" />
      </section>

      <div className="scheda-form__foot">
        <button className="btn" onClick={onChiudi}>Annulla</button>
        <button className="btn btn--primary" onClick={salva}><Save size={16} />Salva scheda</button>
      </div>
    </div>
  );
}
