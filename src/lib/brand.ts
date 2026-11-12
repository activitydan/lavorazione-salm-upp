// Pittogramma di CimiTera, ridisegnato in vettoriale dal mockup del cliente:
// segnaposto con cappella, su un terreno di tasselli verdi e blu (la mappa).

function rombo(cx: number, cy: number, w: number, h: number, k = 0.84) {
  const a = (w / 2) * k;
  const b = (h / 2) * k;
  return `${cx - a},${cy} ${cx},${cy - b} ${cx + a},${cy} ${cx},${cy + b}`;
}

export function markSvg(variante: 'chiaro' | 'scuro' = 'chiaro'): string {
  const scuro = variante === 'scuro';
  const pin = scuro ? '#FFFFFF' : '#0A2F55';
  const pinLuce = scuro ? '#E6EDF5' : '#1D4C7C';
  const base = scuro ? '#AFC0D3' : '#D3DAE3';
  const cappella = scuro ? '#0A2F55' : '#FFFFFF';
  const dettagli = scuro ? '#FFFFFF' : '#0A2F55';
  const blu = scuro ? '#3A86C8' : '#165A92';
  const verde = '#79AA4F';
  const T = [60, 74];
  const W = 36;
  const H = 18;
  const cella = (i: number, j: number) => [T[0] + ((i - j) * W) / 2, T[1] + ((i + j) * H) / 2];
  const tasselli = [
    [verde, -1, 1], [verde, 1, -1], [blu, 0, 0], [blu, 1, 0], [blu, 0, 1], [blu, 1, 1],
  ] as const;
  const t = tasselli.map(([c, i, j]) => {
    const [x, y] = cella(i, j);
    return `<polygon points="${rombo(x, y, W, H)}" fill="${c}"/>`;
  }).join('');
  const pinPath = 'M44.85 64.73 A29 29 0 1 1 75.15 64.73 L60 74 Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 8 116 96">
<defs><clipPath id="pinclip"><path d="${pinPath}"/></clipPath></defs>
${t}
<path d="${pinPath}" fill="${pin}"/>
<g clip-path="url(#pinclip)"><path d="M60 40 L95 40 L95 64 L60 64 Z" fill="${pinLuce}" opacity=".55"/><rect x="20" y="58.5" width="80" height="30" fill="${base}"/></g>
<rect x="47.5" y="37" width="25" height="21.5" fill="${cappella}"/>
<polygon points="44.5,38.5 60,25.5 75.5,38.5" fill="${cappella}"/>
<rect x="45.5" y="37" width="29" height="2.6" fill="${cappella}" stroke="${dettagli}" stroke-opacity=".12" stroke-width=".6"/>
<rect x="59" y="28.2" width="2" height="7.6" fill="${dettagli}"/><rect x="56.6" y="30.3" width="6.8" height="1.9" fill="${dettagli}"/>
<path d="M55.2 58.5 L55.2 48.2 A4.8 4.8 0 0 1 64.8 48.2 L64.8 58.5 Z" fill="${dettagli}"/>
<rect x="68.5" y="39.6" width="4" height="18.9" fill="${dettagli}" opacity=".08"/>
</svg>`;
}

export function markDataUrl(variante: 'chiaro' | 'scuro' = 'chiaro'): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markSvg(variante))}`;
}

export const BRAND = {
  navy: '#0A2F55',
  navyScuro: '#0F1B2D',
  blu: '#1B5A8F',
  verde: '#79AA4F',
  verdeScuro: '#4A822B',
};
