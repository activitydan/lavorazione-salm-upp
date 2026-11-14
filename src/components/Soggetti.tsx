import { Plus, Trash2 } from 'lucide-react';
import type { Concessionario, Soggetto } from '../data/types';
import { Field, Seg } from './ui';

export const SOGGETTO_VUOTO: Soggetto = { tipo: 'persona', nome: '', cognome: '', codiceFiscale: '', indirizzo: '' };

/** Controllo minimo prima di salvare: nome (o denominazione), codice fiscale e indirizzo. */
export function soggettoIncompleto(x: Soggetto): string | null {
  if (x.tipo === 'persona' && (!x.nome?.trim() || !x.cognome?.trim())) return 'Scrivi nome e cognome';
  if (x.tipo === 'ente' && !x.denominazione?.trim()) return 'Scrivi la denominazione dell\'ente';
  if (!x.codiceFiscale.trim()) return x.tipo === 'ente' ? 'Scrivi il codice fiscale o la partita IVA' : 'Scrivi il codice fiscale';
  if (!x.indirizzo.trim()) return 'Scrivi l\'indirizzo';
  return null;
}

/** Dati di una persona o di un ente: il tipo va indicato sempre. */
export function SoggettoForm<T extends Soggetto>({ valore, onChange }: { valore: T; onChange: (v: T) => void }) {
  const set = (p: Partial<Soggetto>) => onChange({ ...valore, ...p });
  return (
    <div className="col gap-12">
      <Seg light small value={valore.tipo} onChange={(t) => set({ tipo: t })} options={[{ id: 'persona', label: 'Persona' }, { id: 'ente', label: 'Ente' }]} />
      <div className="grid-form">
        {valore.tipo === 'persona' ? (
          <>
            <Field label="Nome"><input className="input" value={valore.nome ?? ''} onChange={(e) => set({ nome: e.target.value })} /></Field>
            <Field label="Cognome"><input className="input" value={valore.cognome ?? ''} onChange={(e) => set({ cognome: e.target.value })} /></Field>
          </>
        ) : (
          <>
            <Field label="Denominazione"><input className="input" value={valore.denominazione ?? ''} onChange={(e) => set({ denominazione: e.target.value })} /></Field>
            <Field label="Legale rappresentante"><input className="input" value={valore.legaleRappresentante ?? ''} onChange={(e) => set({ legaleRappresentante: e.target.value })} /></Field>
          </>
        )}
        <Field label={valore.tipo === 'ente' ? 'Codice fiscale o partita IVA' : 'Codice fiscale'}>
          <input className="input mono" value={valore.codiceFiscale} onChange={(e) => set({ codiceFiscale: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Indirizzo"><input className="input" value={valore.indirizzo} onChange={(e) => set({ indirizzo: e.target.value })} placeholder="Via e numero, CAP e Comune" /></Field>
        <Field label="Telefono"><input className="input" value={valore.telefono ?? ''} onChange={(e) => set({ telefono: e.target.value })} /></Field>
        <Field label="Email"><input className="input" type="email" value={valore.email ?? ''} onChange={(e) => set({ email: e.target.value })} /></Field>
      </div>
    </div>
  );
}

/** Uno o più concessionari: con più di uno, uno è il rappresentante. */
export function EditorConcessionari({ valore, onChange }: { valore: Concessionario[]; onChange: (v: Concessionario[]) => void }) {
  const set = (i: number, c: Concessionario) => onChange(valore.map((x, j) => (j === i ? c : x)));
  const rappresentante = (i: number) => onChange(valore.map((x, j) => ({ ...x, rappresentante: j === i })));
  return (
    <div className="col gap-12">
      {valore.map((c, i) => (
        <div key={i} className="soggetto">
          <SoggettoForm valore={c} onChange={(v) => set(i, v)} />
          {c.tipo === 'persona' && (
            <div className="grid-form mt-8">
              <Field label="Legame con il defunto" hint="Per esempio: figlio, moglie, erede"><input className="input" value={c.legameDefunto ?? ''} onChange={(e) => set(i, { ...c, legameDefunto: e.target.value || undefined })} /></Field>
            </div>
          )}
          {valore.length > 1 && (
            <div className="row row--between mt-8">
              <label className="row small" style={{ cursor: 'pointer' }}>
                <input type="radio" name="rappresentante" checked={!!c.rappresentante} onChange={() => rappresentante(i)} />
                Rappresentante: tratta con il Comune per conto degli altri
              </label>
              <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => {
                const resto = valore.filter((_, j) => j !== i);
                onChange(resto.length > 1 && !resto.some((x) => x.rappresentante) ? resto.map((x, j) => ({ ...x, rappresentante: j === 0 })) : resto.length === 1 ? [{ ...resto[0], rappresentante: undefined }] : resto);
              }}>
                <Trash2 size={14} /> Togli
              </button>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => onChange([...valore.map((x, j) => ({ ...x, rappresentante: valore.length === 1 ? j === 0 : x.rappresentante })), { ...SOGGETTO_VUOTO }])}>
        <Plus size={15} /> Aggiungi un concessionario
      </button>
    </div>
  );
}
