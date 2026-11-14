import { useRef, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { aggiornaScheda, aggiungiDocumento, eliminaDocumento, toast, useStore } from '../../data/store';
import type { DocumentoScheda, Scheda } from '../../data/types';
import { data, dataBreve, nomeCompleto } from '../../lib/format';
import { pdfDocumentoDemo } from '../../lib/pdf';

export const CATEGORIE_DOCUMENTO = [
  'Certificato di morte', 'Autorizzazione alla sepoltura', 'Documento d\'identità', 'Contratto di concessione', 'Ricevuta di pagamento', 'Altro',
];
const MAX_MB = 4;

const peso = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function leggiFile(f: File): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ko(r.error);
    r.readAsDataURL(f);
  });
}

/** Documenti della scheda: certificati, autorizzazioni e tutto ciò che riguarda il defunto. Si caricano anche dal telefono. */
export function Documenti({ s }: { s: Scheda }) {
  const archivio = useStore((st) => st.foto);
  const input = useRef<HTMLInputElement>(null);
  const [bozza, setBozza] = useState<{ nome: string; dataUrl: string; mime: string; dimensione: number } | null>(null);
  const [categoria, setCategoria] = useState(CATEGORIE_DOCUMENTO[0]);
  const [defunto, setDefunto] = useState('');
  const docs = s.documenti ?? [];

  const scelto = async (f?: File) => {
    if (!f) return;
    if (f.size > MAX_MB * 1048576) return toast(`Il file supera i ${MAX_MB} MB`, 'errore');
    try {
      setBozza({ nome: f.name, dataUrl: await leggiFile(f), mime: f.type || 'application/octet-stream', dimensione: f.size });
      setDefunto(s.defunti.length === 1 ? nomeCompleto(s.defunti[0]) : '');
    } catch {
      toast('File non leggibile', 'errore');
    }
  };
  const carica = () => {
    if (!bozza) return;
    aggiungiDocumento(s.id, { ...bozza, categoria, defunto: defunto || undefined });
    toast('Documento caricato nella scheda');
    setBozza(null);
  };
  const apri = async (d: DocumentoScheda) => {
    if (d.fileId === 'demo') return pdfDocumentoDemo(d, s.id);
    const url = archivio[d.fileId];
    if (!url) return toast('Il file non è su questo dispositivo', 'errore');
    const blob = await (await fetch(url)).blob();
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.target = '_blank';
    a.rel = 'noreferrer';
    if (!/pdf|image/.test(d.mime)) a.download = d.nome;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(u), 60000);
  };

  return (
    <section className="sez">
      <h4 className="sez__t">Documenti ({docs.length})</h4>
      <div className="col">
        {docs.map((d) => (
          <div key={d.id} className="mini-row doc">
            <FileText size={15} color="#1B5A8F" />
            <button className="grow doc__apri" onClick={() => void apri(d)} title="Apri il documento">
              <b>{d.nome}</b>
              <span className="small muted"> · {d.categoria}{d.defunto ? ` · ${d.defunto}` : ''} · {dataBreve(d.caricatoIl.slice(0, 10))} · {peso(d.dimensione)}</span>
            </button>
            <button className="btn btn--ghost btn--icon btn--xs" aria-label={`Togli ${d.nome}`} onClick={() => window.confirm(`Togliere "${d.nome}" dalla scheda?`) && eliminaDocumento(s.id, d.id)}><Trash2 size={13} /></button>
          </div>
        ))}
        {!docs.length && !bozza && <p className="small muted">Nessun documento.</p>}
      </div>
      {bozza ? (
        <div className="doc__nuovo">
          <div className="small"><b>{bozza.nome}</b> <span className="muted">· {peso(bozza.dimensione)}</span></div>
          <div className="row row--wrap gap-8">
            <select className="select select--sm" style={{ width: 'auto' }} value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Tipo di documento">
              {CATEGORIE_DOCUMENTO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {s.defunti.length > 1 && (
              <select className="select select--sm" style={{ width: 'auto' }} value={defunto} onChange={(e) => setDefunto(e.target.value)} aria-label="Defunto">
                <option value="">Tutta la postazione</option>
                {s.defunti.map((d, i) => <option key={i} value={nomeCompleto(d)}>{nomeCompleto(d)}</option>)}
              </select>
            )}
            <button className="btn btn--sm btn--primary" onClick={carica}>Carica</button>
            <button className="btn btn--sm" onClick={() => setBozza(null)}>Annulla</button>
          </div>
        </div>
      ) : (
        <button className="btn btn--sm mt-8" onClick={() => input.current?.click()}><Upload size={14} />Carica un documento</button>
      )}
      <input ref={input} type="file" accept=".pdf,image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void scelto(f); }} />
    </section>
  );
}

/** Sepoltura provvisoria: il defunto sta qui in attesa del posto definitivo. Si imposta dalla pratica o da "Modifica". */
export function Provvisoria({ s, indice }: { s: Scheda; indice: number }) {
  const d = s.defunti[indice];
  if (!d?.provvisorio) return null;
  const definitiva = () =>
    aggiornaScheda(s.id, { defunti: s.defunti.map((x, i) => (i === indice ? { ...x, provvisorio: undefined } : x)) }, `Sepoltura di ${nomeCompleto(d)} resa definitiva`);
  return (
    <div className="row row--wrap gap-4">
      <span className="badge badge--arancio badge--sm">Provvisoria {d.provvisorio.fino ? `fino al ${data(d.provvisorio.fino)}` : 'senza scadenza'}</span>
      <button className="btn btn--ghost btn--xs" onClick={definitiva}>Rendi definitiva</button>
    </div>
  );
}
