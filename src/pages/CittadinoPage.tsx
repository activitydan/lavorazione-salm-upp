import { useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Navigation, Search } from 'lucide-react';
import { FIRMA, Logo } from '../components/Logo';
import { CemeteryMap } from '../components/map/CemeteryMap';
import { useSenzaRete, useStore } from '../data/store';
import type { Defunto, Scheda } from '../data/types';
import { data, decedutoDa, nomeCompleto, normalizza } from '../lib/format';
import { googleMapsIndicazioni } from '../lib/geo';
import { fotoUrl } from '../lib/photo';
import { href } from '../router';

interface Trovato {
  scheda: Scheda;
  defunto: Defunto;
  chiave: string;
}

const anno = (d?: string | null) => (d ? d.slice(0, 4) : '?');

/** Pagina pubblica del Cittadino: solo la ricerca di un defunto per nome e cognome, pensata per il telefono. */
export function CittadinoPage() {
  const db = useStore((s) => s.db);
  const foto = useStore((s) => s.foto);
  const [q, setQ] = useState('');
  const [scelto, setScelto] = useState<Trovato | null>(null);
  const senzaRete = useSenzaRete();

  const trovati = useMemo(() => {
    const parole = normalizza(q).split(/\s+/).filter(Boolean);
    // niente elenchi da sfogliare: servono almeno tre lettere
    if (parole.join('').length < 3) return null;
    const out: Trovato[] = [];
    for (const s of db.schede) {
      if (s.visibilePubblico === false) continue;
      s.defunti.forEach((d, i) => {
        const nome = normalizza(nomeCompleto(d));
        if (parole.every((p) => nome.includes(p))) out.push({ scheda: s, defunto: d, chiave: `${s.id}-${i}` });
      });
      if (out.length > 40) break;
    }
    return out.slice(0, 40);
  }, [q, db.schede]);

  const cimitero = (s: Scheda) => db.cimiteri.find((c) => c.id === s.cimiteroId);
  const struttura = (s: Scheda) => db.strutture.find((x) => x.id === (s.posizione?.strutturaId ?? s.strutturaId));

  return (
    <div className="pub">
      <header className="pub__head">
        <Logo size={36} />
      </header>

      {senzaRete ? (
        <div className="pub__card">
          <h1 className="pub__name">Serve la rete</h1>
          <p className="muted">Per cercare un defunto il telefono deve essere collegato a Internet. Riprova quando torna la rete.</p>
        </div>
      ) : scelto ? (
        <div className="pub__card">
          <button className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => setScelto(null)}>
            <ArrowLeft size={15} />Torna ai risultati
          </button>
          <div className="foto"><img src={fotoUrl(scelto.scheda, foto)} alt="" /></div>
          <h1 className="pub__name">{nomeCompleto(scelto.defunto)}</h1>
          <div className="pub__def">
            <span>{data(scelto.defunto.dataNascita)} – {data(scelto.defunto.dataMorte)}</span>
            {decedutoDa(scelto.defunto) && <span className="muted small">{decedutoDa(scelto.defunto)}</span>}
          </div>
          <div className="pub__where">
            <MapPin size={18} color="#1B5A8F" />
            <div>
              <b>{cimitero(scelto.scheda)?.nome}</b>
              <div className="small muted">
                {scelto.scheda.viale}
                {struttura(scelto.scheda) ? ` · ${struttura(scelto.scheda)!.nome}` : ''}
                {scelto.scheda.posizione ? ` · fila ${scelto.scheda.posizione.fila}, colonna ${scelto.scheda.posizione.colonna}` : ''}
              </div>
            </div>
          </div>
          {cimitero(scelto.scheda) && (
            <div className="pub__map">
              <CemeteryMap
                cimitero={cimitero(scelto.scheda)!} schede={[scelto.scheda]} strutture={[]} stile="satellite" selezionata={scelto.scheda.id}
                compatta segueVolo={false} onReady={(m) => m.setView([scelto.scheda.lat, scelto.scheda.lng], 19.5)}
              />
            </div>
          )}
          <a className="btn btn--primary btn--lg btn--block" href={googleMapsIndicazioni(scelto.scheda.lat, scelto.scheda.lng)} target="_blank" rel="noreferrer">
            <Navigation size={18} /> Portami qui con Google Maps
          </a>
        </div>
      ) : (
        <div className="pub__card">
          <h1 className="pub__name">Cerca un defunto</h1>
          <p className="muted">Scrivi nome e cognome per sapere dove si trova e come arrivarci.</p>
          <div className="input-icon">
            <Search size={17} />
            <input
              className="input" autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Nome e cognome" aria-label="Nome e cognome del defunto"
            />
          </div>
          {trovati === null && q.trim() !== '' && <p className="small muted">Scrivi almeno tre lettere.</p>}
          {trovati !== null && trovati.length === 0 && <p className="small muted">Nessun defunto trovato con questo nome.</p>}
          {trovati !== null && trovati.length > 0 && (
            <div className="pub__lista">
              {trovati.map((t) => (
                <button key={t.chiave} className="pub__riga" onClick={() => setScelto(t)}>
                  <span className="grow">
                    <b>{nomeCompleto(t.defunto)}</b>
                    <span className="small muted">
                      {anno(t.defunto.dataNascita)} – {anno(t.defunto.dataMorte)} · {cimitero(t.scheda)?.breve ?? ''} · {t.scheda.viale}
                    </span>
                  </span>
                  <MapPin size={16} color="#1B5A8F" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="pub__foot">
        <span>{FIRMA}</span>
        <a className="small muted" href={href('/')}>Area riservata</a>
      </footer>
    </div>
  );
}
