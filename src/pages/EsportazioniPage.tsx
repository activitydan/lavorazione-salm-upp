import { useState } from 'react';
import { CalendarClock, Filter, Lightbulb } from 'lucide-react';
import { registraEsportazione, useStore } from '../data/store';
import { contaFiltriAttivi, statoConcessione, useCimitero, useSchedeCimitero, useSchedeFiltrate } from '../data/selectors';
import { righeLampadeVotive, righeScadenze, scaricaExcel } from '../lib/excel';
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
        <ExportCard icona={<Lightbulb size={22} />} colore="#B8860B" titolo="Lampade votive per la fatturazione" testo="Un clic: utenze con codice, intestatario, canone e stato pagamenti, totale in fondo e foglio dei morosi."
          bottone="Scarica Excel" disabilitato={!!lavoro}
          onClick={() => {
            const l = filtrate.filter((s) => s.campi.lampada_votiva === true);
            esegui('Excel lampade votive', l.length, () => scaricaExcel(`${base}_lampade_votive_${oggi}`, [{ nome: 'Lampade votive', righe: righeLampadeVotive(l, ctx) }, { nome: 'Morosi', righe: righeLampadeVotive(l.filter((s) => s.campi.stato_pagamenti === 'moroso'), ctx) }]));
          }} />

        <ExportCard icona={<CalendarClock size={22} />} colore="#8E5BB5" titolo="Scadenze concessioni" testo="Concessioni scadute o in scadenza nei prossimi 6 mesi, ordinate per data."
          bottone="Scarica Excel" disabilitato={!!lavoro}
          onClick={() => {
            const l = filtrate.filter((s) => { const c = statoConcessione(s); return c && c.stato !== 'valida'; });
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
