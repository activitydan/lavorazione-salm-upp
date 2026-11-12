import { useMemo, useState } from 'react';
import { Camera, ClipboardCheck, Crosshair, Maximize2, Wrench, X } from 'lucide-react';
import { PRIORITA } from '../config/defaults';
import {
  aggiornaScheda, aggiungiFoto, apriModale, creaManutenzione, creaVerifica, firmaCorrente, indiceSchede, seleziona, toast, useStore,
} from '../data/store';
import { descrizioneScheda, useCimitero } from '../data/selectors';
import type { LatLng, Priorita, Scheda } from '../data/types';
import { aggiungiGiorni, normalizza, oggiISO } from '../lib/format';
import { distanzaM, quadranteDi, vialePiuVicino } from '../lib/geo';
import { href, vai } from '../router';
import { LocationPicker } from './map/LocationPicker';
import { ScegliFoto } from './scheda/Media';
import { SchedaView } from './scheda/SchedaView';
import { Field, Modal, StatoBadge } from './ui';

/** Pannello laterale della scheda selezionata (mappa, ricerca, anagrafe...). */
export function PannelloScheda() {
  const ui = useStore((s) => s.ui);
  const schede = useStore((s) => s.db.schede);
  if (!ui.pannello || !ui.selezionata) return null;
  const s = indiceSchede(schede).get(ui.selezionata);
  if (!s) return null;
  return (
    <aside className="drawer" aria-label={`Scheda ${s.id}`}>
      <div className="drawer__head">
        <div className="small muted upper">Scheda</div>
        <div className="row gap-4">
          <a className="btn btn--sm" href={href(`/scheda/${s.id}`)} title="Visualizzazione estesa"><Maximize2 size={14} />Vista estesa</a>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={() => seleziona(null)} aria-label="Chiudi"><X size={18} /></button>
        </div>
      </div>
      <div className="drawer__body">
        <SchedaView key={s.id} s={s} />
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------

function CercaScheda({ valore, onScegli }: { valore?: Scheda; onScegli: (s: Scheda) => void }) {
  const cim = useCimitero();
  const schede = useStore((s) => s.db.schede);
  const [q, setQ] = useState('');
  const ris = useMemo(() => {
    const t = normalizza(q);
    if (t.length < 2) return [];
    return schede.filter((s) => s.cimiteroId === cim.id && (s.id.toLowerCase().includes(t) || descrizioneScheda(s).toLowerCase().includes(t))).slice(0, 6);
  }, [q, schede, cim.id]);
  if (valore)
    return (
      <div className="scheda-pick">
        <div className="grow">
          <b>{valore.id}</b> · {descrizioneScheda(valore)}
          <div className="small muted">{valore.viale}</div>
        </div>
        <StatoBadge stato={valore.stato} small />
      </div>
    );
  return (
    <div style={{ position: 'relative' }}>
      <input className="input" placeholder="Cerca per ID o nominativo…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {ris.length > 0 && (
        <div className="popover" style={{ left: 0, right: 0 }}>
          {ris.map((s) => (
            <button key={s.id} className="popover__item" onClick={() => { onScegli(s); setQ(''); }}>
              <b>{s.id}</b>
              <span className="grow ellipsis">{descrizioneScheda(s)}</span>
              <StatoBadge stato={s.stato} small />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ModaleManutenzione({ schedaId }: { schedaId?: string }) {
  const config = useStore((s) => s.config);
  const schede = useStore((s) => s.db.schede);
  const [scheda, setScheda] = useState<Scheda | undefined>(schedaId ? indiceSchede(schede).get(schedaId) : undefined);
  const [categoria, setCategoria] = useState(config.categorieManutenzione[0]?.id ?? '');
  const [priorita, setPriorita] = useState<Priorita>('media');
  const [descrizione, setDescrizione] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const chiudi = () => apriModale(null);
  const invia = () => {
    if (!scheda) return toast('Scegli la scheda', 'errore');
    if (!descrizione.trim()) return toast('Descrivi il problema', 'errore');
    const fotoId = foto ? aggiungiFoto(foto) : undefined;
    const m = creaManutenzione({
      schedaId: scheda.id, cimiteroId: scheda.cimiteroId, categoria, priorita, descrizione: descrizione.trim(),
      segnalataDa: firmaCorrente(), fotoProblemaId: fotoId,
    });
    toast(`Segnalazione ${m.id} registrata`);
    chiudi();
  };
  return (
    <Modal
      titolo="Segnala manutenzione"
      sottotitolo="La segnalazione compare in Manutenzioni e la scheda passa a “Da manutenzionare”."
      icona={<span className="list-item__icon" style={{ background: '#fdeeed', color: '#D9473F' }}><Wrench size={18} /></span>}
      onClose={chiudi}
      footer={<><button className="btn" onClick={chiudi}>Annulla</button><button className="btn btn--primary" onClick={invia}>Registra segnalazione</button></>}
    >
      <div className="col gap-16">
        <Field label="Scheda"><CercaScheda valore={scheda} onScegli={setScheda} /></Field>
        <div className="grid-form">
          <Field label="Categoria">
            <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {config.categorieManutenzione.filter((c) => !c.archiviata).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Priorità">
            <div className="seg seg--light">
              {PRIORITA.map((p) => <button key={p.id} type="button" className={priorita === p.id ? 'is-on' : ''} onClick={() => setPriorita(p.id)} style={priorita === p.id ? { color: p.colore } : undefined}>{p.label}</button>)}
            </div>
          </Field>
        </div>
        <Field label="Descrizione del problema"><textarea className="textarea" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Es. lastra incrinata nell'angolo inferiore destro" /></Field>
        <Field label="Foto del problema (facoltativa)">
          <div className="row gap-12">
            {foto && <img src={foto} alt="" style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8 }} />}
            <ScegliFoto onFoto={setFoto}><Camera size={15} />{foto ? 'Cambia foto' : 'Scatta o carica'}</ScegliFoto>
          </div>
        </Field>
      </div>
    </Modal>
  );
}

function ModaleVerifica({ schedaId }: { schedaId?: string }) {
  const config = useStore((s) => s.config);
  const schede = useStore((s) => s.db.schede);
  const operatori = useStore((s) => s.db.operatori).filter((o) => o.attivo);
  const [scheda, setScheda] = useState<Scheda | undefined>(schedaId ? indiceSchede(schede).get(schedaId) : undefined);
  const [operatoreId, setOperatoreId] = useState(operatori[0]?.id ?? '');
  const [motivo, setMotivo] = useState(config.motiviVerifica[0]?.id ?? '');
  const [scadenza, setScadenza] = useState(aggiungiGiorni(oggiISO(), 14));
  const [note, setNote] = useState('');
  const [segna, setSegna] = useState(true);
  const chiudi = () => apriModale(null);
  const invia = () => {
    if (!scheda) return toast('Scegli la scheda', 'errore');
    creaVerifica({ schedaId: scheda.id, operatoreId, motivo, scadenza, note: note || undefined }, segna);
    toast('Verifica assegnata');
    chiudi();
  };
  return (
    <Modal
      titolo="Assegna una verifica"
      icona={<span className="list-item__icon" style={{ background: '#fdf6dc', color: '#8a6a00' }}><ClipboardCheck size={18} /></span>}
      onClose={chiudi}
      footer={<><button className="btn" onClick={chiudi}>Annulla</button><button className="btn btn--primary" onClick={invia}>Assegna</button></>}
    >
      <div className="col gap-16">
        <Field label="Scheda"><CercaScheda valore={scheda} onScegli={setScheda} /></Field>
        <div className="grid-form">
          <Field label="Operatore">
            <select className="select" value={operatoreId} onChange={(e) => setOperatoreId(e.target.value)}>
              {operatori.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </Field>
          <Field label="Motivo">
            <select className="select" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {config.motiviVerifica.filter((m) => !m.archiviata).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Da completare entro"><input className="input" type="date" value={scadenza} min={oggiISO()} onChange={(e) => setScadenza(e.target.value)} /></Field>
        </div>
        <Field label="Note per l'operatore"><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. confrontare la data di morte con il registro" /></Field>
        <label className="row small" style={{ cursor: 'pointer' }}>
          <input type="checkbox" className="check" checked={segna} onChange={(e) => setSegna(e.target.checked)} />
          Segna la scheda come “Da verificare” finché il controllo non è chiuso
        </label>
      </div>
    </Modal>
  );
}

function ModaleGps({ schedaId }: { schedaId: string }) {
  const schede = useStore((s) => s.db.schede);
  const db = useStore((s) => s.db);
  const s = indiceSchede(schede).get(schedaId)!;
  const cim = db.cimiteri.find((c) => c.id === s.cimiteroId)!;
  const [p, setP] = useState<LatLng>([s.lat, s.lng]);
  const chiudi = () => apriModale(null);
  const spost = distanzaM([s.lat, s.lng], p);
  const viali = db.viali.filter((v) => v.cimiteroId === cim.id);
  const quadr = db.quadranti.filter((q) => q.cimiteroId === cim.id);
  const nuovoViale = vialePiuVicino(p, viali);
  const nuovoQ = quadranteDi(p, quadr);
  const conferma = () => {
    aggiornaScheda(s.id, { lat: p[0], lng: p[1], quadranteId: nuovoQ?.id ?? s.quadranteId }, `Posizione GPS corretta (${spost.toFixed(1)} m)`);
    toast('Posizione aggiornata');
    chiudi();
  };
  return (
    <Modal
      titolo={`Modifica GPS · ${s.id}`}
      icona={<span className="list-item__icon" style={{ background: '#EAF2F9', color: '#1B5A8F' }}><Crosshair size={18} /></span>}
      onClose={chiudi}
      size="lg"
      footer={
        <>
          <span className="small muted grow">
            Spostamento: <b>{spost.toFixed(1)} m</b> · Viale più vicino: <b>{nuovoViale || '—'}</b>{nuovoQ ? <> · {nuovoQ.nome}</> : null}
          </span>
          <button className="btn" onClick={chiudi}>Annulla</button>
          <button className="btn btn--primary" onClick={conferma} disabled={spost < 0.05}>Conferma posizione</button>
        </>
      }
    >
      <LocationPicker cimitero={cim} valore={p} onChange={setP} altezza={440} />
    </Modal>
  );
}

export function Modali() {
  const m = useStore((s) => s.ui.modale);
  if (!m) return null;
  switch (m.tipo) {
    case 'manutenzione':
      return <ModaleManutenzione schedaId={m.schedaId} />;
    case 'verifica':
      return <ModaleVerifica schedaId={m.schedaId} />;
    case 'gps':
      return <ModaleGps schedaId={m.schedaId} />;
  }
}

export function vaiAScheda(id: string) {
  vai(`/scheda/${id}`);
}
