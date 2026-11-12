import { useMemo, useState } from 'react';
import { CalendarClock, FileSpreadsheet, FileText, Filter, Lightbulb, QrCode, Sigma } from 'lucide-react';
import { registraEsportazione, useStore } from '../data/store';
import { contaFiltriAttivi, statoConcessione, useCimitero, useSchedeCimitero, useSchedeFiltrate } from '../data/selectors';
import { colonneDisponibili, colonnePredefinite, fogliTotali, righeLampadeVotive, righeSchede, righeScadenze, scaricaExcel } from '../lib/excel';
import { dataOra, numero, oggiISO } from '../lib/format';
import { pdfEtichetteQr, pdfSchede } from '../lib/pdf';
import { href } from '../router';

export function EsportazioniPage() {
  const tutte = useSchedeCimitero();
  const filtrate = useSchedeFiltrate();
  const filtri = useStore((s) => s.filtri);
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const foto = useStore((s) => s.foto);
  const cim = useCimitero();
  const colonne = useMemo(() => colonneDisponibili(config), [config]);
  const [scelte, setScelte] = useState<Set<string>>(() => new Set(colonnePredefinite(config)));
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

  const fisse = colonne.filter((c) => !c.id.startsWith('campo:'));
  const dinamiche = colonne.filter((c) => c.id.startsWith('campo:'));
  const toggle = (id: string) => setScelte((s) => { const x = new Set(s); x.has(id) ? x.delete(id) : x.add(id); return x; });

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
        <section className="card export-card export-card--wide">
          <div className="export-card__head">
            <span className="export-card__ico" style={{ background: '#eef6e7', color: '#3F9A3C' }}><FileSpreadsheet size={22} /></span>
            <div className="grow">
              <h3>Excel delle schede filtrate</h3>
              <p className="small muted">Scegli le colonne. I campi personalizzati della Scheda Pro compaiono automaticamente.</p>
            </div>
            <button className="btn btn--success" disabled={!!lavoro || !scelte.size} onClick={() => esegui('Excel schede', filtrate.length, () => scaricaExcel(`${base}_schede_${oggi}`, [{ nome: 'Schede', righe: righeSchede(filtrate, colonne.filter((c) => scelte.has(c.id)), ctx) }]))}>
              Scarica ({numero(filtrate.length)})
            </button>
          </div>
          <div className="colonne">
            <div>
              <div className="upper muted">Dati della scheda</div>
              <div className="colonne__list">
                {fisse.map((c) => (
                  <label key={c.id} className="colonna"><input type="checkbox" className="check" checked={scelte.has(c.id)} onChange={() => toggle(c.id)} />{c.label}</label>
                ))}
              </div>
            </div>
            <div>
              <div className="upper muted">Campi personalizzati</div>
              <div className="colonne__list">
                {dinamiche.map((c) => (
                  <label key={c.id} className="colonna"><input type="checkbox" className="check" checked={scelte.has(c.id)} onChange={() => toggle(c.id)} />{c.label}</label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ExportCard icona={<Lightbulb size={22} />} colore="#B8860B" titolo="Lampade votive per la fatturazione" testo="Un clic: utenze con codice, intestatario, canone e stato pagamenti, totale in fondo e foglio dei morosi."
          bottone="Scarica Excel" disabilitato={!!lavoro}
          onClick={() => {
            const l = filtrate.filter((s) => s.campi.lampada_votiva === true);
            esegui('Excel lampade votive', l.length, () => scaricaExcel(`${base}_lampade_votive_${oggi}`, [{ nome: 'Lampade votive', righe: righeLampadeVotive(l, ctx) }, { nome: 'Morosi', righe: righeLampadeVotive(l.filter((s) => s.campi.stato_pagamenti === 'moroso'), ctx) }]));
          }} />

        <ExportCard icona={<Sigma size={22} />} colore="#1B5A8F" titolo="Excel dei totali" testo="Riepiloghi per quadrante, stato, tipologia e viale delle schede filtrate."
          bottone="Scarica Excel" disabilitato={!!lavoro}
          onClick={() => esegui('Excel totali', filtrate.length, () => scaricaExcel(`${base}_totali_${oggi}`, fogliTotali(filtrate, ctx)))} />

        <ExportCard icona={<CalendarClock size={22} />} colore="#8E5BB5" titolo="Scadenze concessioni" testo="Concessioni scadute o in scadenza nei prossimi 6 mesi, ordinate per data."
          bottone="Scarica Excel" disabilitato={!!lavoro}
          onClick={() => {
            const l = filtrate.filter((s) => { const c = statoConcessione(s); return c && c.stato !== 'valida'; });
            esegui('Excel scadenze', l.length, () => scaricaExcel(`${base}_scadenze_${oggi}`, [{ nome: 'Scadenze', righe: righeScadenze(l, ctx) }]));
          }} />

        <ExportCard icona={<FileText size={22} />} colore="#D9473F" titolo="PDF multiplo delle schede" testo="Una pagina per scheda con foto, dati, concessione, campi personalizzati e QR."
          bottone={lavoro?.startsWith('PDF') ? lavoro : `Genera PDF (${numero(filtrate.length)})`} disabilitato={!!lavoro || !filtrate.length}
          onClick={() => {
            if (filtrate.length > 150 && !confirm(`Il PDF avrà ${filtrate.length} pagine e potrebbe richiedere qualche minuto. Continuare?`)) return;
            esegui('PDF schede', filtrate.length, () => pdfSchede(filtrate, { config, db, foto }, (k) => setLavoro(`PDF ${Math.round((k / filtrate.length) * 100)}%`), `${base}_schede_${oggi}.pdf`));
          }} />

        <ExportCard icona={<QrCode size={22} />} colore="#0A2F55" titolo="Etichette QR" testo="Foglio A4 da 24 etichette (3 × 8) con QR, ID, nominativo e viale, per la carta adesiva."
          bottone={`Genera etichette (${numero(filtrate.length)})`} disabilitato={!!lavoro || !filtrate.length}
          onClick={() => esegui('Etichette QR', filtrate.length, () => pdfEtichetteQr(filtrate))} />
      </div>

      <section className="card mt-16">
        <div className="card__head"><h3>Esportazioni recenti</h3></div>
        <div className="list">
          {db.esportazioni.length === 0 && <p className="small muted" style={{ padding: 16 }}>Ancora nessuna esportazione in questa sessione.</p>}
          {db.esportazioni.map((e, i) => (
            <div key={i} className="list-item"><span className="grow"><b>{e.tipo}</b></span><span className="small muted">{numero(e.righe)} righe · {dataOra(e.data)}</span></div>
          ))}
        </div>
      </section>
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
