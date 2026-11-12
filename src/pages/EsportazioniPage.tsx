import { useState } from 'react';
import { CalendarClock, Filter } from 'lucide-react';
import { registraEsportazione, useStore } from '../data/store';
import { concessioneScheda, contaFiltriAttivi, statoConcessione, useCimitero, useSchedeCimitero, useSchedeFiltrate } from '../data/selectors';
import { righeScadenze, scaricaExcel } from '../lib/excel';
import { numero, oggiISO } from '../lib/format';
import { href } from '../router';

export function EsportazioniPage() {
  const tutte = useSchedeCimitero();
  const filtrate = useSchedeFiltrate();
  const filtri = useStore((s) => s.filtri);
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const cim = useCimitero();
  const [lavoro, setLavoro] = useState<string | null>(null);
  const n = contaFiltriAttivi(filtri);
  const ctx = { config, db };
  const oggi = oggiISO();
  const base = `CimiTera_${cim?.codice ?? ''}`;

  const esegui = async (tipo: string, righe: number, fn: () => void | Promise<void>) => {
    setLavoro(tipo);
    try {
      await fn();
      registraEsportazione(tipo, righe);
    } finally {
      setLavoro(null);
    }
  };


  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Esportazioni</h1>
        </div>
      </div>

      <div className={`callout ${n ? '' : 'callout--warn'}`}>
        <Filter size={18} />
        <div className="grow">
          {n ? <><b>{n} filtri attivi</b>: le esportazioni “filtrate” includono <b>{numero(filtrate.length)}</b> schede su {numero(tutte.length)}.</> : <>Nessun filtro attivo: le esportazioni includono <b>tutte le {numero(tutte.length)} schede</b>. Imposta i filtri in Ricerca o sulla Mappa.</>}
        </div>
        <a className="btn btn--sm" href={href('/ricerca')}>Modifica filtri</a>
      </div>

      <div className="export-grid mt-16">
        <ExportCard icona={<CalendarClock size={22} />} colore="#8E5BB5" titolo="Scadenze concessioni" testo="Concessioni scadute o in scadenza nei prossimi 6 mesi, ordinate per data."
          bottone="Scarica Excel" disabilitato={!!lavoro}
          onClick={() => {
            const viste = new Set<string>();
            const l = filtrate.filter((s) => { const c = statoConcessione(s); const v = concessioneScheda(s); if (!c || !v || c.stato === 'valida' || viste.has(v.id)) return false; viste.add(v.id); return true; });
            esegui('Excel scadenze', l.length, () => scaricaExcel(`${base}_scadenze_${oggi}`, [{ nome: 'Scadenze', righe: righeScadenze(l, ctx) }]));
          }} />

      </div>
    </div>
  );
}

function ExportCard({ icona, colore, titolo, testo, bottone, onClick, disabilitato }: { icona: React.ReactNode; colore: string; titolo: string; testo: string; bottone: string; onClick: () => void; disabilitato?: boolean }) {
  return (
    <section className="card export-card">
      <span className="export-card__ico" style={{ background: `${colore}16`, color: colore }}>{icona}</span>
      <h3>{titolo}</h3>
      <p className="small muted grow">{testo}</p>
      <button className="btn" onClick={onClick} disabled={disabilitato}>{bottone}</button>
    </section>
  );
}
