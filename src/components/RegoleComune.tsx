import { useState } from 'react';
import { Save } from 'lucide-react';
import { NOMI_TIPO_CONCESSIONE, TIPI_CONCESSIONE, salvaRegoleConcessioni } from '../data/concessioni';
import { useStore } from '../data/store';
import type { RegoleComune } from '../data/types';
import { Field } from './ui';

/** Numero intero o con i centesimi in un campo dei moduli. */
export function CampoNumero({ valore, onChange, euro, min = 0 }: { valore: number; onChange: (n: number) => void; euro?: boolean; min?: number }) {
  return (
    <input
      className="input num" type="number" min={min} step={euro ? 0.01 : 1} value={Number.isFinite(valore) ? valore : ''}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
    />
  );
}

/** Riquadro di una voce del menu dentro "Regole del Comune": titolo, campi, Salva quando qualcosa è cambiato. */
export function RiquadroRegole({ titolo, modificato, onSalva, children }: { titolo: string; modificato: boolean; onSalva: () => void; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="card__head">
        <h3>{titolo}</h3>
        <button className="btn btn--sm btn--primary" disabled={!modificato} onClick={onSalva}><Save size={14} />Salva</button>
      </div>
      <div className="card__body col gap-16">
        {children}
        <p className="small muted">Vale per i nuovi contratti e addebiti.</p>
      </div>
    </section>
  );
}

function RegoleConcessioni() {
  const salvate = useStore((s) => s.db.regole.concessioni);
  const [b, setB] = useState<RegoleComune['concessioni']>(salvate);
  const modificato = JSON.stringify(b) !== JSON.stringify(salvate);
  return (
    <RiquadroRegole titolo="Concessioni" modificato={modificato} onSalva={() => salvaRegoleConcessioni(b)}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Tipo di concessione</th><th className="num">Durata (anni)</th><th className="num">Tariffa nuova concessione (€)</th><th className="num">Tariffa rinnovo (€)</th></tr></thead>
          <tbody>
            {TIPI_CONCESSIONE.map((t) => (
              <tr key={t}>
                <td><b>{NOMI_TIPO_CONCESSIONE[t]}</b></td>
                <td style={{ width: 150 }}><CampoNumero min={1} valore={b.durate[t]} onChange={(n) => setB({ ...b, durate: { ...b.durate, [t]: n } })} /></td>
                <td style={{ width: 220 }}><CampoNumero euro valore={b.tariffe[t].nuova} onChange={(n) => setB({ ...b, tariffe: { ...b.tariffe, [t]: { ...b.tariffe[t], nuova: n } } })} /></td>
                <td style={{ width: 200 }}><CampoNumero euro valore={b.tariffe[t].rinnovo} onChange={(n) => setB({ ...b, tariffe: { ...b.tariffe, [t]: { ...b.tariffe[t], rinnovo: n } } })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid-form">
        <Field label="Durata del rinnovo (anni)"><CampoNumero min={1} valore={b.durataRinnovo} onChange={(n) => setB({ ...b, durataRinnovo: n })} /></Field>
        <Field label="Una concessione è “in scadenza” quando mancano (mesi)"><CampoNumero min={1} valore={b.sogliaInScadenzaMesi} onChange={(n) => setB({ ...b, sogliaInScadenzaMesi: n })} /></Field>
      </div>
    </RiquadroRegole>
  );
}

/** Regole del Comune: un riquadro per voce del menu. Le fasi dei modelli aggiungono qui i loro riquadri. */
export function RegoleDelComune() {
  return (
    <div className="col gap-16">
      <RegoleConcessioni />
    </div>
  );
}
