import { useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { SchedaView } from '../components/scheda/SchedaView';
import { Empty } from '../components/ui';
import { indiceSchede, setCimitero, useStore } from '../data/store';
import { useSchedeFiltrate } from '../data/selectors';
import { href, vai } from '../router';

/** Vista estesa della scheda: lo stesso contenuto del pannello laterale, su due colonne. */
export function SchedaPage({ id }: { id: string }) {
  const schede = useStore((s) => s.db.schede);
  const cimiteroId = useStore((s) => s.cimiteroId);
  const filtrate = useSchedeFiltrate();
  const s = indiceSchede(schede).get(id);

  useEffect(() => {
    if (s && s.cimiteroId !== cimiteroId) setCimitero(s.cimiteroId);
  }, [s, cimiteroId]);

  if (!s)
    return (
      <div className="page">
        <Empty titolo={`Scheda ${id} non trovata`} testo="L'ID potrebbe essere errato o la scheda appartiene a un altro archivio." azione={<a className="btn" href={href('/ricerca')}>Vai alla ricerca</a>} />
      </div>
    );
  const i = filtrate.findIndex((x) => x.id === s.id);
  const prec = i > 0 ? filtrate[i - 1] : undefined;
  const succ = i >= 0 && i < filtrate.length - 1 ? filtrate[i + 1] : undefined;

  return (
    <div className="page">
      <div className="page-head">
        <div className="row gap-12">
          <button className="btn btn--icon" onClick={() => history.length > 1 ? history.back() : vai('/ricerca')} aria-label="Indietro"><ArrowLeft size={18} /></button>
          <div className="page-head__title">
            <h1>Scheda {s.id}</h1>
          </div>
        </div>
        <div className="page-head__actions">
          {i >= 0 && (
            <>
              <a className={`btn ${prec ? '' : 'is-disabled'}`} href={prec ? href(`/scheda/${prec.id}`) : undefined} aria-disabled={!prec}><ChevronLeft size={16} />Precedente</a>
              <a className={`btn ${succ ? '' : 'is-disabled'}`} href={succ ? href(`/scheda/${succ.id}`) : undefined} aria-disabled={!succ}>Successiva<ChevronRight size={16} /></a>
            </>
          )}
        </div>
      </div>
      <SchedaView key={s.id} s={s} estesa />
    </div>
  );
}
