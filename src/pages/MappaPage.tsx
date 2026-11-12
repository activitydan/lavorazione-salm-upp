import { useMemo, useState } from 'react';
import type L from 'leaflet';
import { List, Navigation, PanelLeftOpen, SlidersHorizontal, X } from 'lucide-react';
import { CemeteryMap, MapAnchor, ZoomControls } from '../components/map/CemeteryMap';
import { FilterPanel } from '../components/FilterPanel';
import { Dot, Seg, Switch } from '../components/ui';
import { indiceSchede, seleziona, setFiltri, setUi, useStore } from '../data/store';
import {
  campiPer, conta, contaFiltriAttivi, descrizioneScheda, occupazioneStruttura, statoDef, tipologiaDef, useCimitero, useDatiCimitero,
  useSchedeCimitero, useSchedeFiltrate,
} from '../data/selectors';
import type { Scheda } from '../data/types';
import { anniFa, data, numero } from '../lib/format';
import { googleMapsIndicazioni } from '../lib/geo';
import { fotoUrl } from '../lib/photo';
import { vai } from '../router';

export function useConteggiStrutture(filtrate: Scheda[], attivi: boolean) {
  return useMemo(() => {
    if (!attivi) return null;
    const m = new Map<string, number>();
    for (const s of filtrate) {
      const id = s.posizione?.strutturaId ?? s.strutturaId;
      if (id) m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [filtrate, attivi]);
}

export function MapCard({ s, onChiudi }: { s: Scheda; onChiudi: () => void }) {
  const config = useStore((st) => st.config);
  const foto = useStore((st) => st.foto);
  const db = useStore((st) => st.db);
  const st = statoDef(config, s.stato);
  const struttura = s.strutturaId ? db.strutture.find((x) => x.id === s.strutturaId) : undefined;
  const occ = struttura ? occupazioneStruttura(db.schede, struttura.id) : null;
  const flag = campiPer(config, s.tipologia, (c) => c.tipo === 'flag' && c.inPopup && s.campi[c.id] === true);
  const d = s.defunti[0];
  return (
    <div className="map-card" role="dialog" aria-label={`Scheda ${s.id}`}>
      <button className="btn btn--ghost btn--icon btn--xs map-card__close" onClick={onChiudi} aria-label="Chiudi"><X size={14} /></button>
      <div className="map-card__top">
        <img className="map-card__thumb" src={fotoUrl(s, foto)} alt="" />
        <div style={{ minWidth: 0 }}>
          <div className="map-card__id">{s.id}</div>
          <div className="map-card__sub">{tipologiaDef(config, s.tipologia).label} · {s.viale}</div>
          <div className="row gap-4" style={{ marginTop: 3 }}>
            <Dot colore={st.colore} />
            <b className="small">{st.label}</b>
          </div>
        </div>
      </div>
      <div className="map-card__name ellipsis">{descrizioneScheda(s)}</div>
      {d?.dataMorte && <div className="small muted">† {data(d.dataMorte)} · {anniFa(d.dataMorte)}</div>}
      {occ && <div className="small muted">{occ.occupati} occupati su {occ.totale} posti</div>}
      {flag.length > 0 && (
        <div className="map-card__flags">
          {flag.map((c) => <span key={c.id} className="badge badge--blu badge--sm">{c.label}</span>)}
        </div>
      )}
      <div className="map-card__actions">
        <button className="btn btn--primary btn--sm grow" onClick={() => setUi({ pannello: true })}>Apri scheda</button>
        <a className="btn btn--sm" href={googleMapsIndicazioni(s.lat, s.lng)} target="_blank" rel="noreferrer"><Navigation size={14} />Indicazioni</a>
      </div>
    </div>
  );
}

export function MappaPage() {
  const cimitero = useCimitero();
  const tutte = useSchedeCimitero();
  const filtrate = useSchedeFiltrate();
  const filtri = useStore((s) => s.filtri);
  const config = useStore((s) => s.config);
  const ui = useStore((s) => s.ui);
  const schede = useStore((s) => s.db.schede);
  const { quadranti, viali, aree, strutture } = useDatiCimitero();
  const [pannelloFiltri, setPannelloFiltri] = useState(() => window.innerWidth > 1100);
  const [mostraQuadranti, setMostraQuadranti] = useState(false);
  const [mappa, setMappa] = useState<L.Map | null>(null);
  const attivi = contaFiltriAttivi(filtri);
  const conteggi = useConteggiStrutture(filtrate, attivi > 0);
  const sel = ui.selezionata ? indiceSchede(schede).get(ui.selezionata) : undefined;
  const perLegenda = useMemo(() => conta(filtrate, (s) => (ui.coloraPer === 'stato' ? s.stato : s.tipologia)), [filtrate, ui.coloraPer]);

  if (!cimitero) return null;
  const voci = ui.coloraPer === 'stato' ? config.stati.filter((s) => !s.archiviato) : config.tipologie.filter((t) => !t.archiviata);

  return (
    <div className="mappa-page">
      {pannelloFiltri && (
        <aside className="mappa-page__filtri">
          <FilterPanel risultati={filtrate.length} totale={tutte.length} onChiudi={() => setPannelloFiltri(false)} />
        </aside>
      )}
      <div className="mappa-page__map">
        <CemeteryMap
          cimitero={cimitero}
          schede={filtrate}
          strutture={strutture}
          conteggiStrutture={conteggi}
          quadranti={quadranti}
          mostraQuadranti={mostraQuadranti}
          viali={viali}
          aree={aree}
          stile={ui.stileMappa}
          coloraPer={ui.coloraPer}
          selezionata={ui.selezionata}
          onSelect={(id) => seleziona(id, { pannello: false })}
          onMapClick={undefined}
          mostraPartenza
          onReady={setMappa}
        >
          <ZoomControls onLocate={() => mappa?.fitBounds(cimitero.perimetro, { padding: [20, 20] })} />
          {sel && !ui.pannello && sel.cimiteroId === cimitero.id && (
            <MapAnchor lat={sel.lat} lng={sel.lng}>
              <MapCard s={sel} onChiudi={() => seleziona(null)} />
            </MapAnchor>
          )}
        </CemeteryMap>

        <div className="map-toolbar">
          {!pannelloFiltri && (
            <button className="btn btn--sm map-toolbar__btn" onClick={() => setPannelloFiltri(true)}>
              {window.innerWidth > 760 ? <PanelLeftOpen size={15} /> : <SlidersHorizontal size={15} />} Filtri{attivi ? ` (${attivi})` : ''}
            </button>
          )}
          <div className="map-toolbar__box">
            <span className="small strong">Colora per</span>
            <Seg small light value={ui.coloraPer} onChange={(v) => setUi({ coloraPer: v })} options={[{ id: 'stato', label: 'Stato' }, { id: 'tipologia', label: 'Tipologia' }]} />
          </div>
          <label className="map-toolbar__box" style={{ cursor: 'pointer' }}>
            <span className="small strong">Quadranti</span>
            <Switch small on={mostraQuadranti} onChange={setMostraQuadranti} label="Mostra quadranti" />
          </label>
          <button className="btn btn--sm map-toolbar__btn" onClick={() => vai('/ricerca')} title="Stesse schede in elenco"><List size={15} />Elenco</button>
        </div>

        {cimitero.censimento.stato === 'da_avviare' && (
          <div className="map-empty">
            <b>{cimitero.nome}</b>
            <p className="small muted">Il censimento di questo cimitero non è ancora iniziato.</p>
            <button className="btn btn--success btn--sm mt-8" onClick={() => vai('/rilievo')}>Avvia il primo rilievo</button>
          </div>
        )}

        <div className="map-legend">
          {voci.map((v) => {
            const on = ui.coloraPer === 'stato' ? filtri.stati.length === 0 || filtri.stati.includes(v.id) : filtri.tipologie.length === 0 || filtri.tipologie.includes(v.id);
            const lista = ui.coloraPer === 'stato' ? filtri.stati : filtri.tipologie;
            return (
              <button
                key={v.id}
                className={`map-legend__item ${on ? '' : 'is-off'}`}
                title="Clic per filtrare"
                onClick={() => {
                  const nuova = lista.length === 1 && lista[0] === v.id ? [] : lista.includes(v.id) ? lista.filter((x) => x !== v.id) : [...lista, v.id];
                  setFiltri(ui.coloraPer === 'stato' ? { stati: nuova } : { tipologie: nuova });
                }}
              >
                <Dot colore={ui.coloraPer === 'stato' ? v.colore : tipologiaDef(config, v.id).colore} size="lg" />
                {v.label}
                <span className="n">{numero(perLegenda[v.id] ?? 0)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
