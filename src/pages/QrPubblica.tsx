import { LogIn, MapPin, Navigation } from 'lucide-react';
import { Logo } from '../components/Logo';
import { CemeteryMap } from '../components/map/CemeteryMap';
import { indiceSchede, useStore } from '../data/store';
import { descrizioneScheda } from '../data/selectors';
import { data, decedutoDa, nomeCompleto } from '../lib/format';
import { googleMapsIndicazioni } from '../lib/geo';
import { fotoUrl } from '../lib/photo';
import { href } from '../router';

/** Pagina aperta dal QR sul manufatto: dati essenziali e indicazioni per raggiungerlo. */
export function QrPubblica({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const foto = useStore((s) => s.foto);
  const s = indiceSchede(db.schede).get(id);
  const cim = s ? db.cimiteri.find((c) => c.id === s.cimiteroId) : undefined;
  const struttura = s ? db.strutture.find((x) => x.id === (s.posizione?.strutturaId ?? s.strutturaId)) : undefined;

  return (
    <div className="pub">
      <header className="pub__head">
        <Logo size={36} />
      </header>
      {!s || !cim ? (
        <div className="pub__card">
          <h2>Scheda non trovata</h2>
          <p className="muted mt-8">Il codice {id} non corrisponde a nessun manufatto censito.</p>
        </div>
      ) : (
        <div className="pub__card">
          <div className="foto"><img src={fotoUrl(s, foto)} alt="" /></div>
          <div className="pub__id">{s.id}</div>
          <h1 className="pub__name">{descrizioneScheda(s)}</h1>
          {s.defunti.map((d, i) => (
            <div key={i} className="pub__def">
              {s.defunti.length > 1 && <b>{nomeCompleto(d)}</b>}
              <span>{data(d.dataNascita)} – {data(d.dataMorte)}</span>
              {decedutoDa(d) && <span className="muted small">{decedutoDa(d)}</span>}
            </div>
          ))}
          <div className="pub__where">
            <MapPin size={18} color="#1B5A8F" />
            <div>
              <b>{cim.nome}</b>
              <div className="small muted">
                {s.viale}
                {struttura ? ` · ${struttura.nome}` : ''}
                {s.posizione ? ` · fila ${s.posizione.fila}, colonna ${s.posizione.colonna}` : ''}
              </div>
            </div>
          </div>
          <div className="pub__map">
            <CemeteryMap cimitero={cim} schede={[s]} strutture={[]} stile="satellite" selezionata={s.id} compatta segueVolo={false} onReady={(m) => m.setView([s.lat, s.lng], 19.5)} />
          </div>
          <a className="btn btn--primary btn--lg btn--block" href={googleMapsIndicazioni(s.lat, s.lng)} target="_blank" rel="noreferrer">
            <Navigation size={18} /> Portami qui con Google Maps
          </a>
          <a className="btn btn--block mt-8" href={href(`/scheda/${s.id}`)}>
            <LogIn size={16} /> Area operatori · scheda completa
          </a>
        </div>
      )}
      <footer className="pub__foot">
        <span>Una soluzione <b>DAT | HYA Group</b></span>
      </footer>
    </div>
  );
}
