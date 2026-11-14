import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { nomiConcessionari } from '../data/concessioni';
import { COLORI_OPERAZIONE, NOMI_OPERAZIONE, TIPI_OPERAZIONE, fineTurno } from '../data/pratiche';
import { labelLista, NOMI_CATEGORIA_ALERT, useCimitero, useUtente } from '../data/selectors';
import { useStore } from '../data/store';
import type { ConfigScheda, Database, TipoOperazione } from '../data/types';
import { GIORNI_BREVI, meseAnno, nomeCompleto, oggiISO } from '../lib/format';
import { vai } from '../router';

// Calendario unico: tutto ciò che è in programma, diviso in "calendari" che si accendono e si spengono
// (come in un calendario condiviso). Ognuno può vedere solo le sue cose.

export type IdCalendario = TipoOperazione | 'manutenzione' | 'verifica' | 'scadenza';

export const CALENDARI: { id: IdCalendario; label: string; colore: string }[] = [
  ...TIPI_OPERAZIONE.map((t) => ({ id: t as IdCalendario, label: NOMI_CATEGORIA_ALERT[t], colore: COLORI_OPERAZIONE[t] })),
  { id: 'manutenzione', label: 'Manutenzioni', colore: '#D9473F' },
  { id: 'verifica', label: 'Verifiche', colore: '#B8860B' },
  { id: 'scadenza', label: 'Scadenze', colore: '#64748B' },
];
const COLORE = Object.fromEntries(CALENDARI.map((c) => [c.id, c.colore])) as Record<IdCalendario, string>;
// nello stesso giorno: prima le operazioni, poi manutenzioni e scadenze, le verifiche in fondo
const ORDINE: Record<IdCalendario, number> = { inumazione: 0, tumulazione: 0, esumazione: 0, estumulazione: 0, traslazione: 0, manutenzione: 1, scadenza: 2, verifica: 3 };

export interface EventoCalendario {
  id: string;
  giorno: string;
  ora?: string;
  calendario: IdCalendario;
  titolo: string;
  sotto: string;
  link?: string;
  /** già fatto: resta nel calendario, più chiaro */
  fatto?: boolean;
  /** richiesta di un'agenzia non ancora accolta dall'ufficio */
  attesa?: boolean;
  /** gli operatori a cui è assegnato */
  persone: string[];
  agenziaId?: string;
  praticaId?: string;
  richiestaId?: string;
}

/** Tutto ciò che ha una data in un cimitero: operazioni, richieste delle agenzie, manutenzioni, verifiche e scadenze. */
export function eventiCalendario(db: Database, config: ConfigScheda, cimiteroId: string): EventoCalendario[] {
  const out: EventoCalendario[] = [];
  for (const p of db.pratiche) {
    if (p.cimiteroId !== cimiteroId || !p.dataOra || (p.stato !== 'programmata' && p.stato !== 'eseguita')) continue;
    out.push({
      id: `pr-${p.id}`, giorno: p.dataOra.slice(0, 10), ora: p.dataOra.slice(11, 16), calendario: p.tipo, titolo: `${NOMI_OPERAZIONE[p.tipo]} · ${nomeCompleto(p.defunto)}`,
      sotto: `${p.schedaId}${p.provvisoria ? ' · provvisoria' : ''}`, link: `/operazioni?id=${p.id}`, fatto: p.stato === 'eseguita', persone: p.operatoriIds ?? [], agenziaId: p.agenziaId, praticaId: p.id,
    });
  }
  for (const r of db.richieste) {
    if (r.cimiteroId !== cimiteroId || r.stato !== 'in_attesa') continue;
    out.push({
      id: `ra-${r.id}`, giorno: r.dataOra.slice(0, 10), ora: r.dataOra.slice(11, 16), calendario: r.tipo, titolo: `${NOMI_OPERAZIONE[r.tipo]} · ${nomeCompleto(r.defunto)}`,
      sotto: `Richiesta ${r.numero} in attesa`, link: '/operazioni', attesa: true, persone: [], agenziaId: r.agenziaId, richiestaId: r.id,
    });
  }
  for (const m of db.manutenzioni) {
    if (m.cimiteroId !== cimiteroId || !m.dataProgrammata || (m.stato !== 'programmata' && m.stato !== 'risolta')) continue;
    out.push({
      id: `man-${m.id}`, giorno: m.dataProgrammata, calendario: 'manutenzione', titolo: labelLista(config.categorieManutenzione, m.categoria), sotto: m.schedaId || m.luogo || '',
      link: `/manutenzioni?id=${m.id}`, fatto: m.stato === 'risolta', persone: m.operatoriIds ?? [],
    });
  }
  const mieSchede = new Set(db.schede.filter((s) => s.cimiteroId === cimiteroId).map((s) => s.id));
  for (const v of db.verifiche) {
    if (v.stato !== 'aperta' || !mieSchede.has(v.schedaId)) continue;
    out.push({ id: `ver-${v.id}`, giorno: v.scadenza, calendario: 'verifica', titolo: `Verifica · ${labelLista(config.motiviVerifica, v.motivo)}`, sotto: v.schedaId, link: '/censimento?tab=verifiche', persone: [v.operatoreId] });
  }
  for (const c of db.concessioni) {
    if (c.cimiteroId !== cimiteroId || c.stato === 'chiusa' || c.perpetua) continue;
    out.push({ id: `conc-${c.id}`, giorno: c.scadenza, calendario: 'scadenza', titolo: `Scade la concessione ${c.numero}`, sotto: nomiConcessionari(c), link: `/concessioni?id=${c.id}`, persone: [] });
  }
  for (const s of db.schede) {
    if (s.cimiteroId !== cimiteroId || !s.defunti.length) continue;
    const fine = fineTurno(s, db.regole);
    if (fine) out.push({ id: `turno-${s.id}`, giorno: fine, calendario: 'scadenza', titolo: `Fine del turno · ${nomeCompleto(s.defunti[0])}`, sotto: s.id, link: `/scheda/${s.id}`, persone: [] });
    for (const d of s.defunti)
      if (d.provvisorio?.fino)
        out.push({ id: `prov-${s.id}-${d.cognome}-${d.nome}`, giorno: d.provvisorio.fino, calendario: 'scadenza', titolo: `Spostare ${nomeCompleto(d)}`, sotto: `Sepoltura provvisoria · ${s.id}`, link: `/scheda/${s.id}`, persone: [] });
  }
  return out;
}

const CHIAVE = 'cimitera:calendari-spenti';
function leggiSpenti(): IdCalendario[] {
  try {
    return JSON.parse(window.localStorage.getItem(CHIAVE) ?? '[]') as IdCalendario[];
  } catch {
    return [];
  }
}

const giornoLungo = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * agenziaId: il calendario di una sola agenzia funebre (le sue operazioni e le sue richieste in attesa).
 * onEvento: cosa fare al clic su una voce; se manca, si apre la pagina della voce.
 */
export function Calendario({ agenziaId, onEvento, azione }: { agenziaId?: string; onEvento?: (e: EventoCalendario) => void; azione?: React.ReactNode }) {
  const db = useStore((s) => s.db);
  const config = useStore((s) => s.config);
  const cim = useCimitero();
  const utente = useUtente();
  const oggi = oggiISO();
  const [mese, setMese] = useState(() => ({ y: Number(oggi.slice(0, 4)), m: Number(oggi.slice(5, 7)) - 1 }));
  const [giorno, setGiorno] = useState(oggi);
  const [spenti, setSpenti] = useState<IdCalendario[]>(leggiSpenti);
  // l'Operatore parte dalle sue cose, l'Amministratore da tutto
  const [chi, setChi] = useState<string>(utente.operatoreId && !utente.amministratore ? 'io' : 'tutti');

  const calendari = agenziaId ? CALENDARI.filter((c) => (TIPI_OPERAZIONE as string[]).includes(c.id)) : CALENDARI;
  const tutti = useMemo(() => (cim ? eventiCalendario(db, config, cim.id) : []), [db, config, cim]);
  const visibili = useMemo(() => {
    const persona = chi === 'io' ? utente.operatoreId : chi.startsWith('op:') ? chi.slice(3) : null;
    const agenzia = agenziaId ?? (chi.startsWith('ag:') ? chi.slice(3) : null);
    return tutti
      .filter((e) => !spenti.includes(e.calendario) && (agenzia ? e.agenziaId === agenzia : !persona || e.persone.includes(persona)))
      .filter((e) => (agenziaId ? e.calendario !== 'manutenzione' && e.calendario !== 'verifica' && e.calendario !== 'scadenza' : true))
      .sort((a, b) => (a.ora ?? '99').localeCompare(b.ora ?? '99') || ORDINE[a.calendario] - ORDINE[b.calendario] || a.titolo.localeCompare(b.titolo));
  }, [tutti, spenti, chi, utente.operatoreId, agenziaId]);
  const perGiorno = useMemo(() => {
    const m = new Map<string, EventoCalendario[]>();
    for (const e of visibili) {
      const l = m.get(e.giorno);
      if (l) l.push(e);
      else m.set(e.giorno, [e]);
    }
    return m;
  }, [visibili]);

  const primo = new Date(mese.y, mese.m, 1);
  const offset = (primo.getDay() + 6) % 7;
  const giorni = new Date(mese.y, mese.m + 1, 0).getDate();
  const celle = Array.from({ length: Math.ceil((offset + giorni) / 7) * 7 }, (_, i) => {
    const g = i - offset + 1;
    return g >= 1 && g <= giorni ? `${mese.y}-${String(mese.m + 1).padStart(2, '0')}-${String(g).padStart(2, '0')}` : null;
  });
  const sposta = (d: number) => setMese(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));
  const vaiOggi = () => {
    setMese({ y: Number(oggi.slice(0, 4)), m: Number(oggi.slice(5, 7)) - 1 });
    setGiorno(oggi);
  };
  const accendi = (id: IdCalendario) => {
    const nuovi = spenti.includes(id) ? spenti.filter((x) => x !== id) : [...spenti, id];
    setSpenti(nuovi);
    try { window.localStorage.setItem(CHIAVE, JSON.stringify(nuovi)); } catch { /* resta per questa volta */ }
  };
  const apri = (e: EventoCalendario) => (onEvento ? onEvento(e) : e.link && vai(e.link));
  const delGiorno = perGiorno.get(giorno) ?? [];
  const operatori = db.operatori.filter((o) => o.attivo);
  const agenzie = db.agenzie.filter((a) => a.attiva);

  return (
    <section className="card calg">
      <div className="card__head calg__testa">
        <div className="row gap-8 row--wrap">
          <span className="widget__ico" style={{ background: '#2F6FB314', color: '#2F6FB3' }}><CalendarDays size={16} /></span>
          <h2 style={{ textTransform: 'capitalize' }}>{meseAnno(mese.y, mese.m)}</h2>
          <button className="btn btn--sm btn--icon" onClick={() => sposta(-1)} aria-label="Mese precedente"><ChevronLeft size={16} /></button>
          <button className="btn btn--sm" onClick={vaiOggi}>Oggi</button>
          <button className="btn btn--sm btn--icon" onClick={() => sposta(1)} aria-label="Mese successivo"><ChevronRight size={16} /></button>
        </div>
        <div className="row gap-8 row--wrap">
          {!agenziaId && (
            <select className="select select--sm" style={{ width: 'auto' }} value={chi} onChange={(e) => setChi(e.target.value)} aria-label="Di chi è il calendario">
              <option value="tutti">Il calendario di tutti</option>
              {utente.operatoreId && <option value="io">Solo le mie cose</option>}
              <optgroup label="Operatori">
                {operatori.filter((o) => o.id !== utente.operatoreId).map((o) => <option key={o.id} value={`op:${o.id}`}>{o.nome}</option>)}
              </optgroup>
              <optgroup label="Agenzie funebri">
                {agenzie.map((a) => <option key={a.id} value={`ag:${a.id}`}>{a.nome}</option>)}
              </optgroup>
            </select>
          )}
          {azione}
        </div>
      </div>
      <div className="calg__corpo">
        <div className="cal__grid calg__mese">
          {GIORNI_BREVI.map((g) => <div key={g} className="cal__dow">{g}</div>)}
          {celle.map((d, i) => {
            const voci = d ? perGiorno.get(d) ?? [] : [];
            return (
              <div key={i} className={`cal__day ${!d ? 'is-out' : ''} ${d === oggi ? 'is-today' : ''} ${d && d === giorno ? 'is-sel' : ''}`} onClick={() => d && setGiorno(d)}>
                {d && <span className="cal__n">{Number(d.slice(8))}</span>}
                {voci.slice(0, 3).map((e) => (
                  <button key={e.id} className={`cal__item ${e.attesa ? 'is-attesa' : ''}`} style={{ borderLeftColor: COLORE[e.calendario], opacity: e.fatto ? 0.55 : 1 }}
                    onClick={(ev) => { ev.stopPropagation(); setGiorno(e.giorno); apri(e); }} title={`${e.ora ? `${e.ora} · ` : ''}${e.titolo} · ${e.sotto}`}>
                    {e.fatto ? '✓ ' : ''}{e.ora ? <b>{e.ora} </b> : null}{e.titolo}
                  </button>
                ))}
                {voci.length > 3 && <span className="tiny muted strong">+{voci.length - 3} {voci.length - 3 === 1 ? 'altra' : 'altre'}</span>}
                {voci.length > 0 && <span className="calg__punti">{voci.slice(0, 4).map((e) => <i key={e.id} style={{ background: COLORE[e.calendario] }} />)}</span>}
              </div>
            );
          })}
        </div>
        <aside className="calg__lato">
          <div className="calg__giorno">
            <div className="upper muted">{giorno === oggi ? 'Oggi · ' : ''}{giornoLungo(giorno)}</div>
            {delGiorno.length === 0 && <p className="small muted">Niente in programma.</p>}
            {delGiorno.map((e) => (
              <button key={e.id} className={`calg__voce ${e.attesa ? 'is-attesa' : ''}`} style={{ borderLeftColor: COLORE[e.calendario], opacity: e.fatto ? 0.6 : 1 }} onClick={() => apri(e)}>
                <b className="mono">{e.ora ?? '—'}</b>
                <span className="grow">
                  <b>{e.titolo}</b>
                  <span className="tiny muted">{e.sotto}{e.fatto ? ' · fatto' : ''}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="calg__calendari">
            <div className="upper muted">Calendari</div>
            {calendari.map((c) => {
              const on = !spenti.includes(c.id);
              return (
                <button key={c.id} className="calg__cal" onClick={() => accendi(c.id)} aria-pressed={on}>
                  <span className="calg__spunta" style={on ? { background: c.colore, borderColor: c.colore } : undefined}>{on && <Check size={11} />}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
