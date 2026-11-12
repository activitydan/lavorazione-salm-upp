import { jsPDF } from 'jspdf';
import { campiPer, descrizioneScheda, labelLista, statoConcessione, statoDef, tipologiaDef, valoreLeggibile } from '../data/selectors';
import type { ConfigScheda, Database, Scheda } from '../data/types';
import { markDataUrl } from './brand';
import { data, decedutoDa, eta, nomeCompleto, oggiISO, dataOra } from './format';
import { fotoUrl, rasterizza } from './photo';
import { qrDataUrl, urlScheda } from './qr';

export interface ContestoPdf {
  config: ConfigScheda;
  db: Database;
  foto: Record<string, string>;
}

const NAVY: [number, number, number] = [10, 47, 85];
const GRIGIO: [number, number, number] = [91, 107, 128];
const TESTO: [number, number, number] = [20, 36, 58];

let logoPng: Promise<string> | null = null;
function logo() {
  logoPng ??= rasterizzaPng(markDataUrl('scuro'), 240, 200);
  return logoPng;
}

async function rasterizzaPng(src: string, w: number, h: number): Promise<string> {
  const img = await new Promise<HTMLImageElement>((ok, ko) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = ko;
    i.src = src;
  });
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/png');
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function chiaro(hex: string) {
  const [r, g, b] = hexRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

function chip(doc: jsPDF, x: number, y: number, testo: string, colore: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const w = doc.getTextWidth(testo) + 7;
  const [r, g, b] = hexRgb(colore);
  doc.setFillColor(r, g, b);
  doc.setDrawColor(190, 198, 208);
  doc.roundedRect(x, y - 4.2, w, 6, 1.5, 1.5, colore.toUpperCase() === '#FFFFFF' ? 'FD' : 'F');
  doc.setTextColor(...(chiaro(colore) ? TESTO : ([255, 255, 255] as [number, number, number])));
  doc.text(testo, x + 3.5, y);
  return w;
}

class Impaginatore {
  y: number;
  constructor(public doc: jsPDF, y: number, private onNuovaPagina: () => void) {
    this.y = y;
  }
  spazio(h: number) {
    if (this.y + h > 280) {
      this.doc.addPage();
      this.onNuovaPagina();
      this.y = 20;
    }
  }
  titolo(t: string) {
    this.spazio(14);
    const d = this.doc;
    this.y += 4;
    d.setFont('helvetica', 'bold');
    d.setFontSize(10.5);
    d.setTextColor(...NAVY);
    d.text(t.toUpperCase(), 14, this.y);
    d.setDrawColor(121, 170, 79);
    d.setLineWidth(0.6);
    d.line(14, this.y + 1.6, 30, this.y + 1.6);
    d.setLineWidth(0.2);
    this.y += 7;
  }
  coppie(voci: [string, string][]) {
    const d = this.doc;
    const colW = 91;
    for (let i = 0; i < voci.length; i += 2) {
      const riga = voci.slice(i, i + 2);
      const righeTesto = riga.map(([, v]) => d.splitTextToSize(v || '—', colW - 34) as string[]);
      const h = Math.max(...righeTesto.map((r) => r.length)) * 4.4 + 2;
      this.spazio(h);
      riga.forEach(([k], j) => {
        const x = 14 + j * (colW + 2);
        d.setFont('helvetica', 'normal');
        d.setFontSize(8.5);
        d.setTextColor(...GRIGIO);
        d.text(k, x, this.y);
        d.setFont('helvetica', 'bold');
        d.setFontSize(9.5);
        d.setTextColor(...TESTO);
        d.text(righeTesto[j], x + 34, this.y);
      });
      this.y += h;
    }
  }
}

async function paginaScheda(doc: jsPDF, s: Scheda, ctx: ContestoPdf) {
  const { config, db } = ctx;
  const cim = db.cimiteri.find((c) => c.id === s.cimiteroId);
  const [foto, qr, lg] = await Promise.all([rasterizza(fotoUrl(s, ctx.foto), 800, 600), qrDataUrl(urlScheda(s.id), 360), logo()]);

  const intestazione = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setFillColor(121, 170, 79);
    doc.rect(0, 26, 210, 1.2, 'F');
    doc.addImage(lg, 'PNG', 12, 4.5, 20.4, 17);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Cimi', 35, 14);
    doc.setTextColor(121, 170, 79);
    doc.text('Tera', 35 + doc.getTextWidth('Cimi'), 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(200, 214, 230);
    doc.text('UNA SOLUZIONE DAT | HYA GROUP', 35.3, 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(s.id, 196, 13.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 214, 230);
    doc.text(`Scheda manufatto · ${cim?.nome ?? ''}`, 196, 19.5, { align: 'right' });
  };
  intestazione();

  // foto e QR
  doc.addImage(foto, 'JPEG', 14, 34, 112, 84);
  doc.setDrawColor(220, 226, 234);
  doc.rect(14, 34, 112, 84);
  doc.setFillColor(243, 245, 248);
  doc.roundedRect(134, 34, 62, 84, 3, 3, 'F');
  doc.addImage(qr, 'PNG', 141, 39, 48, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('Scansiona per aprire', 165, 94, { align: 'center' });
  doc.text('la scheda online', 165, 98.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIGIO);
  doc.text(s.id, 165, 105, { align: 'center' });
  doc.text(`${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}`, 165, 110, { align: 'center' });

  // titolo e chip
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...TESTO);
  doc.text(doc.splitTextToSize(descrizioneScheda(s), 180)[0], 14, 129);
  let x = 14;
  const tip = tipologiaDef(config, s.tipologia);
  const st = statoDef(config, s.stato);
  x += chip(doc, x, 137, tip.label, tip.colore) + 2;
  x += chip(doc, x, 137, st.label, st.colore) + 2;
  for (const c of campiPer(config, s.tipologia, (c) => c.tipo === 'flag' && s.campi[c.id] === true)) {
    x += chip(doc, x, 137, c.label, '#E7F0F8') + 2;
    if (x > 170) break;
  }

  const pag = new Impaginatore(doc, 146, intestazione);
  pag.y = 146;
  if (s.defunti.length) {
    pag.titolo(s.defunti.length > 1 ? `Defunti (${s.defunti.length})` : 'Defunto');
    for (const d of s.defunti) {
      const e = eta(d);
      pag.coppie([
        ['Nominativo', nomeCompleto(d)],
        ['Data di morte', `${data(d.dataMorte)}${decedutoDa(d) ? ` (${decedutoDa(d)})` : ''}`],
        ['Data di nascita', data(d.dataNascita)],
        ['Età', e !== null ? `${e} anni` : '—'],
      ]);
    }
  }

  pag.titolo('Ubicazione');
  const q = db.quadranti.find((x) => x.id === s.quadranteId);
  const str = s.posizione ? db.strutture.find((x) => x.id === s.posizione!.strutturaId) : s.strutturaId ? db.strutture.find((x) => x.id === s.strutturaId) : undefined;
  const voci: [string, string][] = [
    ['Cimitero', cim?.nome ?? '—'],
    ['Via / viale', s.viale || '—'],
    ['Quadrante', q?.nome ?? '—'],
    ['Coordinate GPS', `${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}`],
  ];
  if (s.area) voci.push(['Area', `${s.area}${s.numeroPosto ? ` · ${s.numeroPosto}` : ''}`]);
  if (str) voci.push(['Struttura', str.nome]);
  if (s.posizione && str) voci.push(['Posizione', `${str.facce[s.posizione.faccia]?.nome ?? ''} · fila ${s.posizione.fila} · colonna ${s.posizione.colonna}`]);
  pag.coppie(voci);

  if (s.concessione) {
    const c = s.concessione;
    const sc = statoConcessione(s);
    pag.titolo('Concessione');
    pag.coppie([
      ['Numero', c.numero],
      ['Intestatario', c.intestatario],
      ['Inizio', data(c.dataInizio)],
      ['Scadenza', `${data(c.dataScadenza)}${sc?.stato === 'scaduta' ? ' (SCADUTA)' : sc?.stato === 'in_scadenza' ? ` (tra ${sc.giorni} giorni)` : ''}`],
      ['Durata', `${c.durataAnni} anni`],
      ['Rinnovi', String(c.rinnovi)],
    ]);
  }

  for (const sez of config.sezioni) {
    const campi = campiPer(config, s.tipologia, (c) => c.sezione === sez.id);
    if (!campi.length) continue;
    pag.titolo(sez.label);
    pag.coppie(campi.map((c) => [c.label, valoreLeggibile(c, s.campi[c.id])] as [string, string]));
  }

  const aperte = db.manutenzioni.filter((m) => m.schedaId === s.id && m.stato !== 'risolta');
  if (aperte.length) {
    pag.titolo('Manutenzioni aperte');
    pag.coppie(aperte.map((m) => [m.id, `${labelLista(config.categorieManutenzione, m.categoria)} · ${m.descrizione}`] as [string, string]));
  }
  if (s.note) {
    pag.titolo('Note');
    pag.coppie([['Note', s.note]]);
  }
}

function piedi(doc: jsPDF) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 231, 238);
    doc.line(14, 287, 196, 287);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRIGIO);
    doc.text(`Generato con CimiTera · Una soluzione DAT | HYA Group · ${dataOra(new Date().toISOString().slice(0, 16))}`, 14, 291.5);
    doc.text(`${i} / ${n}`, 196, 291.5, { align: 'right' });
  }
}

export async function pdfScheda(s: Scheda, ctx: ContestoPdf) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await paginaScheda(doc, s, ctx);
  piedi(doc);
  doc.save(`${s.id}.pdf`);
}

export async function pdfSchede(lista: Scheda[], ctx: ContestoPdf, avanzamento?: (n: number) => void, nomeFile = `CimiTera_schede_${oggiISO()}.pdf`) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  for (let i = 0; i < lista.length; i++) {
    if (i > 0) doc.addPage();
    await paginaScheda(doc, lista[i], ctx);
    avanzamento?.(i + 1);
    if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0)); // lascia respirare l'interfaccia
  }
  piedi(doc);
  doc.save(nomeFile);
}

/** Foglio A4 di etichette 3 x 8 con QR, ID, nominativo e viale: da stampare su carta adesiva. */
export async function pdfEtichetteQr(lista: Scheda[], avanzamento?: (n: number) => void) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const colonne = 3;
  const righe = 8;
  const w = 70;
  const h = 37.1;
  for (let i = 0; i < lista.length; i++) {
    const k = i % (colonne * righe);
    if (i > 0 && k === 0) doc.addPage();
    const x = (k % colonne) * w;
    const y = Math.floor(k / colonne) * h;
    const s = lista[i];
    const qr = await qrDataUrl(urlScheda(s.id), 240);
    doc.setDrawColor(230, 233, 238);
    doc.rect(x + 1.5, y + 1.5, w - 3, h - 3);
    doc.addImage(qr, 'PNG', x + 4, y + 4.5, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(s.id, x + 35, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TESTO);
    doc.text(doc.splitTextToSize(descrizioneScheda(s), 32).slice(0, 2), x + 35, y + 15.5);
    doc.setTextColor(...GRIGIO);
    doc.setFontSize(6.8);
    doc.text(doc.splitTextToSize(s.viale, 32).slice(0, 1), x + 35, y + 25);
    doc.text('CimiTera', x + 35, y + 30.5);
    avanzamento?.(i + 1);
  }
  doc.save(`CimiTera_etichette_QR_${oggiISO()}.pdf`);
}
