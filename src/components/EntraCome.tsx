import { useState } from 'react';
import { ArrowLeft, Building2, ChevronRight, ClipboardList, Search, ShieldCheck } from 'lucide-react';
import { UFFICIO } from '../config/defaults';
import { entra, useStore } from '../data/store';
import { useTelefono } from '../lib/schermo';
import { vai } from '../router';
import { FIRMA, Mark, Wordmark } from './Logo';

/** Ingresso della demo: si sceglie il ruolo, senza password. Gli accessi veri arriveranno con il backend. */
export function EntraCome() {
  const operatori = useStore((s) => s.db.operatori);
  const telefono = useTelefono();
  const agenzie = useStore((s) => s.db.agenzie).filter((a) => a.attiva && a.accesso);
  // null = scelta del ruolo; poi si sceglie chi si è
  const [scegli, setScegli] = useState<'operatore' | 'agenzia' | null>(null);
  const scegliOperatore = scegli === 'operatore';
  const setScegliOperatore = (v: boolean) => setScegli(v ? 'operatore' : null);
  const attivi = operatori.filter((o) => o.attivo);
  const dopo = () => vai(telefono ? '/mappa' : '/');

  return (
    <div className="entra">
      <div className="entra__box">
        <div className="entra__logo">
          <Mark size={64} />
          <Wordmark firma />
        </div>
        {scegli === 'agenzia' ? (
          <>
            <h1 className="entra__titolo">Quale agenzia?</h1>
            <div className="entra__lista">
              {agenzie.map((a) => (
                <button key={a.id} className="entra__voce" onClick={() => { entra({ ruolo: 'agenzia', agenziaId: a.id }); vai('/'); }}>
                  <span className="entra__ico" style={{ background: '#EEF6E8', color: '#4A822B' }}><Building2 size={20} /></span>
                  <span className="grow">
                    <b>{a.nome}</b>
                    <span>Agenzia funebre</span>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => setScegli(null)}><ArrowLeft size={15} />Indietro</button>
          </>
        ) : !scegliOperatore ? (
          <>
            <h1 className="entra__titolo">Entra come</h1>
            <div className="entra__lista">
              <button className="entra__voce" onClick={() => vai('/cittadino')}>
                <span className="entra__ico" style={{ background: '#EEF6E8', color: '#4A822B' }}><Search size={20} /></span>
                <span className="grow">
                  <b>Cittadino</b>
                  <span>Cerca dove si trova un defunto</span>
                </span>
                <ChevronRight size={18} />
              </button>
              <button className="entra__voce" onClick={() => setScegliOperatore(true)}>
                <span className="entra__ico" style={{ background: '#EAF2F9', color: '#1B5A8F' }}><ClipboardList size={20} /></span>
                <span className="grow">
                  <b>Operatore</b>
                  <span>Censimento sul campo e lavoro d'ufficio</span>
                </span>
                <ChevronRight size={18} />
              </button>
              {agenzie.length > 0 && (
                <button className="entra__voce" onClick={() => setScegli('agenzia')}>
                  <span className="entra__ico" style={{ background: '#F3EEF8', color: '#7B4FA8' }}><Building2 size={20} /></span>
                  <span className="grow">
                    <b>Agenzia funebre</b>
                    <span>Le tue operazioni e le richieste all'ufficio</span>
                  </span>
                  <ChevronRight size={18} />
                </button>
              )}
              <button className="entra__voce" onClick={() => { entra({ ruolo: 'amministratore' }); dopo(); }}>
                <span className="entra__ico" style={{ background: '#E9EDF3', color: '#0A2F55' }}><ShieldCheck size={20} /></span>
                <span className="grow">
                  <b>Amministratore</b>
                  <span>{UFFICIO}: tutto, più operatori e impostazioni</span>
                </span>
                <ChevronRight size={18} />
              </button>
            </div>
            <p className="entra__nota">Versione dimostrativa: si entra senza password e i dati sono inventati.</p>
          </>
        ) : (
          <>
            <h1 className="entra__titolo">Chi sei?</h1>
            <div className="entra__lista">
              {attivi.map((o) => (
                <button key={o.id} className="entra__voce" onClick={() => { entra({ ruolo: o.ruolo === 'Amministratore' ? 'amministratore' : 'operatore', operatoreId: o.id }); dopo(); }}>
                  <span className="avatar" style={{ background: o.colore }}>{o.nome.split(/\s+/).map((p) => p[0]).slice(0, 2).join('')}</span>
                  <span className="grow">
                    <b>{o.nome}</b>
                    <span>{o.ruolo}</span>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => setScegliOperatore(false)}><ArrowLeft size={15} />Indietro</button>
          </>
        )}
      </div>
      <div className="entra__firma">{FIRMA}</div>
    </div>
  );
}
