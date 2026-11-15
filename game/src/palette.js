// The look plan, in one place. A dusk scrapyard: cold blue-grey steel against
const ENTRIES = [
  ['canvas', '#2b3140'],
  ['surface', '#2b303c'],
  ['hairline', '#3d4554'],
  ['ink', '#e9e2d2'],
  ['muted', '#8b95a6'],
  ['accent', '#f5a623'],
  ['ember', '#e8532f'],
  ['vanguard', '#4aa3ff'],
  ['siteA', '#f5a623'],
  ['siteB', '#39c5d8'],
  ['rust', '#9a5a34'],
  ['teal', '#3f6f6a'],
  ['danger', '#e23b2e'],
  ['brass', '#c9971f'],
  ['smoke', '#b4b4bc'],
  ['mint', '#39ff88'],
];

export const PALETTE = Object.fromEntries(ENTRIES);

export function shade(name) {
  return PALETTE[name];
}
