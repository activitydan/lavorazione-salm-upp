import { useEffect, type ReactNode } from 'react';
import {
  Box, Church, Construction, Cross, Flame, Grid3x3, Lightbulb, Square, SquareDashed, X, type LucideIcon,
} from 'lucide-react';
import { useStore } from '../../data/store';
import { statoDef, tipologiaDef } from '../../data/selectors';
import { iniziali } from '../../lib/format';

// ---------------------------------------------------------------------------
// Icone delle tipologie e dei campi (il configuratore usa questi nomi)
// ---------------------------------------------------------------------------

export const ICONE: Record<string, LucideIcon> = {
  loculo: Square,
  tomba: Cross,
  cappella: Church,
  colombaio: Grid3x3,
  vuota: SquareDashed,
  cantiere: Construction,
  lampada: Lightbulb,
  fiamma: Flame,
  box: Box,
};

export function Icona({ nome, size = 16, ...rest }: { nome?: string; size?: number; className?: string; color?: string }) {
  const C = (nome && ICONE[nome]) || Square;
  return <C size={size} {...rest} />;
}

// ---------------------------------------------------------------------------

export function Modal({
  titolo, sottotitolo, onClose, children, footer, size, icona,
}: {
  titolo: ReactNode;
  sottotitolo?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'lg' | 'xl';
  icona?: ReactNode;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ? `modal--${size}` : ''}`} role="dialog" aria-modal="true">
        <div className="modal__head">
          <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
            {icona}
            <div>
              <h2>{titolo}</h2>
              {sottotitolo && <p>{sottotitolo}</p>}
            </div>
          </div>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Switch({ on, onChange, small, label }: { on: boolean; onChange: (v: boolean) => void; small?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch ${small ? 'switch--sm' : ''} ${on ? 'is-on' : ''}`}
      onClick={() => onChange(!on)}
    />
  );
}

export function Seg<T extends string>({
  options, value, onChange, light, small,
}: {
  options: { id: T; label: ReactNode; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  light?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`seg ${light ? 'seg--light' : ''} ${small ? 'seg--sm' : ''}`} role="tablist">
      {options.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={value === o.id ? 'is-on' : ''} onClick={() => onChange(o.id)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs, value, onChange,
}: {
  tabs: { id: T; label: string; icon?: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === value} className={t.id === value ? 'is-on' : ''} onClick={() => onChange(t.id)}>
          {t.icon}
          {t.label}
          {t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Dot({ colore, size, title }: { colore: string; size?: 'lg'; title?: string }) {
  const libero = colore.toUpperCase() === '#FFFFFF';
  return <span title={title} className={`dot ${size === 'lg' ? 'dot--lg' : ''} ${libero ? 'dot--libero' : ''}`} style={{ background: colore }} />;
}

export function StatoBadge({ stato, small }: { stato: string; small?: boolean }) {
  const config = useStore((s) => s.config);
  const d = statoDef(config, stato);
  return (
    <span className={`badge badge--outline ${small ? 'badge--sm' : ''}`}>
      <Dot colore={d.colore} />
      {d.label}
    </span>
  );
}

export function TipologiaBadge({ tipologia, small }: { tipologia: string; small?: boolean }) {
  const config = useStore((s) => s.config);
  const d = tipologiaDef(config, tipologia);
  return (
    <span className={`badge ${small ? 'badge--sm' : ''}`} style={{ background: `${d.colore}18`, color: d.colore }}>
      <Icona nome={d.icona} size={small ? 11 : 13} />
      {d.label}
    </span>
  );
}

export function Progress({ value, max = 100, verde, small, colore }: { value: number; max?: number; verde?: boolean; small?: boolean; colore?: string }) {
  const p = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`progress ${verde ? 'progress--verde' : ''} ${small ? 'progress--sm' : ''}`} role="progressbar" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${p}%`, background: colore }} />
    </div>
  );
}

export function Avatar({ nome, colore = '#1B5A8F', size }: { nome: string; colore?: string; size?: 'sm' | 'lg' }) {
  return (
    <span className={`avatar ${size ? `avatar--${size}` : ''}`} style={{ background: colore }} title={nome}>
      {iniziali(nome)}
    </span>
  );
}

export function Empty({ titolo, testo, azione }: { titolo: string; testo?: string; azione?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{titolo}</h3>
      {testo && <p>{testo}</p>}
      {azione}
    </div>
  );
}

export function Field({ label, hint, req, children, className }: { label: string; hint?: ReactNode; req?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`field ${className ?? ''}`}>
      <label>
        {label}
        {req && <span className="field__req">*</span>}
      </label>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tipo === 'errore' ? 'toast--errore' : ''}`}>
          {t.testo}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grafici minimi in SVG (ciambella e barre)
// ---------------------------------------------------------------------------

export function Ciambella({
  dati, size = 150, spessore = 20, centro, sotto,
}: {
  dati: { id: string; label: string; valore: number; colore: string }[];
  size?: number;
  spessore?: number;
  centro?: ReactNode;
  sotto?: ReactNode;
}) {
  const tot = dati.reduce((t, d) => t + d.valore, 0) || 1;
  const r = (size - spessore) / 2;
  const C = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF1F5" strokeWidth={spessore} />
        {dati.filter((d) => d.valore > 0).map((d) => {
          const len = (d.valore / tot) * C;
          const el = (
            <circle
              key={d.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.colore.toUpperCase() === '#FFFFFF' ? '#C9D2DC' : d.colore}
              strokeWidth={spessore}
              strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`}
              strokeDashoffset={-off}
            >
              <title>{`${d.label}: ${d.valore}`}</title>
            </circle>
          );
          off += len;
          return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          {centro}
          {sotto}
        </div>
      </div>
    </div>
  );
}

export function Barre({
  dati, altezza = 150, colore = '#1B5A8F', formatta = (n: number) => String(n), evidenzia,
}: {
  dati: { label: string; valore: number; titolo?: string }[];
  altezza?: number;
  colore?: string;
  formatta?: (n: number) => string;
  evidenzia?: number;
}) {
  const max = Math.max(1, ...dati.map((d) => d.valore));
  return (
    <div className="barre" style={{ height: altezza + 28 }}>
      {dati.map((d, i) => (
        <div key={i} className="barre__col" title={d.titolo ?? `${d.label}: ${formatta(d.valore)}`}>
          <span className="barre__val">{d.valore ? formatta(d.valore) : ''}</span>
          <div className="barre__bar" style={{ height: `${(d.valore / max) * altezza}px`, background: i === evidenzia ? '#79AA4F' : colore }} />
          <span className="barre__lab">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
