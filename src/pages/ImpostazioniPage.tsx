import { useMemo, useRef, useState } from 'react';
import {
  Archive, ArchiveRestore, ArrowDown, ArrowUp, Calendar, CheckSquare, ChevronDown, Database, Download, Euro, Eye, FileClock,
  Filter, Hash, LayoutList, List, ListChecks, MapPinned, Plus, RotateCcw, Save, Smartphone, Table, Tag, ToggleRight, Trash2,
  Type, Undo2, Upload, Wand2,
} from 'lucide-react';
import { EditorLista, type Voce } from '../components/EditorLista';
import { InputCampo } from '../components/scheda/Campi';
import { Field, Icona, ICONE, Modal, Switch, Tabs } from '../components/ui';
import { TIPI_CAMPO, UFFICIO } from '../config/defaults';
import {
  aggiungiCampo, eliminaCampo, esportaBackup, idCampoLibero, importaBackup, modificaCampo, riassegnaStato, riassegnaTipologia,
  ripristinaDemo, salvaListaConfig, salvaStati, salvaTipologie, salvaViali, setConfig, sostituisciOpzione, spostaCampo, toast,
  usiCampo, usiOpzione, usiStato, usiTipologia, useStore,
} from '../data/store';
import { useCimitero } from '../data/selectors';
import type { CampoDef, ConfigScheda, TipoCampo, ValoreCampo } from '../data/types';
import { dataOra, numero, oggiISO, slug } from '../lib/format';
import { setQuery, useRotta } from '../router';

type Tab = 'campi' | 'stati' | 'tipologie' | 'elenchi' | 'dati' | 'registro';

const ICONE_TIPO: Record<TipoCampo, React.ReactNode> = {
  flag: <ToggleRight size={15} />, select: <ChevronDown size={15} />, multiselect: <ListChecks size={15} />, testo: <Type size={15} />,
  testo_lungo: <LayoutList size={15} />, numero: <Hash size={15} />, importo: <Euro size={15} />, data: <Calendar size={15} />,
};

export function ImpostazioniPage() {
  const rotta = useRotta();
  const tab = (rotta.query.get('tab') as Tab) ?? 'campi';
  const config = useStore((s) => s.config);
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Impostazioni</h1>
        </div>
        <span className="badge badge--outline"><Save size={13} />Versione configurazione {config.versione} · salvataggio automatico</span>
      </div>
      <Tabs value={tab} onChange={(t) => setQuery('tab', t)} tabs={[
        { id: 'campi', label: 'Scheda Pro · campi', icon: <Wand2 size={16} />, count: config.campi.filter((c) => !c.archiviato).length },
        { id: 'stati', label: 'Stati', icon: <Tag size={16} />, count: config.stati.length },
        { id: 'tipologie', label: 'Tipologie', icon: <LayoutList size={16} />, count: config.tipologie.length },
        { id: 'elenchi', label: 'Elenchi', icon: <List size={16} /> },
        { id: 'dati', label: 'Cimitero e dati', icon: <Database size={16} /> },
        { id: 'registro', label: 'Registro modifiche', icon: <FileClock size={16} />, count: config.registro.length },
      ]} />
      {tab === 'campi' && <SchedaPro />}
      {tab === 'stati' && <Stati />}
      {tab === 'tipologie' && <Tipologie />}
      {tab === 'elenchi' && <Elenchi />}
      {tab === 'dati' && <Dati />}
      {tab === 'registro' && <Registro />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scheda Pro: il configuratore dei campi
// ---------------------------------------------------------------------------

function nuovoCampo(tipo: TipoCampo, label: string, sezione: string, config: ConfigScheda): CampoDef {
  return {
    id: idCampoLibero(label, config), label, tipo, sezione,
    opzioni: tipo === 'select' || tipo === 'multiselect' ? [{ id: 'opzione_1', label: 'Opzione 1', colore: '#2F6FB3' }, { id: 'opzione_2', label: 'Opzione 2', colore: '#79AA4F' }] : undefined,
    inFiltri: tipo === 'flag' || tipo === 'select' || tipo === 'multiselect', inTabella: false, inExport: true, inPopup: tipo === 'flag', inApp: true,
    icona: tipo === 'flag' ? 'box' : undefined, unita: tipo === 'importo' ? '€' : undefined,
  };
}

function ModaleNuovoCampo({ onChiudi, onCreato }: { onChiudi: () => void; onCreato: (id: string) => void }) {
  const config = useStore((s) => s.config);
  const [tipo, setTipo] = useState<TipoCampo>('flag');
  const [label, setLabel] = useState('');
  const [sezione, setSezione] = useState(config.sezioni[0]?.id ?? 'flag');
  const crea = () => {
    if (!label.trim()) return toast('Scrivi il nome del campo', 'errore');
    const c = nuovoCampo(tipo, label.trim(), sezione, config);
    aggiungiCampo(c);
    toast(`Campo “${c.label}” aggiunto a tutte le schede`);
    onCreato(c.id);
    onChiudi();
  };
  return (
    <Modal titolo="Nuovo campo della scheda" sottotitolo="Compare subito nella scheda, nel rilievo sul campo, nei filtri e nelle esportazioni." onClose={onChiudi} size="lg"
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={crea}><Plus size={16} />Aggiungi campo</button></>}>
      <div className="col gap-16">
        <div className="tipi-campo">
          {TIPI_CAMPO.map((t) => (
            <button key={t.id} type="button" className={`tipo-campo ${tipo === t.id ? 'is-on' : ''}`} onClick={() => setTipo(t.id)}>
              <span className="tipo-campo__ico">{ICONE_TIPO[t.id]}</span>
              <b>{t.label}</b>
              <span className="tiny muted">{t.descrizione}</span>
            </button>
          ))}
        </div>
        <div className="grid-form">
          <Field label="Nome del campo"><input className="input" autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder={tipo === 'flag' ? 'es. Fiori artificiali' : tipo === 'select' ? 'es. Tipo di sepoltura' : 'es. Numero pratica'} onKeyDown={(e) => e.key === 'Enter' && crea()} /></Field>
          <Field label="Sezione">
            <select className="select" value={sezione} onChange={(e) => setSezione(e.target.value)}>
              {config.sezioni.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function EditorCampo({ campo, onEliminato }: { campo: CampoDef; onEliminato: () => void }) {
  const config = useStore((s) => s.config);
  const [b, setB] = useState<CampoDef>(campo);
  const [chiave, setChiave] = useState(campo.id);
  if (chiave !== campo.id) {
    setChiave(campo.id);
    setB(campo);
  }
  const set = (p: Partial<CampoDef>) => setB((x) => ({ ...x, ...p }));
  const n = usiCampo(campo.id);
  const { opzioni: _o1, ...restoB } = b;
  const { opzioni: _o2, ...restoC } = campo;
  void _o1;
  void _o2;
  const modificato = JSON.stringify(restoB) !== JSON.stringify(restoC);
  const conOpzioni = b.tipo === 'select' || b.tipo === 'multiselect';

  const salva = () => {
    if (!b.label.trim()) return toast('Il nome non può essere vuoto', 'errore');
    const cambi: string[] = [];
    if (b.label !== campo.label) cambi.push(`rinominato da “${campo.label}” a “${b.label}”`);
    if (b.tipo !== campo.tipo) cambi.push(`tipo: ${campo.tipo} → ${b.tipo}`);
    if (b.sezione !== campo.sezione) cambi.push('spostato di sezione');
    for (const k of ['inFiltri', 'inTabella', 'inExport', 'inPopup', 'inApp', 'obbligatorio'] as const) if (b[k] !== campo[k]) cambi.push(`${k} ${b[k] ? 'attivo' : 'disattivo'}`);
    const patch: Partial<CampoDef> = { ...restoB };
    if (conOpzioni && !campo.opzioni?.length) patch.opzioni = [{ id: 'opzione_1', label: 'Opzione 1', colore: '#2F6FB3' }];
    modificaCampo(campo.id, patch, `Campo “${b.label}”: ${cambi.join(', ') || 'impostazioni aggiornate'}`);
    toast('Campo aggiornato');
  };

  const toggles: { k: 'inFiltri' | 'inTabella' | 'inExport' | 'inPopup' | 'inApp' | 'obbligatorio'; label: string; icon: React.ReactNode; aiuto: string }[] = [
    { k: 'inApp', label: 'Visibile nel rilievo', icon: <Smartphone size={15} />, aiuto: 'Lo compila l’operatore sul campo' },
    { k: 'inFiltri', label: 'Mostra nei filtri', icon: <Filter size={15} />, aiuto: 'Ricerca e mappa' },
    { k: 'inTabella', label: 'Colonna in Ricerca', icon: <Table size={15} />, aiuto: 'Tabella dei risultati' },
    { k: 'inExport', label: 'Nelle esportazioni', icon: <Download size={15} />, aiuto: 'Excel e PDF' },
    { k: 'inPopup', label: 'Nel popup della mappa', icon: <MapPinned size={15} />, aiuto: 'Card del pin (flag attivi)' },
    { k: 'obbligatorio', label: 'Obbligatorio', icon: <CheckSquare size={15} />, aiuto: 'Non si salva senza' },
  ];

  return (
    <div className="campo-ed">
      <div className="campo-ed__head">
        <span className="tipo-campo__ico">{ICONE_TIPO[b.tipo]}</span>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="tiny muted">Chiave nei dati: <code>{campo.id}</code> · usato in {numero(n)} schede</div>
          <h2 className="ellipsis">{b.label || 'Senza nome'}</h2>
        </div>
        {campo.archiviato && <span className="badge badge--giallo">Archiviato</span>}
      </div>

      <div className="grid-form">
        <Field label="Nome del campo" hint="Rinominare non tocca i dati: la chiave resta la stessa">
          <input className="input" value={b.label} onChange={(e) => set({ label: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && modificato && salva()} />
        </Field>
        <Field label="Tipo">
          <select className="select" value={b.tipo} onChange={(e) => set({ tipo: e.target.value as TipoCampo })}>
            {TIPI_CAMPO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {b.tipo !== campo.tipo && n > 0 && <span className="field__hint" style={{ color: '#a85710' }}>Attenzione: {n} schede hanno già un valore, potrebbe non essere compatibile.</span>}
        </Field>
        <Field label="Sezione della scheda">
          <select className="select" value={b.sezione} onChange={(e) => set({ sezione: e.target.value })}>
            {config.sezioni.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        {b.tipo === 'flag' ? (
          <Field label="Icona">
            <div className="row row--wrap gap-4">
              {Object.keys(ICONE).map((k) => (
                <button key={k} type="button" className={`icon-pick ${b.icona === k ? 'is-on' : ''}`} onClick={() => set({ icona: k })} title={k}><Icona nome={k} size={16} /></button>
              ))}
            </div>
          </Field>
        ) : b.tipo === 'numero' || b.tipo === 'importo' ? (
          <Field label="Unità di misura"><input className="input" value={b.unita ?? ''} onChange={(e) => set({ unita: e.target.value })} placeholder={b.tipo === 'importo' ? '€/anno' : 'm, kg…'} /></Field>
        ) : <div />}
        <Field label="Testo di aiuto" className="span-2"><input className="input" value={b.aiuto ?? ''} onChange={(e) => set({ aiuto: e.target.value })} placeholder="Spiegazione breve per chi compila" /></Field>
        <Field label="Vale per le tipologie" className="span-2" hint="Nessuna selezione = tutte le tipologie">
          <div className="row row--wrap gap-4">
            {config.tipologie.map((t) => {
              const on = !!b.applicaA?.includes(t.id);
              return (
                <button key={t.id} type="button" className={`chip chip--sm ${on ? 'is-on' : ''}`} onClick={() => set({ applicaA: on ? b.applicaA!.filter((x) => x !== t.id) : [...(b.applicaA ?? []), t.id] })}>
                  <Icona nome={t.icona} size={13} color={t.colore} />{t.label}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="toggles">
        {toggles.map((t) => (
          <label key={t.k} className="toggle-row">
            <span className="toggle-row__ico">{t.icon}</span>
            <span className="grow"><b>{t.label}</b><span className="tiny muted">{t.aiuto}</span></span>
            <Switch small on={!!b[t.k]} onChange={(v) => set({ [t.k]: v } as Partial<CampoDef>)} label={t.label} />
          </label>
        ))}
      </div>

      {modificato && (
        <div className="campo-ed__save">
          <span className="small strong">Modifiche non salvate</span>
          <button className="btn btn--sm btn--ghost" onClick={() => setB(campo)}><Undo2 size={14} />Annulla</button>
          <button className="btn btn--sm btn--primary" onClick={salva}><Save size={14} />Salva campo</button>
        </div>
      )}

      {conOpzioni && campo.opzioni && (
        <div className="mt-16">
          <h3 className="section-title" style={{ marginTop: 0 }}>Voci del menu a tendina</h3>
          <EditorLista
            voci={campo.opzioni.map((o) => ({ id: o.id, label: o.label, colore: o.colore, archiviato: o.archiviata }))}
            nomeVoce="opzione"
            minimo={1}
            usi={(id) => usiOpzione(campo.id, id)}
            onElimina={(id, a) => sostituisciOpzione(campo.id, id, a)}
            onSalva={(voci: Voce[], descr) => {
              const vecchie = new Map(campo.opzioni!.map((o) => [o.id, o]));
              const opzioni = voci.map((v) => ({ id: vecchie.has(v.id) ? v.id : uniqueId(slug(v.label), voci, v.id), label: v.label.trim(), colore: v.colore, archiviata: v.archiviato || undefined }));
              modificaCampo(campo.id, { opzioni }, `Menu “${campo.label}”: ${descr}`);
              toast('Voci aggiornate');
            }}
          />
        </div>
      )}

      <div className="zona-rischio">
        {campo.archiviato ? (
          <button className="btn btn--sm" onClick={() => { modificaCampo(campo.id, { archiviato: false }, `Ripristinato il campo “${campo.label}”`); toast('Campo ripristinato'); }}><ArchiveRestore size={14} />Ripristina campo</button>
        ) : (
          <button className="btn btn--sm" onClick={() => { modificaCampo(campo.id, { archiviato: true }, `Archiviato il campo “${campo.label}”`); toast('Campo archiviato: i dati restano'); }}><Archive size={14} />Archivia (nasconde, i dati restano)</button>
        )}
        <button
          className="btn btn--sm btn--danger"
          onClick={() => {
            if (n > 0 && !confirm(`Il campo “${campo.label}” ha un valore in ${n} schede. Eliminandolo quei dati vanno persi. Procedere?`)) return;
            eliminaCampo(campo.id);
            toast('Campo eliminato');
            onEliminato();
          }}
        >
          <Trash2 size={14} />Elimina definitivamente
        </button>
      </div>
    </div>
  );
}

function uniqueId(base: string, voci: Voce[], proprio: string) {
  let id = base || 'opzione';
  let k = 2;
  while (voci.some((v) => v.id === id && v.id !== proprio)) id = `${base}_${k++}`;
  return id;
}

function AnteprimaScheda({ evidenzia }: { evidenzia?: string }) {
  const config = useStore((s) => s.config);
  const [tip, setTip] = useState('loculo');
  const [valori, setValori] = useState<Record<string, ValoreCampo>>({ lampada_votiva: true });
  const campi = config.campi.filter((c) => !c.archiviato && c.inApp && (!c.applicaA?.length || c.applicaA.includes(tip)));
  return (
    <div className="anteprima">
      <div className="anteprima__phone">
        <div className="anteprima__bar"><span className="wordmark__name" style={{ fontSize: 15, color: '#fff' }}>Cimi<span style={{ color: '#8bbd5e' }}>APP</span></span><span className="tiny" style={{ color: '#a9bcd2' }}>Rilievo</span></div>
        <div className="anteprima__body">
          <div className="row row--between"><b>Scheda {config.tipologie.find((t) => t.id === tip)?.label.toLowerCase()}</b>
            <select className="select select--sm" style={{ width: 'auto' }} value={tip} onChange={(e) => setTip(e.target.value)} aria-label="Tipologia dell'anteprima">
              {config.tipologie.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          {config.sezioni.map((s) => {
            const cs = campi.filter((c) => c.sezione === s.id);
            if (!cs.length) return null;
            return (
              <div key={s.id} className="col gap-8">
                <div className="upper muted" style={{ fontSize: 10 }}>{s.label}</div>
                <div className="row row--wrap gap-4">
                  {cs.filter((c) => c.tipo === 'flag').map((c) => (
                    <span key={c.id} className={c.id === evidenzia ? 'anteprima__hl' : ''}>
                      <InputCampo campo={c} compatto valore={valori[c.id]} onChange={(v) => setValori({ ...valori, [c.id]: v })} />
                    </span>
                  ))}
                </div>
                {cs.filter((c) => c.tipo !== 'flag').map((c) => (
                  <div key={c.id} className={`field ${c.id === evidenzia ? 'anteprima__hl' : ''}`}>
                    <label>{c.label}{c.obbligatorio && <span className="field__req">*</span>}</label>
                    <InputCampo campo={c} compatto valore={valori[c.id]} onChange={(v) => setValori({ ...valori, [c.id]: v })} />
                  </div>
                ))}
              </div>
            );
          })}
          {!campi.length && <p className="small muted">Nessun campo visibile nel rilievo per questa tipologia.</p>}
        </div>
      </div>
      <p className="tiny muted" style={{ textAlign: 'center' }}>Anteprima del modulo sul telefono dell'operatore: si aggiorna a ogni modifica salvata.</p>
    </div>
  );
}

function SchedaPro() {
  const config = useStore((s) => s.config);
  const [sel, setSel] = useState<string | null>(config.campi[0]?.id ?? null);
  const [nuovo, setNuovo] = useState(false);
  const [vediArchiviati, setVediArchiviati] = useState(false);
  const [nuovaSez, setNuovaSez] = useState('');
  const campo = config.campi.find((c) => c.id === sel);
  const usi = useMemo(() => Object.fromEntries(config.campi.map((c) => [c.id, usiCampo(c.id)])), [config.campi]);

  return (
    <>
      <div className="callout mb-16">
        <Wand2 size={18} />
        <div>
          <b>Il censimento cambia in fretta: qui lo adegui da solo.</b> Aggiungi o rinomina un flag, crea un menu a tendina, cambia le voci al suo interno.
          Ogni modifica vale subito per scheda, rilievo sul campo, filtri, mappa ed esportazioni. I dati già raccolti non si perdono.
        </div>
      </div>
      <div className="pro">
        <section className="card pro__list">
          <div className="card__head">
            <h3>Campi della scheda</h3>
            <button className="btn btn--sm btn--primary" onClick={() => setNuovo(true)}><Plus size={14} />Nuovo campo</button>
          </div>
          <div className="pro__sezioni">
            {config.sezioni.map((sez) => {
              const campi = config.campi.filter((c) => c.sezione === sez.id && !c.archiviato);
              return (
                <div key={sez.id} className="pro__sez">
                  <div className="pro__sez-head">
                    <input
                      className="pro__sez-nome"
                      defaultValue={sez.label}
                      aria-label="Nome della sezione"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== sez.label) setConfig((c) => ({ sezioni: c.sezioni.map((x) => (x.id === sez.id ? { ...x, label: v } : x)) }), `Sezione rinominata in “${v}”`);
                      }}
                    />
                    {!config.campi.some((c) => c.sezione === sez.id) && (
                      <button className="btn btn--xs btn--icon btn--ghost btn--danger" title="Elimina sezione vuota" onClick={() => setConfig((c) => ({ sezioni: c.sezioni.filter((x) => x.id !== sez.id) }), `Eliminata la sezione “${sez.label}”`)}><Trash2 size={13} /></button>
                    )}
                  </div>
                  {campi.map((c, i) => (
                    <div key={c.id} className={`pro__campo ${sel === c.id ? 'is-sel' : ''}`} onClick={() => setSel(c.id)}>
                      <span className="pro__ord" onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn--xs btn--icon btn--ghost" disabled={i === 0} onClick={() => spostaCampo(c.id, -1)} aria-label="Sposta su"><ArrowUp size={12} /></button>
                        <button className="btn btn--xs btn--icon btn--ghost" disabled={i === campi.length - 1} onClick={() => spostaCampo(c.id, 1)} aria-label="Sposta giù"><ArrowDown size={12} /></button>
                      </span>
                      <span className="tipo-campo__ico tipo-campo__ico--sm">{ICONE_TIPO[c.tipo]}</span>
                      <span className="grow" style={{ minWidth: 0 }}>
                        <b className="ellipsis" style={{ display: 'block' }}>{c.label}</b>
                        <span className="tiny muted">{TIPI_CAMPO.find((t) => t.id === c.tipo)?.label}{c.opzioni ? ` · ${c.opzioni.filter((o) => !o.archiviata).length} voci` : ''} · {numero(usi[c.id] ?? 0)} schede</span>
                      </span>
                      <span className="pro__flags">
                        {c.inApp && <Smartphone size={13} aria-label="Nel rilievo" />}
                        {c.inFiltri && <Filter size={13} aria-label="Nei filtri" />}
                        {c.inExport && <Download size={13} aria-label="Nelle esportazioni" />}
                      </span>
                    </div>
                  ))}
                  {!campi.length && <p className="tiny muted" style={{ padding: '4px 10px 10px' }}>Nessun campo in questa sezione.</p>}
                </div>
              );
            })}
            <form className="row gap-4" style={{ padding: 12 }} onSubmit={(e) => { e.preventDefault(); const v = nuovaSez.trim(); if (!v) return; setConfig((c) => ({ sezioni: [...c.sezioni, { id: idSez(v, c), label: v }] }), `Nuova sezione “${v}”`); setNuovaSez(''); }}>
              <input className="input input--sm" placeholder="Nuova sezione, es. Pratiche" value={nuovaSez} onChange={(e) => setNuovaSez(e.target.value)} />
              <button className="btn btn--sm" disabled={!nuovaSez.trim()}><Plus size={14} /></button>
            </form>
            {config.campi.some((c) => c.archiviato) && (
              <div className="pro__sez">
                <button className="pro__sez-head btn--ghost" style={{ border: 'none', width: '100%', textAlign: 'left' }} onClick={() => setVediArchiviati(!vediArchiviati)}>
                  <Archive size={14} /> <b className="small">Archiviati ({config.campi.filter((c) => c.archiviato).length})</b>
                </button>
                {vediArchiviati && config.campi.filter((c) => c.archiviato).map((c) => (
                  <div key={c.id} className={`pro__campo is-arch ${sel === c.id ? 'is-sel' : ''}`} onClick={() => setSel(c.id)}>
                    <span className="tipo-campo__ico tipo-campo__ico--sm">{ICONE_TIPO[c.tipo]}</span>
                    <b className="grow">{c.label}</b>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="card card--pad pro__editor">
          {campo ? <EditorCampo campo={campo} onEliminato={() => setSel(config.campi.find((c) => c.id !== campo.id)?.id ?? null)} /> : <p className="muted">Seleziona un campo a sinistra o creane uno nuovo.</p>}
        </section>
        <aside className="pro__preview">
          <AnteprimaScheda evidenzia={sel ?? undefined} />
        </aside>
      </div>
      {nuovo && <ModaleNuovoCampo onChiudi={() => setNuovo(false)} onCreato={setSel} />}
    </>
  );
}

function idSez(label: string, c: ConfigScheda) {
  let id = slug(label);
  let k = 2;
  while (c.sezioni.some((s) => s.id === id)) id = `${slug(label)}_${k++}`;
  return id;
}

// ---------------------------------------------------------------------------

function Stati() {
  const config = useStore((s) => s.config);
  return (
    <section className="card card--pad">
      <h3>Stati della postazione</h3>
      <p className="small muted mb-16">Colore del pin sulla mappa e della legenda. Il numero indica quante schede hanno quello stato.</p>
      <EditorLista
        voci={config.stati.map((s) => ({ id: s.id, label: s.label, colore: s.colore, descrizione: s.descrizione, archiviato: s.archiviato }))}
        nomeVoce="stato"
        conDescrizione
        minimo={2}
        usi={usiStato}
        onElimina={(id, a) => a && riassegnaStato(id, a)}
        onSalva={(voci, d) => { salvaStati(voci.map((v) => ({ id: v.id, label: v.label.trim(), colore: v.colore ?? '#9AA6B2', descrizione: v.descrizione, archiviato: v.archiviato || undefined })), `Stati: ${d}`); toast('Stati aggiornati'); }}
      />
    </section>
  );
}

function Tipologie() {
  const config = useStore((s) => s.config);
  return (
    <section className="card card--pad">
      <h3>Tipologie (classificazione)</h3>
      <p className="small muted mb-16">Loculo, tomba, cappella, colombaio, vuota, in costruzione… Cappella e colombaio contengono una griglia di loculi a parete.</p>
      <EditorLista
        voci={config.tipologie.map((t) => ({ id: t.id, label: t.label, colore: t.colore, icona: t.icona, archiviato: t.archiviata }))}
        nomeVoce="tipologia"
        conIcona
        minimo={2}
        usi={usiTipologia}
        onElimina={(id, a) => a && riassegnaTipologia(id, a)}
        onSalva={(voci, d) => {
          salvaTipologie(voci.map((v) => ({ id: v.id, label: v.label.trim(), colore: v.colore ?? '#9AA6B2', icona: v.icona ?? 'box', contenitore: config.tipologie.find((t) => t.id === v.id)?.contenitore, archiviata: v.archiviato || undefined })), `Tipologie: ${d}`);
          toast('Tipologie aggiornate');
        }}
      />
    </section>
  );
}

function Elenchi() {
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const cim = useCimitero();
  const lista = (chiave: 'categorieManutenzione' | 'motiviVerifica', titolo: string, testo: string, nome: string, usi: (id: string) => number) => (
    <section className="card card--pad">
      <h3>{titolo}</h3>
      <p className="small muted mb-16">{testo}</p>
      <EditorLista
        voci={config[chiave].map((o) => ({ id: o.id, label: o.label, archiviato: o.archiviata }))}
        conColore={false}
        compatto
        nomeVoce={nome}
        usi={usi}
        onSalva={(voci, d) => { salvaListaConfig(chiave, voci.map((v) => ({ id: v.id, label: v.label.trim(), archiviata: v.archiviato || undefined })), `${titolo}: ${d}`); toast('Elenco aggiornato'); }}
      />
    </section>
  );
  return (
    <div className="elenchi-grid">
      {lista('categorieManutenzione', 'Categorie di manutenzione', 'Tipi di problema che l’operatore può segnalare.', 'categoria', (id) => db.manutenzioni.filter((m) => m.categoria === id).length)}
      {lista('motiviVerifica', 'Motivi di verifica', 'Perché una scheda viene assegnata per un controllo.', 'motivo', (id) => db.verifiche.filter((v) => v.motivo === id).length)}
      <section className="card card--pad">
        <h3>Viali · {cim.breve}</h3>
        <p className="small muted mb-16">Rinominare un viale aggiorna tutte le schede che lo usano.</p>
        <EditorLista
          voci={db.viali.filter((v) => v.cimiteroId === cim.id).map((v) => ({ id: v.id, label: v.nome }))}
          conColore={false}
          compatto
          nomeVoce="viale"
          usi={(id) => { const v = db.viali.find((x) => x.id === id); return v ? db.schede.filter((s) => s.cimiteroId === cim.id && s.viale === v.nome).length : 0; }}
          onSalva={(voci) => { salvaViali(cim.id, voci.map((v) => ({ id: v.id, nome: v.label.trim() }))); toast('Viali aggiornati'); }}
        />
      </section>
    </div>
  );
}

function Dati() {
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const file = useRef<HTMLInputElement>(null);
  const scarica = () => {
    const blob = new Blob([esportaBackup()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CimiTera_backup_${oggiISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="elenchi-grid">
      <section className="card card--pad">
        <h3>{cim.nome}</h3>
        <dl className="kv mt-12">
          <dt>Codice per gli ID</dt><dd className="mono">CIM-{cim.codice}-000001</dd>
          <dt>Comune</dt><dd>{cim.comune}</dd>
          <dt>Perimetro</dt><dd>{cim.fonteGeometria}</dd>
          <dt>Partenza censimento</dt><dd className="mono">{cim.puntoPartenza[0].toFixed(6)}, {cim.puntoPartenza[1].toFixed(6)} (punta sud)</dd>
          <dt>Schede</dt><dd>{numero(db.schede.filter((s) => s.cimiteroId === cim.id).length)}</dd>
          <dt>Utente</dt><dd>{UFFICIO} · Amministratore</dd>
        </dl>
      </section>
      <section className="card card--pad">
        <h3>Backup e ripristino</h3>
        <p className="small muted mt-8">In questa versione dimostrativa i dati restano nel browser (IndexedDB). Il backup contiene schede, configurazione e foto caricate.</p>
        <div className="col gap-8 mt-16">
          <button className="btn" onClick={scarica}><Download size={16} />Scarica backup completo (JSON)</button>
          <button className="btn" onClick={() => file.current?.click()}><Upload size={16} />Importa un backup</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { importaBackup(await f.text()); } catch (err) { toast((err as Error).message, 'errore'); } }} />
          <button className="btn btn--danger" onClick={() => { if (confirm('Ripristinare i dati dimostrativi? Le modifiche fatte in questo browser andranno perse.')) ripristinaDemo(); }}><RotateCcw size={16} />Ripristina i dati dimostrativi</button>
        </div>
      </section>
      <section className="card card--pad">
        <h3>Configurazione</h3>
        <p className="small muted mt-8">Versione {config.versione} · {config.campi.length} campi · {config.stati.length} stati · {config.tipologie.length} tipologie.</p>
        <p className="small muted mt-8">Lo stesso motore di configurazione può servire altri censimenti (per esempio le letture dei contatori dell'acqua): cambiano solo campi e tipologie.</p>
      </section>
    </div>
  );
}

function Registro() {
  const config = useStore((s) => s.config);
  return (
    <section className="card">
      <div className="card__head"><h3>Registro delle modifiche alla configurazione</h3><Eye size={16} /></div>
      <div className="list">
        {config.registro.length === 0 && <p className="small muted" style={{ padding: 16 }}>Nessuna modifica ancora: prova ad aggiungere un flag in Scheda Pro.</p>}
        {config.registro.map((r, i) => (
          <div key={i} className="list-item">
            <span className="grow"><b className="small">{r.descrizione}</b></span>
            <span className="tiny muted nowrap">{r.utente} · {dataOra(r.data)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
