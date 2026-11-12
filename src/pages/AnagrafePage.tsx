import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { resetFiltri, useStore } from '../data/store';
import { statoConcessione, useSchedeCimitero } from '../data/selectors';
import type { Scheda } from '../data/types';
import { data, normalizza, numero } from '../lib/format';
import { vai } from '../router';


export function AnagrafePage() {
  const schede = useSchedeCimitero();
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Concessionari</h1>
        </div>
      </div>
      <Concessionari schede={schede} />
    </div>
  );
}

function Concessionari({ schede }: { schede: Scheda[] }) {
  const config = useStore((s) => s.config);
  const [q, setQ] = useState('');
  const pag = config.campi.find((c) => c.id === 'stato_pagamenti');
  const gruppi = useMemo(() => {
    const m = new Map<string, Scheda[]>();
    for (const s of schede) {
      const n = s.concessione?.intestatario;
      if (!n) continue;
      const l = m.get(n);
      if (l) l.push(s);
      else m.set(n, [s]);
    }
    return [...m.entries()].map(([nome, lista]) => {
      const prossima = lista.map((s) => s.concessione!.dataScadenza).sort()[0];
      const morosi = lista.filter((s) => s.campi.stato_pagamenti === 'moroso').length;
      return { nome, lista, prossima, morosi, lampade: lista.filter((s) => s.campi.lampada_votiva === true).length, scadute: lista.filter((s) => statoConcessione(s)?.stato === 'scaduta').length };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [schede]);
  const t = normalizza(q);
  const lista = gruppi.filter((g) => !t || normalizza(g.nome).includes(t)).slice(0, 300);
  return (
    <section className="card">
      <div className="card__head">
        <div className="input-icon" style={{ flex: '1 1 260px', maxWidth: 380 }}>
          <Search size={16} />
          <input className="input" placeholder="Cerca concessionario" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="small muted">{numero(gruppi.length)} intestatari · {numero(gruppi.reduce((t2, g) => t2 + g.morosi, 0))} posizioni morose</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Concessionario</th><th className="num">Concessioni</th><th>Prossima scadenza</th><th className="num">Lampade votive</th><th>{pag?.label ?? 'Pagamenti'}</th><th /></tr></thead>
          <tbody>
            {lista.map((g) => (
              <tr key={g.nome}>
                <td><b>{g.nome}</b><div className="tiny muted">{g.lista.slice(0, 3).map((s) => s.id).join(', ')}{g.lista.length > 3 ? '…' : ''}</div></td>
                <td className="num">{g.lista.length}</td>
                <td className="nowrap">{data(g.prossima)} {g.scadute > 0 && <span className="badge badge--rosso badge--sm">{g.scadute} scadute</span>}</td>
                <td className="num">{g.lampade}</td>
                <td>{g.morosi ? <span className="badge badge--rosso badge--sm">Moroso ({g.morosi})</span> : <span className="badge badge--verde badge--sm">Regolare</span>}</td>
                <td><button className="btn btn--xs" onClick={() => { resetFiltri({ nominativo: g.nome }); vai('/ricerca'); }}>Schede</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
