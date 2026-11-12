import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, ChevronDown, Layers, Menu, MapPin, Plus, Satellite, Search, Route as RouteIcon } from 'lucide-react';
import { segnaLetti, seleziona, setCimitero, setFiltri, setUi, resetFiltri, useStore, volaA } from '../data/store';
import { descrizioneScheda, testoRicerca, useAlert, useCimitero, useDatiCimitero, useSchedeCimitero, type AlertItem } from '../data/selectors';
import type { StileMappa } from '../data/types';
import { dataBreve, normalizza, numero } from '../lib/format';
import { centroide } from '../lib/geo';
import { useTelefono } from '../lib/schermo';
import { useRotta, vai } from '../router';
import { Seg, StatoBadge } from './ui';

function useFuori(ref: React.RefObject<HTMLElement | null>, onFuori: () => void) {
  useEffect(() => {
    const f = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onFuori();
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [ref, onFuori]);
}

function SelettoreCimitero() {
  const cimiteri = useStore((s) => s.db.cimiteri);
  const schede = useStore((s) => s.db.schede);
  const cim = useCimitero();
  const [aperto, setAperto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFuori(ref, () => setAperto(false));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="cim-select" onClick={() => setAperto(!aperto)} aria-haspopup="listbox" aria-expanded={aperto}>
        <span className="cim-select__name">{cim?.nome ?? 'Cimitero'}</span>
        <ChevronDown size={16} />
      </button>
      {aperto && (
        <div className="popover" style={{ left: 0, width: 320 }} role="listbox">
          {cimiteri.map((c) => {
            const n = schede.filter((s) => s.cimiteroId === c.id).length;
            return (
              <button
                key={c.id}
                className={`popover__item ${c.id === cim?.id ? 'is-active' : ''}`}
                onClick={() => {
                  setCimitero(c.id);
                  setAperto(false);
                }}
              >
                <MapPin size={18} color={c.id === cim?.id ? '#1B5A8F' : '#93A0B1'} />
                <span className="grow">
                  <b>{c.nome}</b>
                  <br />
                  <span className="small muted">{n ? `${numero(n)} schede · censimento in corso` : 'Censimento da avviare'}</span>
                </span>
                {c.id === cim?.id && <Check size={16} color="#1B5A8F" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RicercaGlobale() {
  const schede = useSchedeCimitero();
  const { viali, quadranti } = useDatiCimitero();
  const rotta = useRotta();
  const [q, setQ] = useState('');
  const [aperto, setAperto] = useState(false);
  const [att, setAtt] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useFuori(ref, () => setAperto(false));

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const risultati = useMemo(() => {
    const t = normalizza(q);
    if (t.length < 2) return [];
    const parole = t.split(/\s+/);
    const aree: { tipo: 'viale' | 'quadrante'; id: string; label: string; lat: number; lng: number }[] = [];
    for (const v of viali)
      if (normalizza(v.nome).includes(t) && v.tracciato.length) {
        const c = centroide(v.tracciato);
        aree.push({ tipo: 'viale', id: v.id, label: v.nome, lat: c[0], lng: c[1] });
      }
    for (const qd of quadranti)
      if (normalizza(qd.nome).includes(t)) {
        const c = centroide(qd.poligono);
        aree.push({ tipo: 'quadrante', id: qd.id, label: qd.nome, lat: c[0], lng: c[1] });
      }
    const sch = schede.filter((s) => parole.every((p) => testoRicerca(s).includes(p))).slice(0, 8);
    return [...aree.slice(0, 3).map((a) => ({ k: 'area' as const, a })), ...sch.map((s) => ({ k: 'scheda' as const, s }))];
  }, [q, schede, viali, quadranti]);

  const scegli = (i: number) => {
    const r = risultati[i];
    if (!r) return;
    setAperto(false);
    if (!['/', '/mappa'].includes(rotta.path)) vai('/mappa');
    if (r.k === 'scheda') {
      seleziona(r.s.id, { vola: true });
    } else {
      seleziona(null);
      if (r.a.tipo === 'viale') resetFiltri({ viali: [r.a.label] });
      else resetFiltri({ quadranti: [r.a.id] });
      volaA(r.a.lat, r.a.lng, 18.75);
    }
    setQ('');
  };

  return (
    <div ref={ref} className="gsearch">
      <div className="input-icon input-icon--dx">
        <Search size={17} />
        <input
          ref={input}
          className="input"
          placeholder="Cerca per nome, ID o area…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAperto(true);
            setAtt(0);
          }}
          onFocus={() => setAperto(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setAtt((a) => Math.min(a + 1, risultati.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setAtt((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter') scegli(att);
            else if (e.key === 'Escape') setAperto(false);
          }}
          aria-label="Cerca per nome, ID o area"
        />
      </div>
      {aperto && q.trim().length >= 2 && (
        <div className="popover gsearch__pop">
          {risultati.length === 0 && <div className="small muted" style={{ padding: 16 }}>Nessun risultato per “{q}”</div>}
          {risultati.map((r, i) =>
            r.k === 'area' ? (
              <button key={r.a.id} className={`popover__item ${i === att ? 'is-active' : ''}`} onMouseEnter={() => setAtt(i)} onClick={() => scegli(i)}>
                <span className="list-item__icon" style={{ background: '#EAF2F9', color: '#1B5A8F', width: 32, height: 32 }}>
                  {r.a.tipo === 'viale' ? <RouteIcon size={16} /> : <Layers size={16} />}
                </span>
                <span className="grow">
                  <b>{r.a.label}</b>
                  <br />
                  <span className="tiny muted">{r.a.tipo === 'viale' ? 'Viale · filtra le schede sulla mappa' : 'Quadrante · filtra le schede sulla mappa'}</span>
                </span>
              </button>
            ) : (
              <button key={r.s.id} className={`popover__item ${i === att ? 'is-active' : ''}`} onMouseEnter={() => setAtt(i)} onClick={() => scegli(i)}>
                <span className="grow" style={{ minWidth: 0 }}>
                  <b className="ellipsis" style={{ display: 'block' }}>{descrizioneScheda(r.s)}</b>
                  <span className="tiny muted">
                    {r.s.id} · {r.s.viale}
                    {r.s.defunti[0]?.dataMorte ? ` · † ${dataBreve(r.s.defunti[0].dataMorte)}` : ''}
                  </span>
                </span>
                <StatoBadge stato={r.s.stato} small />
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** Campanella degli alert. Nel menu laterale il pannello si apre verso l'alto, a destra del menu. */
export function CampanellaAlert({ nelMenu }: { nelMenu?: boolean }) {
  const alert = useAlert();
  const letti = useStore((s) => s.db.alertLetti);
  const [aperto, setAperto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFuori(ref, () => setAperto(false));
  const nonLetti = alert.filter((a) => !letti.includes(a.id));
  const apri = (a: AlertItem) => {
    segnaLetti([a.id]);
    setAperto(false);
    if (a.link) vai(a.link);
  };
  return (
    <div ref={ref} className={nelMenu ? 'campanella campanella--menu' : 'campanella'} style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={() => setAperto(!aperto)} aria-label={`Alert: ${nonLetti.length} da leggere`}>
        <Bell size={20} />
        {nonLetti.length > 0 && <span className="icon-btn__dot">{nonLetti.length}</span>}
      </button>
      {aperto && (
        <div className="popover" style={nelMenu ? { left: 0, bottom: 44, top: 'auto', width: 380 } : { right: 0, width: 380 }}>
          <div className="row row--between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <b>I tuoi alert</b>
            <button className="btn btn--ghost btn--xs" onClick={() => segnaLetti(alert.map((a) => a.id))} disabled={!nonLetti.length}>
              Segna tutti come letti
            </button>
          </div>
          <div style={{ maxHeight: 420, overflow: 'auto' }}>
            {alert.length === 0 && <div className="small muted" style={{ padding: 16 }}>Nessun alert per te.</div>}
            {alert.map((a) => (
              <button key={a.id} className="popover__item alert-row" onClick={() => apri(a)} style={{ alignItems: 'flex-start', opacity: letti.includes(a.id) ? 0.6 : 1 }}>
                <span className={`alert-dot alert-dot--${a.livello}`} />
                <span className="grow">
                  <b style={{ fontSize: 13 }}>{a.titolo}</b>
                  <br />
                  <span className="small muted">{a.messaggio}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STILI: { id: StileMappa; label: string; icon: React.ReactNode }[] = [
  { id: 'satellite', label: 'Satellite', icon: <Satellite size={14} /> },
  { id: 'planimetria', label: 'Planimetria', icon: <Layers size={14} /> },
];

/** Satellite / Planimetria: nella barra sulla pagina Mappa, dentro la mappa nella Dashboard. */
export function SceltaStileMappa() {
  const stile = useStore((s) => s.ui.stileMappa);
  return <Seg options={STILI.map((s) => ({ ...s, label: <span className="seg-label">{s.label}</span> }))} value={stile} onChange={(v) => setUi({ stileMappa: v })} />;
}

export function Topbar() {
  const rotta = useRotta();
  const home = rotta.path === '/';
  const telefono = useTelefono();
  return (
    <header className="topbar">
      <button className="icon-btn hamburger" onClick={() => setUi({ menuMobile: true })} aria-label="Apri il menu">
        <Menu size={22} />
      </button>
      <SelettoreCimitero />
      <RicercaGlobale />
      {rotta.path === '/mappa' && (
        <div className="topbar__seg">
          <SceltaStileMappa />
        </div>
      )}
      <div className="grow" />
      {telefono && <CampanellaAlert />}
      {home && (
        <button className="btn btn--success topbar__new" onClick={() => vai('/rilievo')}>
          <Plus size={16} />
          <span>Nuovo rilievo</span>
        </button>
      )}
    </header>
  );
}

export function filtraEVai(patch: Parameters<typeof setFiltri>[0], dove = '/mappa') {
  resetFiltri();
  setFiltri(patch);
  vai(dove);
}
