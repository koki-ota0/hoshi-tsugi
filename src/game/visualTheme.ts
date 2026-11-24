export type VisualTheme = 'atlas';

export interface CanvasSkin {
  id: VisualTheme;
  bg: string;
  bgImage: string | null;
  bgAlpha: number;
  gold: string;
  goldSoft: string;
  paper: string;
  ink: string;
  vermilion: string;
  dust: string;
  font: string;
  fontUi: string;
  pearlCore: string;
  pearlGlow0: string;
  pearlGlow1: string;
  pearlGlow2: string;
  pearlTrail: string;
  additivePearls: boolean;
  glowSize: number;
  vesselHi: string;
  vesselLo: string;
  vesselArmorHi: string;
  vesselArmorLo: string;
  vesselHitHi: string;
  vesselHitLo: string;
  vesselStroke: string;
  vesselInner: string;
  vesselLine: number;
  crack: string;
  hp: string;
  hpBomb: string;
  bombFill: string;
  orbFill: string;
  orbStroke: string;
  orbText: string;
  aim: string;
  aimIdle: string;
  aimWidth: number;
  spark: string;
  shard: string;
  shardGold: string;
}

export const SKIN: CanvasSkin = {
  id: 'atlas',
  bg: '#e4d8bf',
  bgImage: './assets/atlas-paper.webp',
  bgAlpha: 0.92,
  gold: '#8a6a2e',
  goldSoft: 'rgba(138, 106, 46, 0.28)',
  paper: '#2c2416',
  ink: '#2c2416',
  vermilion: '#7a241c',
  dust: 'rgba(80, 60, 30, 0.28)',
  font: '"Zen Old Mincho", "Yu Mincho", serif',
  fontUi: '"Cormorant Garamond", "Zen Old Mincho", serif',
  pearlCore: '#5c4318',
  pearlGlow0: 'rgba(138, 106, 46, 0.55)',
  pearlGlow1: 'rgba(138, 106, 46, 0.18)',
  pearlGlow2: 'rgba(138, 106, 46, 0)',
  pearlTrail: 'rgba(92, 67, 24, 0.45)',
  additivePearls: false,
  glowSize: 14,
  vesselHi: '#f7f1e3',
  vesselLo: '#e0d3b8',
  vesselArmorHi: '#d2c4a6',
  vesselArmorLo: '#a89470',
  vesselHitHi: '#fff8ea',
  vesselHitLo: '#e8d09a',
  vesselStroke: '#2c2416',
  vesselInner: 'rgba(44, 36, 22, 0.22)',
  vesselLine: 1.35,
  crack: '#8a6a2e',
  hp: '#2c2416',
  hpBomb: '#7a241c',
  bombFill: 'rgba(122, 36, 28, 0.16)',
  orbFill: 'rgba(247, 241, 227, 0.55)',
  orbStroke: '#8a6a2e',
  orbText: '#2c2416',
  aim: '#5c4318',
  aimIdle: 'rgba(44, 36, 22, 0.4)',
  aimWidth: 1.15,
  spark: '#8a6a2e',
  shard: '#f3ead6',
  shardGold: '#8a6a2e',
};

export const SKINS: Record<VisualTheme, CanvasSkin> = { atlas: SKIN };

const ROMAN = [
  '',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
  'XXI',
  'XXII',
  'XXIII',
  'XXIV',
  'XXV',
  'XXVI',
  'XXVII',
  'XXVIII',
  'XXIX',
  'XXX',
  'XXXI',
  'XXXII',
  'XXXIII',
  'XXXIV',
  'XXXV',
  'XXXVI',
  'XXXVII',
  'XXXVIII',
  'XXXIX',
  'XL',
];

export function toRoman(n: number): string {
  if (n > 0 && n < ROMAN.length) return ROMAN[n];
  return String(n);
}

export function stageCaption(stage: number, _theme?: VisualTheme): string {
  return `第${stage}図`;
}

export function isVisualTheme(v: unknown): v is VisualTheme {
  return v === 'atlas';
}
