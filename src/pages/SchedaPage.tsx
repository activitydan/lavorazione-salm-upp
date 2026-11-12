import { useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Map as MapIcon } from 'lucide-react';
import { CemeteryMap } from '../components/map/CemeteryMap';
import { SchedaView } from '../components/scheda/SchedaView';
import { Empty } from '../components/ui';
import { indiceSchede, seleziona, setCimitero, useStore } from '../data/store';
import { useDatiCimitero, useSchedeFiltrate } from '../data/selectors';
import { href, vai } from '../router';

/** Visualizzazione estesa della scheda (anche destinazione del QR per gli operatori). */
export function SchedaPage({ id }: { id: string }) {
  const schede = useStore((s) => s.db.schede);
  const cimiteroId = useStore((s) => s.cimiteroId);
  const cimiteri = useStore((s) => s.db.cimiteri);
  const filtrate = useSchedeFiltrate();
  const { strutture, viali, aree } = useDatiCimitero();
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
  const cim = cimiteri.find((c) => c.id === s.cimiteroId)!;
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
            <p>{cim.nome} · {s.viale}</p>
          </div>
        </div>
        <div className="page-head__actions">
          {i >= 0 && (
            <>
              <a className={`btn ${prec ? '' : 'is-disabled'}`} href={prec ? href(`/scheda/${prec.id}`) : undefined} aria-disabled={!prec}><ChevronLeft size={16} />Precedente</a>
              <a className={`btn ${succ ? '' : 'is-disabled'}`} href={succ ? href(`/scheda/${succ.id}`) : undefined} aria-disabled={!succ}>Successiva<ChevronRight size={16} /></a>
            </>
          )}
          <button className="btn btn--primary" onClick={() => { vai('/mappa'); seleziona(s.id, { vola: true, pannello: false }); }}><MapIcon size={16} />Sulla mappa</button>
        </div>
      </div>
      <SchedaView key={s.id} s={s} estesa />
      <div className="card mt-16" style={{ height: 320, overflow: 'hidden', position: 'relative' }}>
        <CemeteryMap
          key={s.id}
          cimitero={cim}
          schede={[s]}
          strutture={strutture.filter((x) => x.id === s.strutturaId || x.id === s.posizione?.strutturaId)}
          viali={viali}
          aree={aree}
          stile="satellite"
          selezionata={s.id}
          segueVolo={false}
          onReady={(m) => m.setView([s.lat, s.lng], 20)}
        />
      </div>
    </div>
  );
}
