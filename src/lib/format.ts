import type { Defunto } from '../data/types';

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const MESI_LUNGHI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
export const GIORNI_BREVI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

export function oggiISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function adessoISO(): string {
  const d = new Date();
  return `${oggiISO()}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parti(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

/** 12/03/2010 */
export function data(iso?: string | null): string {
  if (!iso) return '—';
  const { y, m, d } = parti(iso);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** 12 mar 2010 */
export function dataBreve(iso?: string | null): string {
  if (!iso) return '—';
  const { y, m, d } = parti(iso);
  return `${d} ${MESI[m - 1]} ${y}`;
}

/** 12 marzo 2010 */
export function dataLunga(iso?: string | null): string {
  if (!iso) return '—';
  const { y, m, d } = parti(iso);
  return `${d} ${MESI_LUNGHI[m - 1]} ${y}`;
}

export function dataOra(iso?: string | null): string {
  if (!iso) return '—';
  return iso.length > 10 ? `${data(iso)} ${iso.slice(11, 16)}` : data(iso);
}

export function meseAnno(y: number, m0: number): string {
  return `${MESI_LUNGHI[m0]} ${y}`;
}

export function meseBreve(m0: number): string {
  return MESI[m0];
}

export function toDate(iso: string): Date {
  const { y, m, d } = parti(iso);
  return new Date(y, m - 1, d);
}

export function giorniTra(daISO: string, aISO: string): number {
  return Math.round((toDate(aISO).getTime() - toDate(daISO).getTime()) / 86400000);
}

export function aggiungiGiorni(iso: string, n: number): string {
  const d = toDate(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function aggiungiMesi(iso: string, n: number): string {
  const d = toDate(iso);
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Anni compiuti tra due date (età, o anni dalla morte). */
export function anniTra(daISO: string, aISO: string): number {
  const a = parti(daISO);
  const b = parti(aISO);
  let anni = b.y - a.y;
  if (b.m < a.m || (b.m === a.m && b.d < a.d)) anni--;
  return anni;
}

/** "deceduto da 14 anni" — elaborazione automatica. */
export function decedutoDa(d: Defunto, oggi = oggiISO()): string | null {
  if (!d.dataMorte) return null;
  const anni = anniTra(d.dataMorte, oggi);
  const parola = d.sesso === 'F' ? 'deceduta' : 'deceduto';
  if (anni < 1) {
    const mesi = Math.max(0, Math.floor(giorniTra(d.dataMorte, oggi) / 30.44));
    return mesi <= 1 ? `${parola} da meno di un mese` : `${parola} da ${mesi} mesi`;
  }
  return `${parola} da ${anni} ${anni === 1 ? 'anno' : 'anni'}`;
}

export function anniFa(iso?: string | null, oggi = oggiISO()): string {
  if (!iso) return '';
  const anni = anniTra(iso, oggi);
  if (anni < 1) return 'meno di un anno fa';
  return `${anni} ${anni === 1 ? 'anno' : 'anni'} fa`;
}

export function eta(d: Defunto): number | null {
  if (!d.dataNascita || !d.dataMorte) return null;
  return anniTra(d.dataNascita, d.dataMorte);
}

export function nomeCompleto(d?: Defunto | null): string {
  if (!d) return '';
  const n = [d.nome, d.cognome].filter(Boolean).join(' ').trim();
  return n || 'Nominativo non leggibile';
}

export function cognomeNome(d?: Defunto | null): string {
  if (!d) return '';
  return [d.cognome, d.nome].filter(Boolean).join(' ').trim() || 'Nominativo non leggibile';
}

export function anniVita(d: Defunto): string {
  const a = d.dataNascita ? d.dataNascita.slice(0, 4) : '?';
  const b = d.dataMorte ? d.dataMorte.slice(0, 4) : '?';
  return `${a} – ${b}`;
}

const NF = new Intl.NumberFormat('it-IT');
const EUR = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
export const numero = (n: number) => NF.format(n);
export const euro = (n: number) => EUR.format(n);
export const percentuale = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function normalizza(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function slug(s: string): string {
  return normalizza(s).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'campo';
}

export function iniziali(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export function plurale(n: number, uno: string, molti: string): string {
  return `${numero(n)} ${n === 1 ? uno : molti}`;
}

export function saluto(): string {
  const h = new Date().getHours();
  if (h < 13) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}
