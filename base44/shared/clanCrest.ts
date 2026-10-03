export const CLAN_FOCUS = ['PvP', 'PvE', 'Competitive', 'Trading', 'Casual'];
export const CREST_SHAPES = ['shield', 'diamond', 'round'];
export const CREST_SYMBOLS = ['star', 'swords', 'crown', 'mountain'];
export const CREST_PATTERNS = ['solid', 'split', 'stripes'];
type Design = { shape?: string; symbol?: string; pattern?: string; primary?: string; accent?: string };
export function normalizeCrest(input: Design = {}) {
  const choose = (value: string | undefined, values: string[], fallback: string) => values.includes(String(value)) ? String(value) : fallback;
  const color = (value: string | undefined, fallback: string) => /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
  return {
    shape: choose(input?.shape, CREST_SHAPES, 'shield'), symbol: choose(input?.symbol, CREST_SYMBOLS, 'star'),
    pattern: choose(input?.pattern, CREST_PATTERNS, 'split'), primary: color(input?.primary, '#142a3d'), accent: color(input?.accent, '#8ce3f4'),
  };
}
export function crestSvg(input: Design = {}) {
  const d = normalizeCrest(input);
  const shape = d.shape === 'shield' ? 'M20 18H140V78Q140 130 80 149Q20 130 20 78Z' : d.shape === 'diamond' ? 'M80 9L151 80L80 151L9 80Z' : 'M80 10a70 70 0 1 0 0 140a70 70 0 1 0 0-140';
  const symbols: Record<string, string> = {
    star: 'M80 41L89 68L118 68L95 86L104 114L80 97L56 114L65 86L42 68L71 68Z',
    swords: 'M45 40L54 42L109 108L117 105L120 110L109 122L104 117L107 111L42 53Z M115 40L106 42L51 108L43 105L40 110L51 122L56 117L53 111L118 53Z',
    crown: 'M44 63L64 79L80 49L96 79L116 63L109 104H51Z M52 112H108V117H52Z',
    mountain: 'M37 113L72 48L85 74L97 61L127 113Z M63 76L72 60L83 82L73 76L68 81Z',
  };
  const pattern = d.pattern === 'split' ? '<path d="M80 0H160V160H80Z" fill="' + d.accent + '" opacity=".12"/>' : d.pattern === 'stripes' ? '<path d="M-20 40L120 180M0 0L160 160M40-20L180 120" stroke="' + d.accent + '" stroke-width="17" opacity=".1"/>' : '';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 164"><defs><clipPath id="crest"><path d="' + shape + '"/></clipPath></defs><path d="' + shape + '" fill="' + d.primary + '"/><g clip-path="url(#crest)">' + pattern + '</g><path d="' + shape + '" fill="none" stroke="' + d.accent + '" stroke-width="2"/><path d="' + symbols[d.symbol] + '" fill="' + d.accent + '"/><path d="' + shape + '" transform="translate(8 8) scale(.9)" fill="none" stroke="' + d.accent + '" stroke-width=".5" opacity=".45"/></svg>';
}
export function crestDataUri(input: Design = {}) { return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(crestSvg(input)); }
