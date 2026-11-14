import { jsPDF } from 'jspdf';
import { campiPer, concessioneScheda, descrizioneScheda, labelLista, statoConcessione, statoDef, tipologiaDef, valoreLeggibile } from '../data/selectors';
import { NOMI_MOTIVO, NOMI_TIPO_CONCESSIONE, nomeSoggetto, statoEffettivo } from '../data/concessioni';
import { NOMI_DESTINAZIONE, NOMI_OGGETTO, NOMI_OPERAZIONE, STATI_PRATICA, nomeOperazione } from '../data/pratiche';
import { statoAvviso } from '../data/scadenze';
import { indiceSchede } from '../data/store';
import type { AvvisoPagamento, Concessione, ConfigScheda, Database, Pratica, Scheda } from '../data/types';
import { markDataUrl } from './brand';
import { adessoISO, data, decedutoDa, eta, nomeCompleto, oggiISO, dataOra } from './format';
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
  constructor(public doc: jsPDF, y: number, private onNuovaPagina: () => void, private alto = 34) {
    this.y = y;
  }
  spazio(h: number) {
    if (this.y + h > 280) {
      this.doc.addPage();
      this.y = this.alto;
      this.onNuovaPagina();
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

function piedi(doc: jsPDF, nota?: string) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 231, 238);
    doc.line(14, 287, 196, 287);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRIGIO);
    doc.text(`Generato con CimiTera · Una soluzione DAT | HYA Group${nota ? ` · ${nota}` : ''} · ${dataOra(adessoISO())}`, 14, 291.5);
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
    doc.text(`Generato con CimiTera · Una soluzione DAT | HYA Group · ${dataOra(adessoISO())}`, 14, 203);
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

// ---------------------------------------------------------------------------
// Stampe dell'ufficio: contratto di concessione e fascicolo della pratica.
// Fac-simile: il testo vero sarà quello del contratto-tipo del Comune.
// ---------------------------------------------------------------------------

const importo = (n: number) => {
  const [intero, decimali] = n.toFixed(2).split('.');
  return `${intero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimali} euro`;
};

/** Pagina di un documento del Comune: fascia con il Comune, filigrana "Fac-simile", piè di pagina CimiTera. */
class Documento {
  doc = new jsPDF({ unit: 'mm', format: 'a4' });
  pag: Impaginatore;
  constructor(private comune: string, private destra: string) {
    this.testata();
    this.pag = new Impaginatore(this.doc, 36, () => {
      this.testata();
      this.pag.y = 36;
    });
  }
  private testata() {
    const d = this.doc;
    filigrana(d, 'Fac-simile');
    d.setFillColor(...NAVY);
    d.rect(0, 0, 210, 24, 'F');
    d.setFillColor(121, 170, 79);
    d.rect(0, 24, 210, 1, 'F');
    d.setTextColor(255, 255, 255);
    d.setFont('helvetica', 'bold');
    d.setFontSize(14);
    d.text(`Comune di ${this.comune}`, 14, 11);
    d.setFont('helvetica', 'normal');
    d.setFontSize(9);
    d.text('Ufficio Servizi Cimiteriali', 14, 17);
    d.setFontSize(9);
    d.text(this.destra, 196, 14, { align: 'right' });
  }
  /** Titolo grande, sottotitolo e la riga che ricorda che è un fac-simile. */
  intestazione(titolo: string, sotto: string, avviso?: string) {
    const d = this.doc;
    const p = this.pag;
    d.setFont('helvetica', 'bold');
    d.setFontSize(15);
    d.setTextColor(...NAVY);
    d.text(titolo, 14, p.y + 2);
    d.setFont('helvetica', 'normal');
    d.setFontSize(9.5);
    d.setTextColor(...TESTO);
    d.text(sotto, 14, p.y + 9);
    d.setFontSize(8);
    d.setTextColor(...GRIGIO);
    d.text('Fac-simile: testo di esempio. Il testo vero sarà quello dei modelli del Comune.', 14, p.y + 14.5);
    p.y += 23;
    if (avviso) {
      d.setFillColor(253, 236, 234);
      d.roundedRect(14, p.y - 1, 182, 9, 1.5, 1.5, 'F');
      d.setFont('helvetica', 'bold');
      d.setFontSize(9);
      d.setTextColor(170, 45, 38);
      d.text(avviso, 18, p.y + 4.6);
      p.y += 12;
    }
  }
  /** Una riga per voce: etichetta a sinistra, valore a tutta larghezza. */
  righe(voci: [string, string][]) {
    const d = this.doc;
    for (const [k, v] of voci) {
      d.setFont('helvetica', 'bold');
      d.setFontSize(9.5);
      const testo = d.splitTextToSize(v || '—', 136) as string[];
      const h = testo.length * 4.4 + 1.8;
      this.pag.spazio(h);
      d.setFont('helvetica', 'normal');
      d.setFontSize(8.5);
      d.setTextColor(...GRIGIO);
      d.text(k, 14, this.pag.y);
      d.setFont('helvetica', 'bold');
      d.setFontSize(9.5);
      d.setTextColor(...TESTO);
      d.text(testo, 60, this.pag.y);
      this.pag.y += h;
    }
  }
  paragrafo(testo: string, rientro = 0) {
    const d = this.doc;
    d.setFont('helvetica', 'normal');
    d.setFontSize(9.5);
    const righe = d.splitTextToSize(testo, 182 - rientro) as string[];
    for (const r of righe) {
      this.pag.spazio(5);
      d.setFont('helvetica', 'normal');
      d.setFontSize(9.5);
      d.setTextColor(...TESTO);
      d.text(r, 14 + rientro, this.pag.y);
      this.pag.y += 4.7;
    }
    this.pag.y += 1.6;
  }
  clausole(testi: string[]) {
    testi.forEach((t, i) => {
      this.pag.spazio(5);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(...NAVY);
      this.doc.text(`${i + 1}.`, 14, this.pag.y);
      this.paragrafo(t, 6);
    });
  }
  /** Spazi per le firme, due per riga. */
  firme(chi: string[]) {
    const d = this.doc;
    this.pag.y += 4;
    for (let i = 0; i < chi.length; i += 2) {
      this.pag.spazio(22);
      chi.slice(i, i + 2).forEach((nome, j) => {
        const x = 14 + j * 96;
        d.setFont('helvetica', 'normal');
        d.setFontSize(8.5);
        d.setTextColor(...GRIGIO);
        d.text(d.splitTextToSize(nome, 84) as string[], x, this.pag.y);
        d.setDrawColor(150, 160, 175);
        d.line(x, this.pag.y + 13, x + 84, this.pag.y + 13);
      });
      this.pag.y += 22;
    }
  }
  /** Luogo, data e firme: sempre insieme, sulla stessa pagina. */
  chiusura(testo: string, chi: string[]) {
    this.pag.spazio(16 + Math.ceil(chi.length / 2) * 22);
    this.pag.y += 4;
    this.paragrafo(testo);
    this.firme(chi);
  }
  salva(nome: string) {
    piedi(this.doc, 'Fac-simile');
    this.doc.save(nome);
  }
}

function postazione(s: Scheda | undefined, db: Database): string {
  if (!s) return '—';
  const str = s.posizione ? db.strutture.find((x) => x.id === s.posizione!.strutturaId) : undefined;
  const dove = str && s.posizione ? ` · ${str.nome}, ${str.facce[s.posizione.faccia]?.nome ?? ''} fila ${s.posizione.fila} colonna ${s.posizione.colonna}` : '';
  return `${s.id} · ${descrizioneScheda(s)} · ${s.viale || '—'}${dove}`;
}

function righeAvviso(a: AvvisoPagamento | undefined): [string, string][] {
  if (!a) return [['Avviso di pagamento', 'Nessuno']];
  const st = statoAvviso(a);
  const stato =
    st === 'pagato' ? `Pagato il ${data(a.pagatoIl)}${a.ricevuta ? ` · ricevuta ${a.ricevuta}` : ''}` :
    st === 'annullato' ? `Annullato il ${data(a.annullatoIl)}` :
    st === 'scaduto' ? `Scaduto il ${data(a.scadenza)}: non ancora pagato` :
    `Da pagare entro il ${data(a.scadenza)}`;
  return [['Avviso di pagamento', `${a.numero} · ${importo(a.importo)}`], ['Stato del pagamento', `${stato} (pagoPA simulato)`]];
}

/** Contratto di concessione cimiteriale, con i dati del contratto e le condizioni di esempio. */
export async function pdfContrattoConcessione(c: Concessione, db: Database) {
  const cim = db.cimiteri.find((x) => x.id === c.cimiteroId);
  const comune = cim?.comune ?? '';
  const regole = db.regole.concessioni;
  const e = statoEffettivo(c, db.regole);
  const doc = new Documento(comune, `Concessione ${c.numero}`);
  const tipo = NOMI_TIPO_CONCESSIONE[c.tipo].toLowerCase();
  const avviso =
    e.stato === 'chiusa' ? `Contratto chiuso${c.chiusaIl ? ` il ${data(c.chiusaIl)}` : ''}${e.motivo ? ` · ${NOMI_MOTIVO[e.motivo]}` : ''}` :
    e.stato === 'in_decadenza' ? 'Decadenza avviata: il contratto è in corso finché non viene dichiarata' : undefined;
  doc.intestazione('Contratto di concessione cimiteriale', `N. ${c.numero} · stipulato il ${data(c.dataStipula)}${c.provvedimento ? ` · ${c.provvedimento}` : ''}`, avviso);

  doc.paragrafo(`Il Comune di ${comune}, rappresentato dal Responsabile dell'Ufficio Servizi Cimiteriali, concede l'uso della sepoltura descritta qui sotto a:`);
  doc.righe(c.concessionari.map((x, i) => [
    c.concessionari.length > 1 ? `Concessionario ${i + 1}` : 'Concessionario',
    [`${nomeSoggetto(x)}${x.rappresentante ? ' (rappresentante)' : ''}`, `${x.tipo === 'ente' ? 'C.F./P.IVA' : 'C.F.'} ${x.codiceFiscale}`, x.indirizzo, x.legaleRappresentante ? `legale rappresentante ${x.legaleRappresentante}` : ''].filter(Boolean).join(' · '),
  ] as [string, string]));

  doc.pag.titolo('Oggetto della concessione');
  const schede = indiceSchede(db.schede);
  const elenco = c.schedeIds.slice(0, 12).map((id) => postazione(schede.get(id), db));
  if (c.schedeIds.length > 12) elenco.push(`e altre ${c.schedeIds.length - 12} postazioni`);
  doc.righe([
    ['Tipo di sepoltura', NOMI_TIPO_CONCESSIONE[c.tipo]],
    ['Cimitero', cim?.nome ?? '—'],
    ...elenco.map((x, i) => [i ? '' : c.schedeIds.length > 1 ? 'Postazioni' : 'Postazione', x] as [string, string]),
    ['Posti', String(c.postiTotali)],
  ]);

  doc.pag.titolo('Durata');
  doc.righe([
    ['Decorrenza', data(c.decorrenza)],
    ['Durata', `${c.durataAnni} anni`],
    ['Scadenza', data(c.scadenza)],
    ['Rinnovi concessi', String(c.rinnovi)],
    ['Regola applicata', c.regola],
  ]);

  doc.pag.titolo('Tariffa');
  const avvisi = db.avvisi.filter((a) => a.motivo === 'concessione' && a.riferimentoId === c.id && a.stato !== 'annullato');
  const nuova = avvisi.find((a) => a.causale.includes('nuova concessione'));
  doc.righe([['Tariffa di concessione', importo(nuova?.importo ?? regole.tariffe[c.tipo].nuova)], ...righeAvviso(nuova)]);

  if (c.tipo === 'tomba_famiglia') {
    doc.pag.titolo('Aventi diritto alla sepoltura');
    if (c.aventiDiritto?.length) doc.righe(c.aventiDiritto.map((a) => [a.parentela, a.nome] as [string, string]));
    else doc.paragrafo('Nessuno indicato.');
  }

  doc.pag.titolo('Condizioni');
  doc.clausole([
    `La concessione dà il diritto d'uso della sepoltura per la durata indicata. La sepoltura resta del Comune e non si può vendere né cedere ad altri.`,
    c.tipo === 'tomba_famiglia'
      ? 'Nella tomba di famiglia possono essere sepolti i concessionari e gli aventi diritto indicati in questo contratto, fino al numero dei posti.'
      : `Nel ${tipo} può essere accolto solo il defunto per cui è stato concesso, o chi indica il concessionario secondo il regolamento comunale.`,
    'La manutenzione della sepoltura e della lapide è a carico del concessionario.',
    `Alla scadenza la concessione si può rinnovare per ${regole.durataRinnovo} anni, su domanda del concessionario e con il pagamento della tariffa di rinnovo (oggi ${importo(regole.tariffe[c.tipo].rinnovo)}). Senza rinnovo la sepoltura torna al Comune.`,
    'Il concessionario può rinunciare alla concessione. Il Comune può dichiararne la decadenza per abbandono della sepoltura o per mancato pagamento, dopo una diffida.',
    'Per tutto quello che questo contratto non dice valgono il regolamento comunale di polizia mortuaria e il DPR 285/1990.',
  ]);

  const variazioni = c.storico.slice(1);
  if (variazioni.length) {
    doc.pag.titolo('Rinnovi e variazioni');
    doc.righe(variazioni.map((ev) => [data(ev.data), `${ev.azione}${ev.atto ? ` · ${ev.atto}` : ''}`] as [string, string]));
  }

  doc.chiusura(`Letto, confermato e sottoscritto. ${comune}, ${data(c.dataStipula)}.`, [
    "Il Responsabile dell'Ufficio Servizi Cimiteriali",
    ...c.concessionari.map((x) => (x.tipo === 'ente' ? `Per ${nomeSoggetto(x)}, il legale rappresentante` : `Il concessionario ${nomeSoggetto(x)}`)),
  ]);
  doc.salva(`CimiTera_contratto_${c.numero.replace(/\//g, '-')}.pdf`);
}

/** Fascicolo della pratica: operazione, defunto, postazioni, richiedente, agenzia, pagamento e storico. */
export async function pdfPratica(p: Pratica, db: Database) {
  const cim = db.cimiteri.find((x) => x.id === p.cimiteroId);
  const comune = cim?.comune ?? '';
  const schede = indiceSchede(db.schede);
  const stato = STATI_PRATICA.find((s) => s.id === p.stato)?.label ?? p.stato;
  const doc = new Documento(comune, `Pratica ${p.numero}`);
  doc.intestazione(
    `Pratica di ${NOMI_OPERAZIONE[p.tipo].toLowerCase()}`,
    `N. ${p.numero} · aperta il ${data(p.apertaIl)} · ${p.dUfficio ? "d'ufficio" : 'su richiesta'} · ${stato.toLowerCase()}`,
    p.stato === 'annullata' ? `Pratica annullata il ${data(p.annullataIl)}${p.motivoAnnullamento ? `: ${p.motivoAnnullamento}` : ''}` : undefined,
  );

  doc.pag.titolo('Defunto');
  doc.righe([
    ['Nominativo', nomeCompleto(p.defunto)],
    ['Data di nascita', data(p.defunto.dataNascita)],
    ['Data di morte', data(p.defunto.dataMorte)],
  ]);

  doc.pag.titolo('Operazione');
  const nomi = (p.operatoriIds ?? []).map((id) => db.operatori.find((o) => o.id === id)?.nome ?? id);
  const voci: [string, string][] = [
    ['Operazione', nomeOperazione(p)],
    ['Cosa', NOMI_OGGETTO[p.oggetto]],
    ['Cimitero', cim?.nome ?? '—'],
    [p.tipo === 'traslazione' ? 'Da' : 'Postazione', postazione(schede.get(p.schedaId), db)],
  ];
  if (p.tipo === 'traslazione') voci.push(['A', postazione(p.schedaArrivoId ? schede.get(p.schedaArrivoId) : undefined, db)]);
  if (p.dataOra) voci.push([p.stato === 'eseguita' ? 'Eseguita il' : 'Programmata il', `${data(p.dataOra.slice(0, 10))} alle ${p.dataOra.slice(11, 16)}`]);
  if (nomi.length) voci.push(['Operatori', nomi.join(', ')]);
  if (p.esitoResti) voci.push(['Destinazione dei resti', `${NOMI_DESTINAZIONE[p.esitoResti.destinazione]}${p.esitoResti.schedaId ? `: ${p.esitoResti.schedaId}` : ''}`]);
  if (p.tipo === 'traslazione' && p.utenzaVotiva) voci.push(['Utenza votiva', p.utenzaVotiva === 'sposta' ? 'Si sposta sulla nuova postazione' : 'Si chiude']);
  if (p.note) voci.push(['Note', p.note]);
  doc.righe(voci);

  if (!p.dUfficio && p.richiedente) {
    const r = p.richiedente;
    doc.pag.titolo('Richiedente');
    doc.righe([
      ['Nominativo', r.nome],
      ['Codice fiscale', r.codiceFiscale],
      ['Legame con il defunto', r.legameDefunto ?? '—'],
      ['Indirizzo', r.indirizzo ?? '—'],
      ['Recapiti', [r.telefono, r.email].filter(Boolean).join(' · ') || '—'],
    ]);
  }

  const agenzia = db.agenzie.find((a) => a.id === p.agenziaId);
  if (agenzia) {
    doc.pag.titolo('Agenzia funebre');
    doc.righe([
      ['Agenzia', agenzia.nome],
      ['Partita IVA', agenzia.partitaIva],
      ['Recapiti', [agenzia.telefono, agenzia.email].filter(Boolean).join(' · ')],
    ]);
  }

  doc.pag.titolo('Attestazione di pagamento');
  if (p.dUfficio) doc.paragrafo("Pratica avviata d'ufficio: nessuna tariffa.");
  else {
    const a = db.avvisi.find((x) => x.motivo === 'pratica' && x.riferimentoId === p.id && x.stato !== 'annullato') ?? db.avvisi.find((x) => x.motivo === 'pratica' && x.riferimentoId === p.id);
    doc.righe([['Tariffa', p.tariffa ? importo(p.tariffa) : '—'], ...righeAvviso(a)]);
  }

  if (p.storico?.length) {
    doc.pag.titolo('Storico');
    doc.righe(p.storico.map((ev) => [data(ev.data), `${ev.azione} · ${ev.operatore}`] as [string, string]));
  }

  doc.chiusura(`${comune}, ${data(oggiISO())}.`, [...(p.dUfficio ? [] : ['Il richiedente']), "L'Ufficio Servizi Cimiteriali"]);
  doc.salva(`CimiTera_pratica_${p.numero.replace(/\//g, '-')}.pdf`);
}
