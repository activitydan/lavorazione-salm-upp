// Pittogramma di CimiTera: griglia 3×3 di quadrati arrotondati (le postazioni viste dall'alto),
// con il quadrato centrale verde. Disegnato dalla descrizione del logo del cliente.

export function markSvg(variante: 'chiaro' | 'scuro' = 'chiaro'): string {
  const blu = variante === 'scuro' ? '#FFFFFF' : '#0A2F55';
  const verde = '#79AA4F';
  const lato = 26;
  const passo = lato + 6;
  const quadrati: string[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      quadrati.push(`<rect x="${15 + c * passo}" y="${11 + r * passo}" width="${lato}" height="${lato}" rx="7" fill="${r === 1 && c === 1 ? verde : blu}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 8 116 96">${quadrati.join('')}</svg>`;
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
