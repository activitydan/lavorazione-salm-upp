import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, ChevronLeft, Download, Euro, FileText, FolderPlus, Printer, Search, Send, UserX, X } from 'lucide-react';
import { AvvisoDettaglio, BadgeAvviso } from '../components/Avvisi';
import { BarraPagine, paginaDi } from '../components/Esporta';
import { Field, Modal, Tabs } from '../components/ui';
import {
  CLASSE_ESITO, DESCRIZIONE_CANALE, NOMI_CANALE, NOMI_ESITO, NOMI_LETTERA, NOMI_MOTIVO_AVVISO, NOMI_PASSO, NOMI_SCADENZA, NOMI_STATO_AVVISO, apriPraticheDUfficio, faiPasso,
  inviaTramiteDat, lettereDi, prossimoPasso, reinvia, righeScadenzario, sistemaInviiSospesi, statoAvviso, testoLettera, ultimaLettera,
  type RigaScadenza, type StatoAvviso, type TipoScadenza,
} from '../data/scadenze';
import { aggiornaScheda, seleziona, toast, useStore } from '../data/store';
import { useCimitero } from '../data/selectors';
import type { CanaleDat, InvioDat, LottoDat } from '../data/types';
import { scaricaExcel } from '../lib/excel';
import { data, euro, giorniTra, normalizza, numero, oggiISO } from '../lib/format';
import { pdfLetteraDat } from '../lib/pdf';
import { setQuery, useRotta } from '../router';

type Tab = 'scadenzario' | 'invii' | 'avvisi' | 'morosi';
const CANALI: CanaleDat[] = ['posta_certa', 'raccomandata_certa', 'notifica_certa'];

export function ScadenzePage() {
  const rotta = useRotta();
  const t = rotta.query.get('tab');
  const tab: Tab = t === 'invii' || t === 'avvisi' || t === 'morosi' ? t : 'scadenzario';
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const righe = useMemo(() => righeScadenzario(db, cim.id), [db, cim.id]);
  const scaduti = db.avvisi.filter((a) => a.cimiteroId === cim.id && statoAvviso(a) === 'scaduto').length;
  useEffect(() => sistemaInviiSospesi(), []);
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__title">
          <h1>Scadenze e pagamenti</h1>
        </div>
      </div>
      <Tabs value={tab} onChange={(v) => setQuery('tab', v === 'scadenzario' ? null : v)} tabs={[
        { id: 'scadenzario', label: 'Scadenzario', icon: <CalendarClock size={16} />, count: righe.length },
        { id: 'invii', label: 'Invii DAT', icon: <Send size={16} />, count: db.lotti.length },
        { id: 'avvisi', label: 'Avvisi di pagamento', icon: <Euro size={16} /> },
        { id: 'morosi', label: 'Morosi', icon: <UserX size={16} />, count: scaduti },
      ]} />
      <p className="simulato"><AlertTriangle size={14} />pagoPA simulato: nessun pagamento reale. Invii tramite DAT simulati: nessuna lettera parte davvero.</p>
      {tab === 'scadenzario' && <Scadenzario righe={righe} />}
      {tab === 'invii' && <InviiDat />}
      {tab === 'avvisi' && <Avvisi />}
      {tab === 'morosi' && <Morosi />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scadenzario
// ---------------------------------------------------------------------------

function EsitoBadge({ i }: { i?: InvioDat }) {
  if (!i) return <span className="muted small">Nessuna lettera</span>;
  return <span className={`badge badge--sm ${CLASSE_ESITO[i.esito]}`}>{NOMI_ESITO[i.esito]}{i.esitoIl ? ` · ${data(i.esitoIl)}` : ''}</span>;
}

function Scadenzario({ righe }: { righe: RigaScadenza[] }) {
  const db = useStore((s) => s.db);
  const cim = useCimitero();
  const [tipi, setTipi] = useState<TipoScadenza[]>(['concessione', 'fine_turno', 'da_liberare']);
  const [senzaLettera, setSenzaLettera] = useState(false);
  const [scelte, setScelte] = useState<Set<string>>(new Set());
  const [pagina, setPagina] = useState(0);
  const [invio, setInvio] = useState(false);
  const lista = useMemo(
    () => righe.filter((r) => tipi.includes(r.tipo) && (!senzaLettera || !ultimaLettera(db.invii, r.chiave))),
    [righe, tipi, senzaLettera, db.invii],
  );
  useEffect(() => setPagina(0), [tipi, senzaLettera]);
  const selezionate = lista.filter((r) => scelte.has(r.chiave));
  const conDestinatario = selezionate.filter((r) => r.destinatari.length > 0);
  const senzaDestinatario = selezionate.filter((r) => r.destinatari.length === 0);
  const daLiberare = selezionate.filter((r) => r.tipo !== 'concessione');
  const conta = (t: TipoScadenza) => righe.filter((r) => r.tipo === t).length;
  const pagine = paginaDi(lista, pagina);
  const affissione = async () => {
    for (const r of senzaDestinatario) {
      await pdfLetteraDat({
        numero: `AFF-${r.schedaId}`, dataLettera: oggiISO(), comune: cim.comune, destinatario: { nome: 'Agli interessati', indirizzo: `Affissa sulla postazione ${r.schedaId}` },
        oggetto: `Postazione ${r.schedaId}`, paragrafi: testoLettera({ tipo: r.tipo === 'concessione' ? 'scadenza_concessione' : 'esumazione_dovuta', oggetto: '', riferimento: r.chiave, schedaId: r.schedaId, concessioneId: r.concessioneId }),
      });
      aggiornaScheda(r.schedaId, {}, `Lettera di scadenza affissa il ${data(oggiISO())}`);
    }
    toast(`${senzaDestinatario.length} ${senzaDestinatario.length === 1 ? 'lettera stampata' : 'lettere stampate'} per l'affissione`);
    setScelte(new Set());
  };
  const pratiche = () => {
    const n = apriPraticheDUfficio(daLiberare);
    toast(n ? `${n} ${n === 1 ? 'pratica d\'ufficio aperta' : 'pratiche d\'ufficio aperte'}` : 'Le pratiche ci sono già', n ? 'ok' : 'info');
    setScelte(new Set());
  };
  return (
    <section className="card">
      {scelte.size > 0 ? (
        <div className="bulk">
          <b>{selezionate.length} selezionate</b>
          <button className="btn btn--sm btn--primary" disabled={!conDestinatario.length} onClick={() => setInvio(true)}><Send size={14} />Invia tramite DAT ({conDestinatario.length})</button>
          {daLiberare.length > 0 && <button className="btn btn--sm" onClick={pratiche}><FolderPlus size={14} />Apri le pratiche d'ufficio</button>}
          {senzaDestinatario.length > 0 && <button className="btn btn--sm" onClick={() => void affissione()}><Printer size={14} />Stampa per l'affissione ({senzaDestinatario.length})</button>}
          <button className="btn btn--sm btn--ghost" onClick={() => setScelte(new Set())}><X size={14} />Deseleziona</button>
        </div>
      ) : (
        <div className="bulk bulk--soft">
          {(Object.keys(NOMI_SCADENZA) as TipoScadenza[]).map((t) => (
            <button key={t} className={`chip chip--sm ${tipi.includes(t) ? 'is-on' : ''}`} onClick={() => setTipi(tipi.includes(t) ? tipi.filter((x) => x !== t) : [...tipi, t])}>
              {NOMI_SCADENZA[t]}<span className="chip__n">{conta(t)}</span>
            </button>
          ))}
          <button className={`chip chip--sm ${senzaLettera ? 'is-on' : ''}`} onClick={() => setSenzaLettera(!senzaLettera)}>Senza lettera</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" className="check" aria-label="Seleziona tutte le righe della pagina" checked={pagine.length > 0 && pagine.every((r) => scelte.has(r.chiave))}
                  onChange={(e) => { const n = new Set(scelte); for (const r of pagine) e.target.checked ? n.add(r.chiave) : n.delete(r.chiave); setScelte(n); }} />
              </th>
              <th>Scadenza</th><th>Cosa scade</th><th>Postazione e defunti</th><th>Destinatario</th><th>Ultima lettera</th>
            </tr>
          </thead>
          <tbody>
            {pagine.map((r) => (
              <tr key={r.chiave}>
                <td>
                  <input type="checkbox" className="check" aria-label={`Seleziona ${r.schedaId}`} checked={scelte.has(r.chiave)}
                    onChange={(e) => { const n = new Set(scelte); e.target.checked ? n.add(r.chiave) : n.delete(r.chiave); setScelte(n); }} />
                </td>
                <td className="nowrap"><b>{data(r.data)}</b><div className="tiny" style={{ color: r.giorni < 0 ? '#D9473F' : undefined }}>{r.giorni < 0 ? `da ${numero(-r.giorni)} giorni` : `tra ${numero(r.giorni)} giorni`}</div></td>
                <td><span className="badge badge--sm">{NOMI_SCADENZA[r.tipo]}</span><div className="tiny muted">{r.titolo}</div></td>
                <td className="clickable" onClick={() => seleziona(r.schedaId)}><span className="id">{r.schedaId}</span> · {r.viale}<div className="tiny muted">{r.defunti}</div></td>
                <td>{r.destinatari.length ? <>{r.destinatari[0].nome}{r.destinatari.length > 1 && <span className="muted"> e {r.destinatari.length - 1} altro</span>}<div className="tiny muted">{r.destinatari[0].indirizzo}</div></> : <span className="badge badge--sm badge--arancio">Nessun destinatario</span>}</td>
                <td><EsitoBadge i={ultimaLettera(db.invii, r.chiave)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lista.length && <div className="empty"><h3>Nessuna scadenza con questi filtri</h3></div>}
      </div>
      <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
      {invio && <ModaleInvio righe={conDestinatario} onChiudi={() => setInvio(false)} onFatto={(l) => { setInvio(false); setScelte(new Set()); setQuery('tab', 'invii'); setQuery('lotto', l.id); }} />}
    </section>
  );
}

function ModaleInvio({ righe, onChiudi, onFatto }: { righe: RigaScadenza[]; onChiudi: () => void; onFatto: (l: LottoDat) => void }) {
  const cim = useCimitero();
  const [canale, setCanale] = useState<CanaleDat>('posta_certa');
  const lettere = righe.flatMap(lettereDi);
  const anteprima = () => {
    const l = lettere[0];
    void pdfLetteraDat({ numero: 'ANTEPRIMA', dataLettera: oggiISO(), comune: cim.comune, destinatario: l.destinatario, oggetto: l.oggetto, paragrafi: testoLettera(l) });
  };
  const conferma = () => {
    const lotto = inviaTramiteDat(lettere, canale);
    if (!lotto) return;
    toast(`Lotto ${lotto.numero} creato: ${lettere.length} ${lettere.length === 1 ? 'lettera' : 'lettere'} in lavorazione`);
    onFatto(lotto);
  };
  return (
    <Modal titolo="Invia tramite DAT" sottotitolo="Simulazione: nessuna lettera parte davvero." onClose={onChiudi}
      footer={<><button className="btn" onClick={anteprima}><FileText size={15} />Anteprima</button><span className="grow" /><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" onClick={conferma}><Send size={15} />Crea il lotto</button></>}>
      <div className="col gap-16">
        <p><b>{lettere.length}</b> {lettere.length === 1 ? 'lettera' : 'lettere'} per <b>{righe.length}</b> {righe.length === 1 ? 'scadenza' : 'scadenze'}: una per destinatario, nello stesso lotto.</p>
        <Field label="Servizio di DAT">
          <div className="col gap-8">
            {CANALI.map((c) => (
              <label key={c} className={`canale ${canale === c ? 'is-on' : ''}`}>
                <input type="radio" name="canale" checked={canale === c} onChange={() => setCanale(c)} />
                <span className="grow"><b>{NOMI_CANALE[c]}</b><span className="small muted">{DESCRIZIONE_CANALE[c]}</span></span>
              </label>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Invii DAT: i lotti e i loro invii
// ---------------------------------------------------------------------------

function InviiDat() {
  const rotta = useRotta();
  const db = useStore((s) => s.db);
  const cim = useCimitero();
  const lottoId = rotta.query.get('lotto');
  const [pagina, setPagina] = useState(0);
  const [prova, setProva] = useState<InvioDat | null>(null);
  const [daReinviare, setDaReinviare] = useState<InvioDat | null>(null);
  const lotti = useMemo(() => [...db.lotti].sort((a, b) => b.numero - a.numero), [db.lotti]);
  const conteggi = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    for (const i of db.invii) {
      const c = m.get(i.lottoId) ?? {};
      c[i.esito] = (c[i.esito] ?? 0) + 1;
      c.tutti = (c.tutti ?? 0) + 1;
      m.set(i.lottoId, c);
    }
    return m;
  }, [db.invii]);
  const lotto = lottoId ? db.lotti.find((l) => l.id === lottoId) : undefined;
  useEffect(() => setPagina(0), [lottoId]);

  if (lotto) {
    const invii = db.invii.filter((i) => i.lottoId === lotto.id).sort((a, b) => (a.esito === 'non_consegnato' ? 0 : 1) - (b.esito === 'non_consegnato' ? 0 : 1));
    const stampa = (i: InvioDat) => void pdfLetteraDat({ numero: `L${lotto.numero}-${i.id.slice(-5)}`, dataLettera: lotto.data, comune: cim.comune, destinatario: i.destinatario, oggetto: i.oggetto, paragrafi: testoLettera(i) });
    return (
      <section className="card">
        <div className="card__head">
          <div className="row gap-8">
            <button className="btn btn--sm btn--icon" onClick={() => setQuery('lotto', null)} aria-label="Torna ai lotti"><ChevronLeft size={16} /></button>
            <h3>Lotto {lotto.numero} · {NOMI_CANALE[lotto.canale]}</h3>
            {lotto.simulato && <span className="badge badge--sm badge--arancio">Simulato</span>}
          </div>
          <span className="small muted">{data(lotto.data)} · {lotto.operatore} · {invii.length} invii</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Destinatario</th><th>Lettera</th><th>Esito</th><th /></tr></thead>
            <tbody>
              {paginaDi(invii, pagina).map((i) => (
                <tr key={i.id}>
                  <td><b>{i.destinatario.nome}</b><div className="tiny muted">{i.destinatario.indirizzo}</div></td>
                  <td>{NOMI_LETTERA[i.tipo]}<div className="tiny muted">{i.oggetto}</div></td>
                  <td><span className={`badge badge--sm ${CLASSE_ESITO[i.esito]}`}>{NOMI_ESITO[i.esito]}</span><div className="tiny muted">{i.esitoIl ? data(i.esitoIl) : 'in attesa'}{i.motivoNonConsegna ? ` · ${i.motivoNonConsegna}` : ''}</div></td>
                  <td>
                    <span className="row gap-4" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn--xs" onClick={() => stampa(i)}><FileText size={12} />Lettera</button>
                      {i.esitoIl && <button className="btn btn--xs" onClick={() => setProva(i)}>Prova</button>}
                      {i.esito === 'non_consegnato' && <button className="btn btn--xs btn--primary" onClick={() => setDaReinviare(i)}>Correggi e reinvia</button>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <BarraPagine pagina={pagina} totale={invii.length} onPagina={setPagina} />
        {prova && <ModaleProva i={prova} lotto={lotto} onChiudi={() => setProva(null)} />}
        {daReinviare && <ModaleReinvia i={daReinviare} onChiudi={() => setDaReinviare(null)} />}
      </section>
    );
  }
  return (
    <section className="card">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Lotto</th><th>Data</th><th>Servizio</th><th>Operatore</th><th className="num">Invii</th><th className="num">Consegnati</th><th className="num">Notificati</th><th className="num">Non consegnati</th><th /></tr></thead>
          <tbody>
            {lotti.map((l) => {
              const c = conteggi.get(l.id) ?? {};
              return (
                <tr key={l.id} className="clickable" onClick={() => setQuery('lotto', l.id)}>
                  <td><b>Lotto {l.numero}</b></td>
                  <td className="nowrap">{data(l.data)}</td>
                  <td>{NOMI_CANALE[l.canale]}</td>
                  <td>{l.operatore}</td>
                  <td className="num">{numero(c.tutti ?? 0)}</td>
                  <td className="num">{numero(c.consegnato ?? 0)}</td>
                  <td className="num">{numero(c.notificato ?? 0)}</td>
                  <td className="num"><b style={{ color: c.non_consegnato ? '#D9473F' : undefined }}>{numero(c.non_consegnato ?? 0)}</b></td>
                  <td>{l.simulato && <span className="badge badge--sm badge--arancio">Simulato</span>}{(c.in_lavorazione || c.spedito) ? <span className="badge badge--sm badge--blu" style={{ marginLeft: 4 }}>In corso</span> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!lotti.length && <div className="empty"><h3>Nessun lotto</h3><p>I lotti nascono dallo scadenzario, con "Invia tramite DAT".</p></div>}
      </div>
    </section>
  );
}

function ModaleProva({ i, lotto, onChiudi }: { i: InvioDat; lotto: LottoDat; onChiudi: () => void }) {
  const titolo = lotto.canale === 'notifica_certa' ? 'Relata di notifica' : lotto.canale === 'raccomandata_certa' ? 'Ricevuta di ritorno' : 'Tracciamento';
  const codice = `DAT-${lotto.numero}-${i.id.slice(-5).toUpperCase()}`;
  return (
    <Modal titolo={`${titolo} · fac-simile`} sottotitolo="Prova finta: nella demo nessuna lettera parte davvero." onClose={onChiudi}>
      <dl className="kv">
        <dt>Codice</dt><dd className="mono">{codice}</dd>
        <dt>Servizio</dt><dd>{NOMI_CANALE[lotto.canale]}</dd>
        <dt>Destinatario</dt><dd>{i.destinatario.nome}<div className="small muted">{i.destinatario.indirizzo}</div></dd>
        <dt>Affidata a DAT</dt><dd>{data(lotto.data)}</dd>
        <dt>Esito</dt><dd><b>{NOMI_ESITO[i.esito]}</b> il {data(i.esitoIl)}{i.motivoNonConsegna ? ` · ${i.motivoNonConsegna}` : ''}</dd>
        {i.esito === 'notificato' && (<><dt>Messo</dt><dd>Notificata a mani del destinatario</dd></>)}
        {i.esito === 'consegnato' && lotto.canale === 'raccomandata_certa' && (<><dt>Firma</dt><dd>Ricevuta firmata dal destinatario</dd></>)}
      </dl>
    </Modal>
  );
}

function ModaleReinvia({ i, onChiudi }: { i: InvioDat; onChiudi: () => void }) {
  const [indirizzo, setIndirizzo] = useState(i.destinatario.indirizzo);
  const [canale, setCanale] = useState<CanaleDat>('raccomandata_certa');
  const invia = () => {
    const l = reinvia(i.id, indirizzo.trim(), canale);
    if (l) { toast(`Reinviata nel lotto ${l.numero}`); setQuery('lotto', l.id); }
    onChiudi();
  };
  return (
    <Modal titolo="Correggi e reinvia" sottotitolo={`Non consegnato: ${i.motivoNonConsegna ?? ''}. La lettera riparte in un nuovo lotto.`} onClose={onChiudi}
      footer={<><button className="btn" onClick={onChiudi}>Annulla</button><button className="btn btn--primary" disabled={!indirizzo.trim()} onClick={invia}><Send size={15} />Reinvia</button></>}>
      <div className="col gap-16">
        <Field label={`Indirizzo di ${i.destinatario.nome}`}><input className="input" value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} autoFocus /></Field>
        <Field label="Servizio di DAT">
          <select className="select" value={canale} onChange={(e) => setCanale(e.target.value as CanaleDat)}>{CANALI.map((c) => <option key={c} value={c}>{NOMI_CANALE[c]}</option>)}</select>
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Avvisi di pagamento
// ---------------------------------------------------------------------------

function Avvisi() {
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const tutti = useMemo(() => db.avvisi.filter((a) => a.cimiteroId === cim.id), [db.avvisi, cim.id]);
  const anni = useMemo(() => Array.from(new Set(tutti.map((a) => a.emessoIl.slice(0, 4)))).sort().reverse(), [tutti]);
  const [anno, setAnno] = useState('');
  const scelto = anno || anni[0] || oggiISO().slice(0, 4);
  const [stati, setStati] = useState<StatoAvviso[]>(['da_pagare', 'scaduto']);
  const [motivo, setMotivo] = useState('');
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(0);
  const [aperto, setAperto] = useState<string | null>(null);
  const dellAnno = tutti.filter((a) => a.emessoIl.startsWith(scelto) && a.stato !== 'annullato');
  const lista = useMemo(() => {
    const t = normalizza(q);
    return tutti
      .filter((a) => a.emessoIl.startsWith(scelto) && stati.includes(statoAvviso(a)) && (!motivo || a.motivo === motivo))
      .filter((a) => !t || normalizza(`${a.numero} ${a.intestatario.nome} ${a.intestatario.codiceFiscale} ${a.causale}`).includes(t))
      .sort((a, b) => b.emessoIl.localeCompare(a.emessoIl));
  }, [tutti, scelto, stati, motivo, q]);
  useEffect(() => setPagina(0), [scelto, stati, motivo, q]);
  const somma = (l: typeof tutti) => l.reduce((t, a) => t + a.importo, 0);
  const sel = aperto ? db.avvisi.find((a) => a.id === aperto) : undefined;
  const esporta = () => scaricaExcel(`CimiTera_${cim.codice}_avvisi_di_pagamento_${oggiISO()}`, [{
    nome: 'Avvisi di pagamento',
    righe: lista.map((a) => ({
      'Codice avviso': a.numero, Intestatario: a.intestatario.nome, 'Codice fiscale': a.intestatario.codiceFiscale, Motivo: NOMI_MOTIVO_AVVISO[a.motivo], Causale: a.causale,
      'Importo €': a.importo, Emesso: data(a.emessoIl), Scadenza: data(a.scadenza), Stato: NOMI_STATO_AVVISO[statoAvviso(a)], 'Pagato il': data(a.pagatoIl), Ricevuta: a.ricevuta ?? '',
    })),
  }]);
  return (
    <div className="col gap-16">
      <div className="kpi-grid">
        <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Emesso nel {scelto}</span><span className="kpi__value">{euro(somma(dellAnno))}</span><span className="kpi__sub">{numero(dellAnno.length)} {dellAnno.length === 1 ? 'avviso' : 'avvisi'}</span></span></div>
        <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Incassato</span><span className="kpi__value" style={{ color: '#3F9A3C' }}>{euro(somma(dellAnno.filter((a) => a.stato === 'pagato')))}</span></span></div>
        <div className="card kpi-card"><span className="kpi"><span className="kpi__label">Scaduto</span><span className="kpi__value" style={{ color: '#D9473F' }}>{euro(somma(dellAnno.filter((a) => statoAvviso(a) === 'scaduto')))}</span></span></div>
      </div>
      <section className="card">
        <div className="card__head" style={{ flexWrap: 'wrap' }}>
          <div className="row gap-8 row--wrap">
            <select className="select select--sm" style={{ width: 'auto' }} value={scelto} onChange={(e) => setAnno(e.target.value)}>{anni.map((a) => <option key={a} value={a}>{a}</option>)}</select>
            <div className="input-icon" style={{ width: 260 }}><Search size={16} /><input className="input input--sm" placeholder="Cerca intestatario, codice o causale" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {(Object.keys(NOMI_STATO_AVVISO) as StatoAvviso[]).map((st) => (
              <button key={st} className={`chip chip--sm ${stati.includes(st) ? 'is-on' : ''}`} onClick={() => setStati(stati.includes(st) ? stati.filter((x) => x !== st) : [...stati, st])}>{NOMI_STATO_AVVISO[st]}</button>
            ))}
            <select className="select select--sm" style={{ width: 'auto' }} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              <option value="">Tutti i motivi</option>
              {Object.entries(NOMI_MOTIVO_AVVISO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="btn btn--sm" disabled={!lista.length} onClick={esporta}><Download size={14} />Esporta {numero(lista.length)}</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Intestatario</th><th>Causale</th><th className="num">Importo</th><th>Emesso</th><th>Scadenza</th><th>Stato</th></tr></thead>
            <tbody>
              {paginaDi(lista, pagina).map((a) => (
                <tr key={a.id} className="clickable" onClick={() => setAperto(a.id)}>
                  <td><b>{a.intestatario.nome}</b><div className="tiny muted mono">{a.intestatario.codiceFiscale}</div></td>
                  <td>{a.causale}</td>
                  <td className="num">{euro(a.importo)}</td>
                  <td className="nowrap">{data(a.emessoIl)}</td>
                  <td className="nowrap">{data(a.scadenza)}</td>
                  <td><BadgeAvviso a={a} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!lista.length && <div className="empty"><h3>Nessun avviso di pagamento con questi filtri</h3></div>}
        </div>
        <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
      </section>
      {sel && <AvvisoDettaglio a={sel} onChiudi={() => setAperto(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Morosi: una riga per avviso scaduto, con il prossimo passo della scala
// ---------------------------------------------------------------------------

function Morosi() {
  const cim = useCimitero();
  const db = useStore((s) => s.db);
  const [pagina, setPagina] = useState(0);
  const [aperto, setAperto] = useState<string | null>(null);
  const oggi = oggiISO();
  const lista = useMemo(
    () => db.avvisi.filter((a) => a.cimiteroId === cim.id && statoAvviso(a, oggi) === 'scaduto').sort((a, b) => a.scadenza.localeCompare(b.scadenza)),
    [db.avvisi, cim.id, oggi],
  );
  const sel = aperto ? db.avvisi.find((a) => a.id === aperto) : undefined;
  const ultimo = (a: (typeof lista)[number]) => { const p = a.passi[a.passi.length - 1]; return p ? `${NOMI_PASSO[p.tipo]} · ${data(p.data)}` : 'Nessuno'; };
  const esporta = () => scaricaExcel(`CimiTera_${cim.codice}_morosi_${oggi}`, [{
    nome: 'Morosi',
    righe: lista.map((a) => ({
      Intestatario: a.intestatario.nome, 'Codice fiscale': a.intestatario.codiceFiscale, Indirizzo: a.intestatario.indirizzo, Motivo: NOMI_MOTIVO_AVVISO[a.motivo], Causale: a.causale,
      'Importo €': a.importo, Scadenza: data(a.scadenza), 'Giorni di ritardo': giorniTra(a.scadenza, oggi), 'Ultimo passo': ultimo(a),
    })),
  }]);
  return (
    <section className="card">
      <div className="card__head">
        <h3>{numero(lista.length)} {lista.length === 1 ? 'avviso di pagamento scaduto' : 'avvisi di pagamento scaduti'} · {euro(lista.reduce((t, a) => t + a.importo, 0))}</h3>
        <button className="btn btn--sm" disabled={!lista.length} onClick={esporta}><Download size={14} />Esporta {numero(lista.length)}</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Intestatario</th><th>Motivo</th><th className="num">Importo</th><th className="num">Giorni di ritardo</th><th>Ultimo passo</th><th /></tr></thead>
          <tbody>
            {paginaDi(lista, pagina).map((a) => {
              const p = prossimoPasso(a, db.regole, oggi);
              return (
                <tr key={a.id}>
                  <td className="clickable" onClick={() => setAperto(a.id)}><b>{a.intestatario.nome}</b><div className="tiny muted">{a.intestatario.indirizzo}</div></td>
                  <td>{NOMI_MOTIVO_AVVISO[a.motivo]}<div className="tiny muted">{a.causale}</div></td>
                  <td className="num">{euro(a.importo)}</td>
                  <td className="num">{numero(giorniTra(a.scadenza, oggi))}</td>
                  <td className="small">{ultimo(a)}</td>
                  <td>
                    {p ? (
                      p.pronto
                        ? <button className="btn btn--xs btn--primary" onClick={() => faiPasso(a.id)}>{NOMI_PASSO[p.tipo]}</button>
                        : <span className="tiny muted">{NOMI_PASSO[p.tipo]} dal {data(p.dal)}</span>
                    ) : <span className="tiny muted">Nessun altro passo</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!lista.length && <div className="empty"><h3>Nessun moroso</h3></div>}
      </div>
      <BarraPagine pagina={pagina} totale={lista.length} onPagina={setPagina} />
      {sel && <AvvisoDettaglio a={sel} onChiudi={() => setAperto(null)} />}
    </section>
  );
}
