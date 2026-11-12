import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileSpreadsheet, FileText, Sigma } from 'lucide-react';
import { useStore } from '../data/store';
import { useCimitero } from '../data/selectors';
import type { Scheda } from '../data/types';
import { colonneDisponibili, colonnePredefinite, fogliTotali, righeSchede, scaricaExcel, type Riga } from '../lib/excel';
import { numero, oggiISO } from '../lib/format';
import { pdfSchede } from '../lib/pdf';
import { Modal } from './ui';

/** Barra delle pagine sotto gli elenchi lunghi: 50 righe per pagina. */
export const PER_PAGINA = 50;

export function BarraPagine({ pagina, totale, perPagina = PER_PAGINA, onPagina, etichetta }: {
  pagina: number; totale: number; perPagina?: number; onPagina: (p: number) => void; etichetta?: string;
}) {
  const pagine = Math.max(1, Math.ceil(totale / perPagina));
  const p = Math.min(pagina, pagine - 1);
  const da = totale ? p * perPagina + 1 : 0;
  const a = Math.min(totale, (p + 1) * perPagina);
  return (
    <div className="pager">
      <span className="small muted">{numero(da)}–{numero(a)} di {numero(totale)}{etichetta ? ` ${etichetta}` : ''}</span>
      <div className="row gap-4">
        <button className="btn btn--sm" disabled={p === 0} onClick={() => onPagina(p - 1)}>Precedente</button>
        <span className="small strong">{p + 1} / {pagine}</span>
        <button className="btn btn--sm" disabled={p >= pagine - 1} onClick={() => onPagina(p + 1)}>Successiva</button>
      </div>
    </div>
  );
}

/** Taglia un elenco alla pagina corrente. */
export function paginaDi<T>(lista: T[], pagina: number, perPagina = PER_PAGINA): T[] {
  const pagine = Math.max(1, Math.ceil(lista.length / perPagina));
  const p = Math.min(pagina, pagine - 1);
  return lista.slice(p * perPagina, (p + 1) * perPagina);
}

/**
 * Finestra unica per esportare: Excel (con la scelta delle colonne), PDF delle schede, Excel dei totali.
 * Se arrivano "righeDefunti" l'Excel ha una riga per defunto e le colonne sono fisse.
 */
export function FinestraEsporta({ schede, cosa, righeDefunti, nomeFile = 'ricerca', onChiudi }: {
  schede: Scheda[];
  /** es. "12 schede selezionate" oppure "1.858 risultati" */
  cosa: string;
  righeDefunti?: Riga[];
  nomeFile?: string;
  onChiudi: () => void;
}) {
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const foto = useStore((s) => s.foto);
  const cim = useCimitero();
  const colonne = useMemo(() => colonneDisponibili(config), [config]);
  const [scelte, setScelte] = useState<Set<string>>(() => new Set(colonnePredefinite(config)));
  const [mostraColonne, setMostraColonne] = useState(false);
  const [lavoro, setLavoro] = useState<string | null>(null);
  const ctx = { config, db };
  const base = `CimiTera_${cim?.codice ?? ''}`;
  const oggi = oggiISO();
  const toggle = (id: string) => setScelte((s) => { const x = new Set(s); x.has(id) ? x.delete(id) : x.add(id); return x; });
  const fisse = colonne.filter((c) => !c.id.startsWith('campo:'));
  const dinamiche = colonne.filter((c) => c.id.startsWith('campo:'));

  const excel = () => {
    if (righeDefunti) scaricaExcel(`${base}_defunti_${oggi}`, [{ nome: 'Defunti', righe: righeDefunti }]);
    else scaricaExcel(`${base}_${nomeFile}_${oggi}`, [{ nome: 'Schede', righe: righeSchede(schede, colonne.filter((c) => scelte.has(c.id)), ctx) }]);
    onChiudi();
  };
  const pdf = async () => {
    if (schede.length > 150 && !confirm(`Il PDF avrà ${schede.length} pagine e potrebbe richiedere qualche minuto. Continuare?`)) return;
    setLavoro('PDF 0%');
    try {
      await pdfSchede(schede, { config, db, foto }, (k) => setLavoro(`PDF ${Math.round((k / schede.length) * 100)}%`), `${base}_schede_${oggi}.pdf`);
    } finally {
      setLavoro(null);
    }
    onChiudi();
  };
  const totali = () => {
    scaricaExcel(`${base}_totali_${oggi}`, fogliTotali(schede, ctx));
    onChiudi();
  };

  return (
    <Modal titolo="Esporta" sottotitolo={cosa} onClose={onChiudi} size="lg">
      <div className="esporta">
        <section className="esporta__voce">
          <span className="esporta__ico" style={{ background: '#eef6e7', color: '#3F9A3C' }}><FileSpreadsheet size={20} /></span>
          <div className="grow">
            <b>Excel</b>
            <p className="small muted">{righeDefunti ? `Una riga per defunto: ${numero(righeDefunti.length)} righe.` : `Una riga per scheda: ${numero(schede.length)} righe.`}</p>
            {!righeDefunti && (
              <button className="btn btn--ghost btn--xs" onClick={() => setMostraColonne(!mostraColonne)}>
                {mostraColonne ? <ChevronDown size={14} /> : <ChevronRight size={14} />}Scegli le colonne ({scelte.size})
              </button>
            )}
          </div>
          <button className="btn btn--success" disabled={!!lavoro || (!righeDefunti && !scelte.size)} onClick={excel}>Scarica</button>
        </section>
        {mostraColonne && !righeDefunti && (
          <div className="colonne esporta__colonne">
            <div>
              <div className="upper muted">Dati della scheda</div>
              <div className="colonne__list">
                {fisse.map((c) => (
                  <label key={c.id} className="colonna"><input type="checkbox" className="check" checked={scelte.has(c.id)} onChange={() => toggle(c.id)} />{c.label}</label>
                ))}
              </div>
            </div>
            <div>
              <div className="upper muted">Campi della scheda</div>
              <div className="colonne__list">
                {dinamiche.map((c) => (
                  <label key={c.id} className="colonna"><input type="checkbox" className="check" checked={scelte.has(c.id)} onChange={() => toggle(c.id)} />{c.label}</label>
                ))}
              </div>
            </div>
          </div>
        )}
        <section className="esporta__voce">
          <span className="esporta__ico" style={{ background: '#fbeceb', color: '#D9473F' }}><FileText size={20} /></span>
          <div className="grow">
            <b>PDF delle schede</b>
            <p className="small muted">Una pagina per scheda, con foto e dati: {numero(schede.length)} pagine.</p>
          </div>
          <button className="btn" disabled={!!lavoro || !schede.length} onClick={pdf}>{lavoro ?? 'Genera'}</button>
        </section>
        <section className="esporta__voce">
          <span className="esporta__ico" style={{ background: '#EAF2F9', color: '#1B5A8F' }}><Sigma size={20} /></span>
          <div className="grow">
            <b>Excel dei totali</b>
            <p className="small muted">Riepiloghi per quadrante, stato, tipologia e viale.</p>
          </div>
          <button className="btn" disabled={!!lavoro} onClick={totali}>Scarica</button>
        </section>
      </div>
    </Modal>
  );
}
