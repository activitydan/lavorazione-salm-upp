import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { aggiornaScheda, aggiungiFoto, toast, useStore } from '../../data/store';
import type { Scheda } from '../../data/types';
import { comprimiFoto, fotoUrl } from '../../lib/photo';

/** Input file che apre la fotocamera posteriore sul telefono. */
export function ScegliFoto({ onFoto, children, className, lato }: { onFoto: (dataUrl: string) => void; children: React.ReactNode; className?: string; lato?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className ?? 'btn btn--sm'} onClick={() => ref.current?.click()}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            onFoto(await comprimiFoto(f, lato));
          } catch {
            toast('Immagine non leggibile', 'errore');
          }
        }}
      />
    </>
  );
}

export function FotoScheda({ s, modificabile = true }: { s: Scheda; modificabile?: boolean }) {
  const foto = useStore((st) => st.foto);
  const vera = !!(s.fotoId && foto[s.fotoId]);
  return (
    <div className="foto">
      <img src={fotoUrl(s, foto)} alt={`Foto della postazione ${s.id}`} />
      {modificabile && (
        <div className="foto__azione">
          <ScegliFoto
            className="btn btn--sm"
            onFoto={(u) => {
              const id = aggiungiFoto(u);
              aggiornaScheda(s.id, { fotoId: id }, 'Foto aggiornata');
              toast('Foto salvata nella scheda');
            }}
          >
            <Camera size={15} /> {vera ? 'Cambia foto' : 'Scatta / carica'}
          </ScegliFoto>
        </div>
      )}
    </div>
  );
}
