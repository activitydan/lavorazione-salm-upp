import { RotateCcw, Search, X } from 'lucide-react';
import { resetFiltri, setFiltri, useStore } from '../data/store';
import { campiPer, contaFiltriAttivi, useDatiCimitero } from '../data/selectors';
import type { CampoDef, FiltroCampo } from '../data/types';
import { numero } from '../lib/format';
import { Dot, Field, Icona, Seg } from './ui';

function toggle(lista: string[], v: string) {
  return lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v];
}

function FiltroCampoDinamico({ campo }: { campo: CampoDef }) {
  const v = useStore((s) => s.filtri.campi[campo.id]);
  const set = (nv: FiltroCampo | undefined) =>
    setFiltri((f) => {
      const campi = { ...f.campi };
      if (nv === undefined) delete campi[campo.id];
      else campi[campo.id] = nv;
      return { campi };
    });
  switch (campo.tipo) {
    case 'flag':
      return (
        <div className="filtro-flag">
          <span className="row gap-4 small strong">{campo.icona && <Icona nome={campo.icona} size={14} />}{campo.label}</span>
          <Seg small light value={(v as string) ?? 'tutti'} onChange={(x) => set(x === 'tutti' ? undefined : x)}
            options={[{ id: 'tutti', label: 'Tutti' }, { id: 'si', label: 'Sì' }, { id: 'no', label: 'No' }]} />
        </div>
      );
    case 'select':
    case 'multiselect': {
      const sel = Array.isArray(v) ? v : [];
      return (
        <Field label={campo.label}>
          <div className="row row--wrap gap-4">
            {(campo.opzioni ?? []).filter((o) => !o.archiviata).map((o) => (
              <button key={o.id} className={`chip chip--sm ${sel.includes(o.id) ? 'is-on' : ''}`} onClick={() => { const n = toggle(sel, o.id); set(n.length ? n : undefined); }}>
                {o.colore && <Dot colore={o.colore} />}
                {o.label}
              </button>
            ))}
          </div>
        </Field>
      );
    }
    case 'numero':
    case 'importo': {
      const r = (v as { min?: number; max?: number }) ?? {};
      const upd = (patch: { min?: number; max?: number }) => {
        const n = { ...r, ...patch };
        set(n.min === undefined && n.max === undefined ? undefined : n);
      };
      return (
        <Field label={campo.label}>
          <div className="row">
            <input className="input input--sm" type="number" placeholder="da" value={r.min ?? ''} onChange={(e) => upd({ min: e.target.value === '' ? undefined : Number(e.target.value) })} />
            <input className="input input--sm" type="number" placeholder="a" value={r.max ?? ''} onChange={(e) => upd({ max: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
        </Field>
      );
    }
    case 'data': {
      const r = (v as { da?: string; a?: string }) ?? {};
      const upd = (patch: { da?: string; a?: string }) => {
        const n = { ...r, ...patch };
        set(!n.da && !n.a ? undefined : n);
      };
      return (
        <Field label={campo.label}>
          <div className="row">
            <input className="input input--sm" type="date" value={r.da ?? ''} onChange={(e) => upd({ da: e.target.value || undefined })} />
            <input className="input input--sm" type="date" value={r.a ?? ''} onChange={(e) => upd({ a: e.target.value || undefined })} />
          </div>
        </Field>
      );
    }
    default:
      return (
        <Field label={campo.label}>
          <input className="input input--sm" value={(v as string) ?? ''} onChange={(e) => set(e.target.value || undefined)} />
        </Field>
      );
  }
}

export function FilterPanel({ risultati, totale, onChiudi }: { risultati: number; totale: number; onChiudi?: () => void }) {
  const f = useStore((s) => s.filtri);
  const config = useStore((s) => s.config);
  const { quadranti, viali } = useDatiCimitero();
  const n = contaFiltriAttivi(f);
  const dinamici = campiPer(config, undefined, (c) => c.inFiltri);
  const flag = dinamici.filter((c) => c.tipo === 'flag');
  const altri = dinamici.filter((c) => c.tipo !== 'flag');

  return (
    <div className="filtri">
      <div className="filtri__head">
        <div>
          <h3>Filtri di ricerca</h3>
          <p className="small muted">
            <b className="mono" style={{ color: 'var(--text)' }}>{numero(risultati)}</b> di {numero(totale)} schede
          </p>
        </div>
        <div className="row gap-4">
          {n > 0 && (
            <button className="btn btn--sm btn--ghost" onClick={() => resetFiltri()} title="Azzera tutti i filtri">
              <RotateCcw size={14} /> Azzera ({n})
            </button>
          )}
          {onChiudi && <button className="btn btn--sm btn--ghost btn--icon" onClick={onChiudi} aria-label="Chiudi filtri"><X size={16} /></button>}
        </div>
      </div>
      <div className="filtri__body">
        <div className="grid-form">
          <Field label="Nominativo" className="span-2">
            <div className="input-icon">
              <Search size={15} />
              <input className="input input--sm" placeholder="Nome e/o cognome" value={f.nominativo} onChange={(e) => setFiltri({ nominativo: e.target.value })} />
            </div>
          </Field>
          <Field label="ID scheda" className="span-2">
            <input className="input input--sm" placeholder="es. CIM-RAG-001245" value={f.id} onChange={(e) => setFiltri({ id: e.target.value })} />
          </Field>
          <Field label="Data di morte · dal">
            <input className="input input--sm" type="date" value={f.dataMorteDa} onChange={(e) => setFiltri({ dataMorteDa: e.target.value })} />
          </Field>
          <Field label="al">
            <input className="input input--sm" type="date" value={f.dataMorteA} onChange={(e) => setFiltri({ dataMorteA: e.target.value })} />
          </Field>
        </div>

        <Field label="Stato">
          <div className="row row--wrap gap-4">
            {config.stati.filter((s) => !s.archiviato).map((s) => (
              <button key={s.id} className={`chip chip--sm ${f.stati.includes(s.id) ? 'is-on' : ''}`} onClick={() => setFiltri({ stati: toggle(f.stati, s.id) })}>
                <Dot colore={s.colore} />
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        {flag.length > 0 && (
          <div className="col gap-4">
            <span className="field__label">Flag</span>
            {flag.map((c) => <FiltroCampoDinamico key={c.id} campo={c} />)}
          </div>
        )}

        <Field label="Quadrante">
          <div className="row row--wrap gap-4">
            {quadranti.map((q) => (
              <button key={q.id} className={`chip chip--sm ${f.quadranti.includes(q.id) ? 'is-on' : ''}`} onClick={() => setFiltri({ quadranti: toggle(f.quadranti, q.id) })} title={q.nome}>
                <Dot colore={q.colore} />
                {q.codice}
                <span className="muted" style={{ fontWeight: 600 }}>{q.nome.split('·')[1]?.trim()}</span>
              </button>
            ))}
            {!quadranti.length && <span className="small muted">Nessun quadrante definito</span>}
          </div>
        </Field>

        <Field label="Tipologia">
          <div className="row row--wrap gap-4">
            {config.tipologie.filter((t) => !t.archiviata).map((t) => (
              <button key={t.id} className={`chip chip--sm ${f.tipologie.includes(t.id) ? 'is-on' : ''}`} onClick={() => setFiltri({ tipologie: toggle(f.tipologie, t.id) })}>
                <Icona nome={t.icona} size={13} color={t.colore} />
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Colombari e cappelle">
          <Seg small light value={f.strutture} onChange={(v) => setFiltri({ strutture: v })}
            options={[{ id: 'tutte', label: 'Tutto' }, { id: 'colombari', label: 'Colombari' }, { id: 'cappelle', label: 'Cappelle' }]} />
        </Field>

        <Field label="Concessione">
          <Seg small light value={f.concessione} onChange={(v) => setFiltri({ concessione: v })}
            options={[{ id: 'tutte', label: 'Tutte' }, { id: 'in_scadenza', label: 'Entro 6 mesi' }, { id: 'scadute', label: 'Scadute' }, { id: 'senza', label: 'Senza' }]} />
        </Field>

        <Field label="Lampada votiva">
          <Seg small light value={f.lampada} onChange={(v) => setFiltri({ lampada: v })}
            options={[{ id: 'tutte', label: 'Tutte' }, { id: 'si', label: 'Con lampada' }, { id: 'no', label: 'Senza' }]} />
        </Field>

        <Field label="Via / viale">
          <select className="select select--sm" value="" onChange={(e) => e.target.value && setFiltri({ viali: toggle(f.viali, e.target.value) })}>
            <option value="">Aggiungi un viale…</option>
            {viali.filter((v) => !f.viali.includes(v.nome)).map((v) => <option key={v.id} value={v.nome}>{v.nome}</option>)}
          </select>
          {f.viali.length > 0 && (
            <div className="row row--wrap gap-4">
              {f.viali.map((v) => (
                <button key={v} className="chip chip--sm is-on" onClick={() => setFiltri({ viali: toggle(f.viali, v) })}>{v}<X size={12} /></button>
              ))}
            </div>
          )}
        </Field>

        {altri.map((c) => <FiltroCampoDinamico key={c.id} campo={c} />)}

      </div>
    </div>
  );
}
