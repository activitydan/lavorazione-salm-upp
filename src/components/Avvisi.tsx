import { useState } from 'react';
import { Ban, CreditCard, FileText } from 'lucide-react';
import { CLASSE_STATO_AVVISO, NOMI_MOTIVO_AVVISO, NOMI_PASSO, NOMI_STATO_AVVISO, annullaAvviso, eMoroso, simulaPagamento, statoAvviso } from '../data/scadenze';
import { useStore } from '../data/store';
import type { AvvisoPagamento, MotivoAvviso } from '../data/types';
import { data, euro } from '../lib/format';
import { pdfAvvisoPagamento } from '../lib/pdf';
import { Field, Modal } from './ui';

export function BadgeAvviso({ a }: { a: AvvisoPagamento }) {
  const st = statoAvviso(a);
  return <span className={`badge badge--sm ${CLASSE_STATO_AVVISO[st]}`}>{NOMI_STATO_AVVISO[st]}</span>;
}

/** Etichetta "Moroso": chi ha almeno un avviso di pagamento scaduto. */
export function Moroso({ codiceFiscale }: { codiceFiscale?: string }) {
  useStore((s) => s.db.avvisi);
  return eMoroso(codiceFiscale) ? <span className="badge badge--sm badge--rosso">Moroso</span> : null;
}

/** L'avviso di pagamento: voci, stato, PDF fac-simile e "Simula pagamento". */
export function AvvisoDettaglio({ a, onChiudi }: { a: AvvisoPagamento; onChiudi: () => void }) {
  const comune = useStore((s) => s.db.cimiteri.find((c) => c.id === a.cimiteroId)?.comune ?? '');
  const [annulla, setAnnulla] = useState(false);
  const [motivo, setMotivo] = useState('');
  const st = statoAvviso(a);
  return (
    <Modal titolo="Avviso di pagamento" sottotitolo={a.causale} onClose={onChiudi}
      footer={
        <>
          <span className="small muted grow">pagoPA simulato: nessun pagamento reale</span>
          <button className="btn" onClick={() => void pdfAvvisoPagamento(a, comune)}><FileText size={15} />PDF</button>
          {a.stato === 'da_pagare' && <button className="btn" onClick={() => setAnnulla(!annulla)}><Ban size={15} />Annulla</button>}
          {a.stato === 'da_pagare' && <button className="btn btn--success" onClick={() => simulaPagamento(a.id)}><CreditCard size={15} />Simula pagamento</button>}
        </>
      }>
      <div className="col gap-16">
        <div className="row row--between">
          <BadgeAvviso a={a} />
          <span className="mono small muted">Codice avviso {a.numero}</span>
        </div>
        <dl className="kv">
          <dt>Intestatario</dt><dd>{a.intestatario.nome} · {a.intestatario.codiceFiscale}<div className="small muted">{a.intestatario.indirizzo}</div></dd>
          <dt>Motivo</dt><dd>{NOMI_MOTIVO_AVVISO[a.motivo]}</dd>
          <dt>Emesso il</dt><dd>{data(a.emessoIl)}</dd>
          <dt>Scadenza</dt><dd>{data(a.scadenza)}</dd>
          {a.stato === 'pagato' && (<><dt>Pagato il</dt><dd>{data(a.pagatoIl)} · ricevuta {a.ricevuta}</dd></>)}
          {a.stato === 'annullato' && (<><dt>Annullato il</dt><dd>{data(a.annullatoIl)} · {a.motivoAnnullamento}</dd></>)}
        </dl>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {a.voci.map((v, i) => <tr key={i}><td>{v.descrizione}</td><td className="num">{euro(v.importo)}</td></tr>)}
              <tr><td><b>Totale</b></td><td className="num"><b>{euro(a.importo)}</b></td></tr>
            </tbody>
          </table>
        </div>
        {a.passi.length > 0 && (
          <div className="col gap-4">
            {a.passi.map((p, i) => <div key={i} className="small"><b>{NOMI_PASSO[p.tipo]}</b> <span className="muted">· {data(p.data)}</span></div>)}
          </div>
        )}
        {st === 'scaduto' && <p className="small" style={{ color: '#a85710' }}>Scaduto: si può ancora pagare.</p>}
        {annulla && (
          <Field label="Motivo dell'annullamento">
            <div className="row gap-8">
              <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus />
              <button className="btn btn--danger" disabled={!motivo.trim()} onClick={() => { annullaAvviso(a.id, motivo.trim()); setAnnulla(false); }}>Conferma</button>
            </div>
          </Field>
        )}
      </div>
    </Modal>
  );
}

/** Gli avvisi di pagamento di una concessione, di un'utenza votiva o di una pratica. */
export function AvvisiDi({ motivo, id }: { motivo: MotivoAvviso; id: string }) {
  const tutti = useStore((s) => s.db.avvisi);
  const [aperto, setAperto] = useState<string | null>(null);
  const avvisi = tutti.filter((a) => a.motivo === motivo && a.riferimentoId === id).sort((a, b) => b.emessoIl.localeCompare(a.emessoIl));
  const sel = avvisi.find((a) => a.id === aperto);
  return (
    <section className="sez">
      <h4 className="sez__t">Avvisi di pagamento ({avvisi.length})</h4>
      <div className="col">
        {avvisi.map((a) => (
          <button key={a.id} className="mini-row" onClick={() => setAperto(a.id)}>
            <span className="grow"><b>{euro(a.importo)}</b><span className="small muted"> · {a.voci.map((v) => v.descrizione).join(' + ')} · {data(a.emessoIl)}</span></span>
            <BadgeAvviso a={a} />
          </button>
        ))}
        {!avvisi.length && <p className="small muted">Nessun avviso di pagamento.</p>}
      </div>
      {sel && <AvvisoDettaglio a={sel} onChiudi={() => setAperto(null)} />}
    </section>
  );
}
