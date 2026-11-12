import { jsPDF } from 'jspdf';
import { campiPer, concessioneScheda, descrizioneScheda, labelLista, statoConcessione, statoDef, tipologiaDef, valoreLeggibile } from '../data/selectors';
import type { ConfigScheda, Database, Scheda } from '../data/types';
import { markDataUrl } from './brand';
import { data, decedutoDa, eta, nomeCompleto, oggiISO, dataOra } from './format';
import { fotoUrl, rasterizza } from './photo';

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
  const [foto, lg] = await Promise.all([rasterizza(fotoUrl(s, ctx.foto), 800, 600), logo()]);

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
    doc.text(`Scheda della postazione · ${cim?.nome ?? ''}`, 196, 19.5, { align: 'right' });
  };
  intestazione();

  // foto e codice
  doc.addImage(foto, 'JPEG', 14, 34, 112, 84);
  doc.setDrawColor(220, 226, 234);
  doc.rect(14, 34, 112, 84);
  doc.setFillColor(243, 245, 248);
  doc.roundedRect(134, 34, 62, 84, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text('Codice della scheda', 165, 66, { align: 'center' });
  doc.setFontSize(12);
  doc.text(s.id, 165, 74, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIGIO);
  doc.text('Coordinate GPS', 165, 84, { align: 'center' });
  doc.text(`${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}`, 165, 89, { align: 'center' });

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

  const c = concessioneScheda(s);
  if (c) {
    const sc = statoConcessione(s);
    pag.titolo('Concessione');
    pag.coppie([
      ['Numero', c.numero],
      ['Concessionario', c.concessionario],
      ['Decorrenza', data(c.decorrenza)],
      ['Scadenza', `${data(c.scadenza)}${sc?.stato === 'scaduta' ? ' (SCADUTA)' : sc?.stato === 'in_scadenza' ? ` (tra ${sc.giorni} giorni)` : ''}`],
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

/** Registro delle operazioni cimiteriali in PDF: una riga per pratica eseguita. */
export async function pdfRegistro(titolo: string, righe: string[][], anno: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const colonne: [string, number][] = [['N.', 10], ['Data', 22], ['Pratica', 28], ['Operazione', 44], ['Defunto', 62], ['Postazione', 34], ['Esito', 70]];
  const testata = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(titolo, 14, 14);
    doc.setFontSize(8);
    doc.setTextColor(...GRIGIO);
    let x = 14;
    for (const [nome, w] of colonne) {
      doc.text(nome.toUpperCase(), x, 23);
      x += w;
    }
    doc.setDrawColor(200, 208, 218);
    doc.line(14, 25, 283, 25);
  };
  testata();
  let y = 31;
  doc.setFont('helvetica', 'normal');
  for (const riga of righe) {
    if (y > 192) {
      doc.addPage();
      testata();
      y = 31;
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(8.5);
    doc.setTextColor(...TESTO);
    let x = 14;
    riga.forEach((cella, i) => {
      doc.text(String(doc.splitTextToSize(cella ?? '', colonne[i][1] - 2)[0] ?? ''), x, y);
      x += colonne[i][1];
    });
    y += 6;
  }
  if (!righe.length) doc.text('Nessuna operazione eseguita.', 14, y);
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...GRIGIO);
    doc.text(`Generato con CimiTera · Una soluzione DAT | HYA Group · ${dataOra(new Date().toISOString().slice(0, 16))}`, 14, 203);
    doc.text(`${i} / ${n}`, 283, 203, { align: 'right' });
  }
  doc.save(`CimiTera_registro_operazioni_${anno}.pdf`);
}

function filigrana(doc: jsPDF, testo: string) {
  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.12 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(74);
  doc.setTextColor(120, 130, 145);
  doc.text(testo, 105, 165, { align: 'center', angle: 35 });
  doc.restoreGraphicsState();
}

/** Lettera inviata tramite DAT (o da affiggere sulla postazione): testo fisso, filigrana "Fac-simile". */
export async function pdfLetteraDat(d: { numero: string; dataLettera: string; comune: string; destinatario: { nome: string; indirizzo: string }; oggetto: string; paragrafi: string[] }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  filigrana(doc, 'Fac-simile');
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Comune di ${d.comune}`, 20, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Ufficio Servizi Cimiteriali', 20, 17);
  doc.setTextColor(...TESTO);
  doc.setFontSize(10.5);
  doc.text([d.destinatario.nome, ...doc.splitTextToSize(d.destinatario.indirizzo, 70)], 120, 44);
  doc.setFontSize(9);
  doc.setTextColor(...GRIGIO);
  doc.text(`Lettera n. ${d.numero} del ${data(d.dataLettera)}`, 20, 44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...NAVY);
  const oggetto = doc.splitTextToSize(`Oggetto: ${d.oggetto}`, 170);
  doc.text(oggetto, 20, 76);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...TESTO);
  let y = 76 + oggetto.length * 6 + 6;
  for (const par of d.paragrafi.filter(Boolean)) {
    const righe = doc.splitTextToSize(par, 170);
    doc.text(righe, 20, y);
    y += righe.length * 5.4 + 4;
  }
  doc.text('Distinti saluti.', 20, y + 4);
  doc.text("L'Ufficio Servizi Cimiteriali", 130, y + 18);
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIGIO);
  doc.line(20, 283, 190, 283);
  doc.text('Una soluzione DAT | HYA Group · Fac-simile: nessuna lettera parte davvero', 20, 288);
  doc.save(`CimiTera_lettera_${d.numero}.pdf`);
}

/** Avviso di pagamento sul modello A4 pagoPA, con la scritta "FAC-SIMILE" e codici finti. */
export async function pdfAvvisoPagamento(a: { numero: string; causale: string; intestatario: { nome: string; codiceFiscale: string; indirizzo: string }; voci: { descrizione: string; importo: number }[]; importo: number; scadenza: string; emessoIl: string }, comune: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const eur = (n: number) => `${n.toFixed(2).replace('.', ',')} Euro`;
  filigrana(doc, 'FAC-SIMILE');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text('AVVISO DI PAGAMENTO', 14, 18);
  doc.setFontSize(10);
  doc.text('pagoPA', 196, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...TESTO);
  doc.text(doc.splitTextToSize(a.causale, 180), 14, 27);
  doc.setFillColor(243, 245, 248);
  doc.rect(14, 38, 88, 34, 'F');
  doc.rect(108, 38, 88, 34, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...GRIGIO);
  doc.text('ENTE CREDITORE', 18, 45);
  doc.text('DESTINATARIO AVVISO', 112, 45);
  doc.setFontSize(10.5);
  doc.setTextColor(...TESTO);
  doc.setFont('helvetica', 'bold');
  doc.text(`Comune di ${comune}`, 18, 52);
  doc.text(a.intestatario.nome, 112, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Ufficio Servizi Cimiteriali', 18, 58);
  doc.text(`Cod. fiscale ${a.intestatario.codiceFiscale}`, 112, 58);
  doc.text(doc.splitTextToSize(a.intestatario.indirizzo, 80), 112, 63);
  doc.setFontSize(8);
  doc.setTextColor(...GRIGIO);
  doc.text('QUANTO E QUANDO PAGARE', 14, 84);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(eur(a.importo), 14, 94);
  doc.setFontSize(12);
  doc.text(`entro il ${data(a.scadenza)}`, 196, 94, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TESTO);
  let y = 106;
  for (const v of a.voci) {
    doc.text(v.descrizione, 14, y);
    doc.text(eur(v.importo), 196, y, { align: 'right' });
    y += 6;
  }
  doc.setDrawColor(200, 208, 218);
  doc.line(14, y + 2, 196, y + 2);
  doc.setFontSize(8);
  doc.setTextColor(...GRIGIO);
  doc.text('DOVE PAGARE', 14, y + 12);
  doc.setFontSize(9.5);
  doc.setTextColor(...TESTO);
  doc.text(doc.splitTextToSize("Sul sito del Comune, con l'app della tua banca, in banca, in ricevitoria, dal tabaccaio, al bancomat, in ufficio postale. In questa versione dimostrativa il pagamento è simulato.", 182), 14, y + 18);
  doc.setFillColor(243, 245, 248);
  doc.rect(14, y + 34, 182, 30, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...GRIGIO);
  doc.text('CODICE AVVISO', 18, y + 42);
  doc.text('CODICE FISCALE ENTE CREDITORE', 110, y + 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TESTO);
  doc.text(a.numero.replace(/(.{4})/g, '$1 ').trim(), 18, y + 50);
  doc.text('00000000000', 110, y + 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRIGIO);
  doc.text('Codici finti: questo avviso non si può pagare.', 18, y + 58);
  doc.line(14, 283, 196, 283);
  doc.setFontSize(7.5);
  doc.text(`Emesso il ${data(a.emessoIl)} · Una soluzione DAT | HYA Group · FAC-SIMILE: pagoPA simulato, nessun pagamento reale`, 14, 288);
  doc.save(`CimiTera_avviso_${a.numero}.pdf`);
}
