import { useState } from 'react';
import { Save } from 'lucide-react';
import { NOMI_TIPO_CONCESSIONE, TIPI_CONCESSIONE, salvaRegoleConcessioni } from '../data/concessioni';
import { NOMI_OPERAZIONE, TIPI_OPERAZIONE, salvaRegoleOperazioni } from '../data/pratiche';
import { useStore } from '../data/store';
import type { RegoleComune } from '../data/types';
import { salvaRegoleIlluminazione } from '../data/utenze';
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

function RegoleIlluminazione() {
  const salvate = useStore((s) => s.db.regole.illuminazione);
  const [b, setB] = useState<RegoleComune['illuminazione']>(salvate);
  const modificato = JSON.stringify(b) !== JSON.stringify(salvate);
  return (
    <RiquadroRegole titolo="Illuminazione votiva" modificato={modificato} onSalva={() => salvaRegoleIlluminazione(b)}>
      <div className="grid-form">
        <Field label="Canone annuo per punto luce (€)"><CampoNumero euro valore={b.canonePuntoLuce} onChange={(n) => setB({ ...b, canonePuntoLuce: n })} /></Field>
        <Field label="Contributo di allaccio (€)"><CampoNumero euro valore={b.allaccio} onChange={(n) => setB({ ...b, allaccio: n })} /></Field>
      </div>
    </RiquadroRegole>
  );
}

function RegoleOperazioni() {
  const turno = useStore((s) => s.db.regole.campoComune);
  const operazioni = useStore((s) => s.db.regole.operazioni);
  const [t, setT] = useState(turno);
  const [o, setO] = useState(operazioni);
  const modificato = JSON.stringify([t, o]) !== JSON.stringify([turno, operazioni]);
  return (
    <>
      <RiquadroRegole titolo="Campo comune" modificato={modificato} onSalva={() => salvaRegoleOperazioni(t, o)}>
        <div className="grid-form">
          <Field label="Turno della fossa in campo comune (anni)" hint="Dopo il turno la fossa si libera con l'esumazione ordinaria">
            <CampoNumero min={1} valore={t.turnoAnni} onChange={(n) => setT({ turnoAnni: n })} />
          </Field>
        </div>
      </RiquadroRegole>
      <RiquadroRegole titolo="Operazioni cimiteriali" modificato={modificato} onSalva={() => salvaRegoleOperazioni(t, o)}>
        <div className="grid-form grid-form--3">
          {TIPI_OPERAZIONE.map((tipo) => (
            <Field key={tipo} label={`${NOMI_OPERAZIONE[tipo]} (€)`}>
              <CampoNumero euro valore={o.tariffe[tipo]} onChange={(n) => setO({ tariffe: { ...o.tariffe, [tipo]: n } })} />
            </Field>
          ))}
        </div>
        <p className="small muted">Le pratiche d'ufficio non hanno tariffa.</p>
      </RiquadroRegole>
    </>
  );
}

/** Regole del Comune: un riquadro per voce del menu. Le fasi dei modelli aggiungono qui i loro riquadri. */
export function RegoleDelComune() {
  return (
    <div className="col gap-16">
      <RegoleConcessioni />
      <RegoleIlluminazione />
      <RegoleOperazioni />
    </div>
  );
}
