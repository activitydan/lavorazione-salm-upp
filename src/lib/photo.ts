import type { Scheda } from '../data/types';

// Foto delle schede: quella caricata dall'operatore oppure un segnaposto neutro.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let segnaposto = '';

/** Segnaposto neutro: fondo bianco con righe grigie e la scritta al centro. */
export function segnapostoImmagine(testo = 'Immagine'): string {
  if (testo === 'Immagine' && segnaposto) return segnaposto;
  let righe = '';
  // fondo bianco dietro la scritta, largo quanto il testo (Arial grassetto 28 px, circa 16 px a lettera)
  const fondo = Math.min(600, Math.round(testo.length * 16.5 + 48));
  for (let y = 24; y < 480; y += 24) righe += `<line x1="0" y1="${y}" x2="640" y2="${y}" stroke="#E1E5EA" stroke-width="1.5"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480"><rect width="640" height="480" fill="#FFFFFF"/>${righe}<rect x="${320 - fondo / 2}" y="208" width="${fondo}" height="64" rx="10" fill="#FFFFFF"/><text x="320" y="249" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#8A94A0">${esc(testo)}</text></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  if (testo === 'Immagine') segnaposto = url;
  return url;
}

export function fotoUrl(s: Scheda, foto: Record<string, string>): string {
  return (s.fotoId && foto[s.fotoId]) || segnapostoImmagine();
}

export function caricaImmagine(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ko(new Error('Immagine non caricabile'));
    img.src = src;
  });
}

/** Converte un'immagine (anche SVG) in JPEG per PDF ed esportazioni. */
export async function rasterizza(src: string, w = 640, h = 480, qualita = 0.86): Promise<string> {
  const img = await caricaImmagine(src);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  // riempimento "cover"
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * k;
  const ih = img.naturalHeight * k;
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  return c.toDataURL('image/jpeg', qualita);
}

/** Ridimensiona e comprime una foto (file o data URL) entro il lato massimo indicato. */
export async function riduciFoto(src: string, lato = 1280, qualita = 0.82): Promise<string> {
  const img = await caricaImmagine(src);
  const k = Math.min(1, lato / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', qualita);
}

/** Ridimensiona e comprime la foto scattata dal telefono prima di salvarla. */
export async function comprimiFoto(file: File, lato = 1280): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    return await riduciFoto(url, lato);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Ruota la foto di 90° in senso orario (lapide fotografata con il telefono girato). */
export async function ruotaFoto(src: string): Promise<string> {
  const img = await caricaImmagine(src);
  const c = document.createElement('canvas');
  c.width = img.naturalHeight;
  c.height = img.naturalWidth;
  const ctx = c.getContext('2d')!;
  ctx.translate(c.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, 0, 0);
  return c.toDataURL('image/jpeg', 0.9);
}
