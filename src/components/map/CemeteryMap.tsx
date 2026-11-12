import L from 'leaflet';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { indiceSchede, useStore } from '../../data/store';
import { descrizioneScheda, statoDef, tipologiaDef } from '../../data/selectors';
import type { Area, Cimitero, LatLng, Quadrante, Scheda, StileMappa, Struttura, Viale } from '../../data/types';
import { centroide } from '../../lib/geo';

// ---------------------------------------------------------------------------
// Basi cartografiche: nessuna chiave API necessaria.
// ---------------------------------------------------------------------------
const ortofoto = () =>
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 19, maxZoom: 22, attribution: 'Ortofoto © Esri, Maxar, Earthstar Geographics',
  });

const MapCtx = createContext<L.Map | null>(null);
export const useMappa = () => useContext(MapCtx);

export function raggioPin(z: number): number {
  if (z < 17.5) return 2.6;
  if (z < 18.5) return 3.6;
  if (z < 19.5) return 5.2;
  if (z < 20.5) return 7.2;
  return 9.5;
}

export interface CemeteryMapProps {
  cimitero: Cimitero;
  schede: Scheda[];
  strutture: Struttura[];
  /** Con filtri attivi: quante schede corrispondono dentro ogni struttura. null = nessun filtro. */
  conteggiStrutture?: Map<string, number> | null;
  quadranti?: Quadrante[];
  mostraQuadranti?: boolean;
  evidenziaQuadrante?: string | null;
  viali?: Viale[];
  aree?: Area[];
  stile: StileMappa;
  coloraPer?: 'stato' | 'tipologia';
  selezionata?: string | null;
  onSelect?: (id: string) => void;
  onMapClick?: (ll: LatLng) => void;
  disegno?: LatLng[] | null;
  compatta?: boolean;
  mostraPartenza?: boolean;
  etichetteViali?: boolean;
  className?: string;
  children?: ReactNode;
  onReady?: (m: L.Map) => void;
  segueVolo?: boolean;
}

export function CemeteryMap(props: CemeteryMapProps) {
  const {
    cimitero, schede, strutture, conteggiStrutture = null, quadranti = [], mostraQuadranti = false, evidenziaQuadrante = null,
    viali = [], aree = [], stile, coloraPer = 'stato', selezionata = null, onSelect, onMapClick, disegno = null,
    compatta = false, mostraPartenza = false, etichetteViali = true, className, children, onReady, segueVolo = true,
  } = props;
  const box = useRef<HTMLDivElement>(null);
  const [mappa, setMappa] = useState<L.Map | null>(null);
  const config = useStore((s) => s.config);
  const tutte = useStore((s) => s.db.schede);
  const volo = useStore((s) => s.ui.volaA);
  const cbSelect = useRef(onSelect);
  const cbClick = useRef(onMapClick);
  cbSelect.current = onSelect;
  cbClick.current = onMapClick;
  const perimetro = useRef(cimitero.perimetro);
  perimetro.current = cimitero.perimetro;

  // creazione mappa
  useLayoutEffect(() => {
    const m = L.map(box.current!, {
      zoomControl: false, preferCanvas: true, maxZoom: 22, minZoom: 14, zoomSnap: 0.25, zoomDelta: 0.5,
      wheelPxPerZoomLevel: 100, attributionControl: true,
    });
    m.attributionControl.setPrefix(false);
    for (const [nome, z] of [['aree', 350], ['quadranti', 360], ['viali', 370], ['strutture', 420], ['pins', 430], ['sel', 640]] as const) {
      m.createPane(nome).style.zIndex = String(z);
    }
    m.getPane('sel')!.style.pointerEvents = 'none';
    m.on('click', (e: L.LeafletMouseEvent) => cbClick.current?.([e.latlng.lat, e.latlng.lng]));
    const aggiornaZoom = () => {
      const z = m.getZoom();
      const c = m.getContainer();
      c.classList.toggle('z-lo', z < 18.75);
      c.classList.toggle('z-hi', z >= 20);
    };
    m.on('zoomend', aggiornaZoom);
    m.fitBounds(L.latLngBounds(cimitero.perimetro), { padding: [20, 20] });
    aggiornaZoom();
    setMappa(m);
    onReady?.(m);
    // nella Dashboard la mappa è un'anteprima: se cambia la finestra, il cimitero resta inquadrato per intero
    const ro = new ResizeObserver(() => {
      m.invalidateSize({ pan: false });
      if (compatta) m.fitBounds(L.latLngBounds(perimetro.current), { padding: [20, 20], animate: false });
    });
    ro.observe(box.current!);
    return () => {
      ro.disconnect();
      m.remove();
      setMappa(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cambio cimitero (il primo inquadramento avviene alla creazione)
  const cimPrec = useRef(cimitero.id);
  useEffect(() => {
    if (!mappa || cimPrec.current === cimitero.id) return;
    cimPrec.current = cimitero.id;
    mappa.fitBounds(L.latLngBounds(cimitero.perimetro), { padding: [20, 20] });
  }, [mappa, cimitero.id, cimitero.perimetro]);

  // doppio clic per chiudere il disegno: niente zoom durante il disegno
  useEffect(() => {
    if (!mappa) return;
    if (onMapClick) mappa.doubleClickZoom.disable();
    else mappa.doubleClickZoom.enable();
    mappa.getContainer().classList.toggle('is-drawing', !!onMapClick);
  }, [mappa, onMapClick]);

  // base
  useEffect(() => {
    if (!mappa) return;
    const c = mappa.getContainer();
    c.classList.toggle('map--plan', stile === 'planimetria');
    c.classList.toggle('map--sat', stile === 'satellite');
    if (stile === 'planimetria') return;
    const t = ortofoto().addTo(mappa);
    return () => {
      t.remove();
    };
  }, [mappa, stile]);

  // perimetro, aree, viali
  useEffect(() => {
    if (!mappa) return;
    const g = L.layerGroup().addTo(mappa);
    const plan = stile === 'planimetria';
    L.polygon(cimitero.perimetro, {
      pane: 'aree', interactive: false,
      color: stile === 'satellite' ? '#ffffff' : '#0A2F55', weight: plan ? 2.5 : 2, opacity: plan ? 0.9 : 0.85,
      dashArray: plan ? undefined : '6 6', fill: plan, fillColor: '#F8F6F0', fillOpacity: 1,
    }).addTo(g);
    if (plan) {
      for (const a of aree) {
        L.polygon(a.poligono, {
          pane: 'aree', interactive: false, color: a.tipo === 'prato' ? '#B9C9A3' : '#D7CDB5', weight: 1,
          fillColor: a.tipo === 'prato' ? '#DCE8CC' : '#ECE5D5', fillOpacity: 1,
        })
          .bindTooltip(a.nome, { permanent: true, direction: 'center', className: 'lbl lbl-area', pane: 'tooltipPane' })
          .addTo(g);
      }
      for (const v of viali) {
        if (v.tracciato.length < 2) continue;
        L.polyline(v.tracciato, { pane: 'viali', interactive: false, color: '#DCD3BF', weight: 12, lineCap: 'square' }).addTo(g);
        L.polyline(v.tracciato, { pane: 'viali', interactive: false, color: '#FFFFFF', weight: 8, lineCap: 'square' }).addTo(g);
      }
    }
    if (etichetteViali && !compatta) {
      for (const v of viali) {
        if (v.tracciato.length < 2) continue;
        let best = 0;
        let bi = 0;
        for (let i = 0; i < v.tracciato.length - 1; i++) {
          const d = Math.hypot(v.tracciato[i + 1][0] - v.tracciato[i][0], v.tracciato[i + 1][1] - v.tracciato[i][1]);
          if (d > best) {
            best = d;
            bi = i;
          }
        }
        const a = v.tracciato[bi];
        const b = v.tracciato[bi + 1];
        L.tooltip({ permanent: true, direction: 'center', className: `lbl lbl-viale ${stile === 'satellite' ? 'lbl--sat' : ''}`, interactive: false })
          .setLatLng([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])
          .setContent(v.nome)
          .addTo(g);
      }
    }
    return () => {
      g.remove();
    };
  }, [mappa, cimitero, aree, viali, stile, compatta, etichetteViali]);

  // quadranti
  useEffect(() => {
    if (!mappa || !mostraQuadranti) return;
    const g = L.layerGroup().addTo(mappa);
    for (const q of quadranti) {
      const ev = evidenziaQuadrante === q.id;
      L.polygon(q.poligono, {
        pane: 'quadranti', interactive: false, color: q.colore, weight: ev ? 3.5 : 2, opacity: 0.95,
        fillColor: q.colore, fillOpacity: ev ? 0.22 : stile === 'satellite' ? 0.1 : 0.12,
      }).addTo(g);
      L.marker(centroide(q.poligono), {
        pane: 'quadranti', interactive: false,
        icon: L.divIcon({ className: 'q-lbl-wrap', html: `<span class="q-lbl" style="--c:${q.colore}">${q.codice}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
      }).addTo(g);
    }
    return () => {
      g.remove();
    };
  }, [mappa, quadranti, mostraQuadranti, evidenziaQuadrante, stile]);

  // strutture (colombari e cappelle) e pin delle schede
  useEffect(() => {
    if (!mappa) return;
    const indice = indiceSchede(tutte);
    const g = L.layerGroup().addTo(mappa);
    const renderer = L.canvas({ pane: 'pins', padding: 0.4, tolerance: 5 });
    const colore = (s: Scheda) => (coloraPer === 'stato' ? statoDef(config, s.stato).colore : tipologiaDef(config, s.tipologia).colore);
    const r0 = raggioPin(mappa.getZoom());
    const cerchi: L.CircleMarker[] = [];
    const sat = stile === 'satellite';

    const pin = (s: Scheda, extra?: number) => {
      const c = colore(s);
      const libero = c.toUpperCase() === '#FFFFFF';
      const cm = L.circleMarker([s.lat, s.lng], {
        renderer, radius: r0, fillColor: c, fillOpacity: 1, color: libero ? '#5f6f82' : sat ? '#ffffff' : '#1d2b3d',
        weight: libero ? 2 : sat ? 1.4 : 1, opacity: libero ? 1 : sat ? 0.95 : 0.55,
      });
      if (!compatta) {
        cm.bindTooltip(`<b>${s.id}</b><br>${descrizioneScheda(s)}${extra ? `<br><span class="tt-extra">${extra} risultati all'interno</span>` : ''}`, {
          direction: 'top', offset: [0, -6], className: 'tt', opacity: 1,
        });
      }
      cm.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        cbSelect.current?.(s.id);
      });
      cm.addTo(g);
      cerchi.push(cm);
    };

    for (const st of strutture) {
      const n = conteggiStrutture ? conteggiStrutture.get(st.id) ?? 0 : null;
      if (n === 0) continue;
      const cont = indice.get(st.schedaId);
      const c = cont ? colore(cont) : '#9AA6B2';
      const poly = L.polygon(st.impronta, {
        pane: 'strutture', color: sat ? '#ffffff' : '#334155', weight: st.tipo !== 'cappella' ? 1.5 : 1, opacity: 0.9,
        fillColor: c.toUpperCase() === '#FFFFFF' ? '#E7ECF1' : c, fillOpacity: st.tipo !== 'cappella' ? 0.62 : 0.5,
      });
      if (!compatta)
        poly.bindTooltip(`<b>${st.nome}</b><br>${st.facce.reduce((t, f) => t + f.righe * f.colonne, 0)} posti${n ? `<br><span class="tt-extra">${n} risultati</span>` : ''}`, {
          sticky: true, className: 'tt', opacity: 1,
        });
      poly.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        cbSelect.current?.(st.schedaId);
      });
      poly.addTo(g);
      if (st.tipo === 'cappella' && cont) pin(cont, n ?? undefined);
      if (st.tipo !== 'cappella' && !compatta) {
        L.marker([st.lat, st.lng], {
          pane: 'strutture', interactive: false,
          icon: L.divIcon({ className: 'str-lbl-wrap', html: `<span class="str-lbl">${st.nome.replace('Colombario ', 'Col. ')}</span>`, iconSize: [0, 0] }),
        }).addTo(g);
      }
      if (n && !compatta) {
        L.marker([st.lat, st.lng], {
          pane: 'strutture', interactive: false,
          icon: L.divIcon({ className: 'cnt-wrap', html: `<span class="cnt">${n}</span>`, iconSize: [0, 0] }),
        }).addTo(g);
      }
    }
    for (const s of schede) {
      if (s.posizione || s.strutturaId) continue;
      pin(s);
    }
    const suZoom = () => {
      const r = raggioPin(mappa.getZoom());
      for (const c of cerchi) c.setRadius(r);
    };
    mappa.on('zoomend', suZoom);
    return () => {
      mappa.off('zoomend', suZoom);
      g.remove();
    };
  }, [mappa, schede, strutture, conteggiStrutture, coloraPer, config, tutte, stile, compatta]);

  // selezione
  useEffect(() => {
    if (!mappa || !selezionata) return;
    const s = indiceSchede(tutte).get(selezionata);
    if (!s || s.cimiteroId !== cimitero.id) return;
    const mk = L.marker([s.lat, s.lng], {
      pane: 'sel', interactive: false,
      icon: L.divIcon({ className: 'sel-wrap', html: '<span class="sel-pulse"></span><span class="sel-ring"></span>', iconSize: [0, 0] }),
    }).addTo(mappa);
    return () => {
      mk.remove();
    };
  }, [mappa, selezionata, tutte, cimitero.id]);

  // punto di partenza del censimento
  useEffect(() => {
    if (!mappa || !mostraPartenza) return;
    const mk = L.marker(cimitero.puntoPartenza, {
      pane: 'strutture',
      icon: L.divIcon({ className: 'start-wrap', html: '<span class="start-flag">Partenza</span>', iconSize: [0, 0] }),
    })
      .bindTooltip('Partenza del censimento: punta sud del cimitero', { direction: 'top', className: 'tt', offset: [0, -20] })
      .addTo(mappa);
    return () => {
      mk.remove();
    };
  }, [mappa, mostraPartenza, cimitero]);

  // disegno quadrante
  useEffect(() => {
    if (!mappa || !disegno || !disegno.length) return;
    const g = L.layerGroup().addTo(mappa);
    if (disegno.length > 2) L.polygon(disegno, { pane: 'sel', color: '#1B5A8F', weight: 2.5, dashArray: '6 5', fillOpacity: 0.15 }).addTo(g);
    else L.polyline(disegno, { pane: 'sel', color: '#1B5A8F', weight: 2.5, dashArray: '6 5' }).addTo(g);
    disegno.forEach((p, i) =>
      L.circleMarker(p, { pane: 'sel', radius: i === 0 ? 7 : 5, color: '#fff', weight: 2, fillColor: '#1B5A8F', fillOpacity: 1 }).addTo(g),
    );
    return () => {
      g.remove();
    };
  }, [mappa, disegno]);

  // vola verso un punto (ricerca, apertura scheda)
  useEffect(() => {
    if (!mappa || !volo || !segueVolo) return;
    mappa.flyTo([volo.lat, volo.lng], Math.max(mappa.getZoom(), volo.zoom), { duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappa, volo?.n]);

  return (
    <div className={`cmap ${className ?? ''}`}>
      <div ref={box} className="cmap__leaflet" />
      <MapCtx.Provider value={mappa}>{mappa && children}</MapCtx.Provider>
    </div>
  );
}

/** Contenuto React ancorato a un punto della mappa (la card della scheda, come nel mockup). */
export function MapAnchor({ lat, lng, children, offsetY = 14 }: { lat: number; lng: number; children: ReactNode; offsetY?: number }) {
  const m = useMappa();
  const [, setN] = useState(0);
  useEffect(() => {
    if (!m) return;
    const f = () => setN((n) => n + 1);
    m.on('move zoom viewreset resize', f);
    return () => {
      m.off('move zoom viewreset resize', f);
    };
  }, [m]);
  if (!m) return null;
  const p = m.latLngToContainerPoint([lat, lng]);
  const size = m.getSize();
  if (p.x < -50 || p.y < -50 || p.x > size.x + 50 || p.y > size.y + 50) return null;
  const sotto = p.y < 230;
  return (
    <div
      className={`map-anchor ${sotto ? 'map-anchor--below' : ''}`}
      style={{ transform: `translate(${p.x}px, ${p.y + (sotto ? offsetY : -offsetY)}px)` }}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export function ZoomControls({ onLocate }: { onLocate?: () => void }) {
  const m = useMappa();
  return (
    <div className="map-ctrl">
      <button className="map-ctrl__btn" onClick={() => m?.zoomIn(0.75)} aria-label="Ingrandisci">+</button>
      <button className="map-ctrl__btn" onClick={() => m?.zoomOut(0.75)} aria-label="Riduci">−</button>
      {onLocate && (
        <button className="map-ctrl__btn" onClick={onLocate} aria-label="Inquadra il cimitero" title="Inquadra il cimitero">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
        </button>
      )}
    </div>
  );
}
