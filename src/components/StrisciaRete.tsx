import { useState } from 'react';
import { CloudOff, ClipboardCheck, MapPinPlus, Wrench } from 'lucide-react';
import { useSenzaRete, useStore } from '../data/store';
import { dataOra, plurale } from '../lib/format';
import { Modal } from './ui';

const ICONE = { rilievo: MapPinPlus, manutenzione: Wrench, verifica: ClipboardCheck } as const;

/** Etichetta "Da inviare" sulle cose fatte senza rete e non ancora arrivate all'ufficio. */
export function DaInviare({ riferimento }: { riferimento: string }) {
  const c = useStore((s) => s.db.daInviare.some((x) => x.riferimento === riferimento));
  return c ? <span className="badge badge--sm badge--arancio"><CloudOff size={11} />Da inviare</span> : null;
}

/** Striscia in alto quando manca la rete: dice quante modifiche aspettano di essere inviate all'ufficio. */
export function StrisciaRete() {
  const senzaRete = useSenzaRete();
  const daInviare = useStore((s) => s.db.daInviare);
  const [elenco, setElenco] = useState(false);
  if (!senzaRete) return null;
  return (
    <>
      <div className="striscia-rete" role="status">
        <CloudOff size={16} />
        <b>Senza rete</b>
        <span className="grow">Puoi continuare a lavorare: la mappa è in Planimetria.</span>
        {daInviare.length > 0 && (
          <button className="btn btn--xs" onClick={() => setElenco(true)}>{daInviare.length} da inviare</button>
        )}
      </div>
      {elenco && (
        <Modal titolo="Da inviare" sottotitolo="Partono da sole quando torna la rete." onClose={() => setElenco(false)}>
          <div className="col gap-8">
            {daInviare.map((x) => {
              const Icona = ICONE[x.tipo];
              return (
                <div key={x.id} className="mini-row">
                  <Icona size={15} />
                  <span className="grow"><b>{x.descrizione}</b></span>
                  <span className="tiny muted nowrap">{dataOra(x.data)}</span>
                </div>
              );
            })}
            {!daInviare.length && <p className="small muted">Niente da inviare.</p>}
            <p className="small muted">{daInviare.length} {plurale(daInviare.length, 'modifica', 'modifiche')} in attesa.</p>
          </div>
        </Modal>
      )}
    </>
  );
}
