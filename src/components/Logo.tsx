import { markDataUrl } from '../lib/brand';

export const FIRMA = 'Una soluzione DAT | HYA Group';

export function Mark({ size = 42, variante = 'chiaro' }: { size?: number; variante?: 'chiaro' | 'scuro' }) {
  return <img className="mark" src={markDataUrl(variante)} width={size} height={Math.round((size * 96) / 116)} alt="" />;
}

/** firma: aggiunge "Una soluzione DAT | HYA Group" sotto il nome (schermata di caricamento e ingresso). */
export function Wordmark({ dark, small, firma }: { dark?: boolean; small?: boolean; firma?: boolean }) {
  return (
    <span className={`wordmark ${dark ? 'wordmark--dark' : ''}`}>
      <span className="wordmark__name" style={small ? { fontSize: 19 } : undefined}>
        Cimi<span className="wordmark__up">Tera</span>
      </span>
      {firma && (
        <span className="wordmark__sub">
          UNA SOLUZIONE <b>DAT</b> | <i>HYA GROUP</i>
        </span>
      )}
    </span>
  );
}

export function Logo({ dark, size = 42, firma }: { dark?: boolean; size?: number; firma?: boolean }) {
  return (
    <span className="row" style={{ gap: 10 }} aria-label="CimiTera">
      <Mark size={size} variante={dark ? 'scuro' : 'chiaro'} />
      <Wordmark dark={dark} firma={firma} />
    </span>
  );
}
