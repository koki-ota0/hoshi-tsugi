// 星継 — 落ちた星を金で縫い、図に還す。

import {
  CAMPAIGN_LENGTH,
  constellationForStage,
  geometryKindForStage,
  GEOMETRY_PLATES,
  plateSeason,
  type GeometryKind,
} from './constellations';
import { stageCaption, type VisualTheme } from './visualTheme';

export type { VisualTheme } from './visualTheme';
export type { Season, GeometryKind } from './constellations';
export {
  constellationForStage,
  magnitudeOf,
  SEASON_PLATE,
  CAMPAIGN_LENGTH,
  atlasFigure,
} from './constellations';

export type AbilityId =
  | 'pearl_surge'
  | 'twin_ring'
  | 'kintsugi_slash'
  | 'chain_burst'
  | 'sky_string'
  | 'piercing_gold'
  | 'gold_lightning'
  | 'bounce_split';

export interface AbilityDef {
  id: AbilityId;
  kanjiTitle: string;
  shortCrest: string;
  reading: string;
  minStageToAppear: number;
  maxRank: number;
  rankDescriptions: string[];
  sigilSvg: string;
}

export const ABILITIES: AbilityDef[] = [
  {
    id: 'pearl_surge',
    kanjiTitle: '連星の契',
    shortCrest: '連星',
    reading: 'れんせいのちぎり',
    minStageToAppear: 3,
    maxRank: 5,
    rankDescriptions: [
      '一度に放つ星が、ふたつ増える',
      'さらにふたつ増える（いま＋4）',
      'さらにみっつ増える（いま＋7）',
      'さらにみっつ増える（いま＋10）',
      'さらによっつ増える（いま＋14）',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="15" cy="28" r="4.5"/><circle cx="24" cy="20" r="4.5"/><circle cx="33" cy="12" r="4.5" fill="currentColor" fill-opacity="0.25"/><path d="M10 38L36 10" stroke-dasharray="3 3"/></svg>`,
  },
  {
    id: 'twin_ring',
    kanjiTitle: '黄道の環',
    shortCrest: '黄道',
    reading: 'こうどうのわ',
    minStageToAppear: 3,
    maxRank: 5,
    rankDescriptions: [
      '黄道の環が出る。通った星を、毎図3つまで分ける',
      '毎図6つまで分ける',
      '毎図10まで分ける',
      '環がふたつ。それぞれ12まで分ける',
      'ふたつの環が、それぞれ18まで分ける',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="10" stroke-opacity="0.55"/><path d="M24 5V11M24 37V43M5 24H11M37 24H43"/></svg>`,
  },
  {
    id: 'kintsugi_slash',
    kanjiTitle: '金線の一閃',
    shortCrest: '金線',
    reading: 'きんせんのいっせん',
    minStageToAppear: 3,
    maxRank: 5,
    rankDescriptions: [
      '飛ぶあいだ、図を叩くと星が一点に集まる（各図1回）',
      '毎手、金線を1回打てる',
      '金線の跡が残り、触れた星を削る',
      '星を8つ継ぐたび、金線が1回戻る',
      '毎手2回。金線が長く、強く残る',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="24" r="14"/><path d="M9 39L24 24M39 9L24 24M11 14L24 24M37 34L24 24"/><circle cx="24" cy="24" r="3" fill="currentColor"/></svg>`,
  },
  {
    id: 'chain_burst',
    kanjiTitle: '新星の波',
    shortCrest: '新星',
    reading: 'しんせいのなみ',
    minStageToAppear: 3,
    maxRank: 5,
    rankDescriptions: [
      '星が割れると、隣へ金の波が1だけ走る',
      '波が2になる',
      '波が4。届く範囲も少し広い',
      '波が6。割れた星から珠が1つ跳ねる',
      '波が9。珠が2つ跳ねる',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="24" cy="24" r="4" fill="#D94136" stroke="#D94136"/><circle cx="24" cy="24" r="11"/><circle cx="24" cy="24" r="18" stroke-dasharray="3 3"/></svg>`,
  },
  {
    id: 'sky_string',
    kanjiTitle: '地平の弦',
    shortCrest: '地平',
    reading: 'ちへいのつる',
    minStageToAppear: 12,
    maxRank: 5,
    rankDescriptions: [
      '地平に金の弦。落ちた星を毎手2つまで返す',
      '毎手4つまで返す',
      '毎手7つまで返す',
      '毎手11まで返す',
      '毎手16まで返す',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="6" y1="34" x2="42" y2="34"/><path d="M16 14L24 33L32 14"/><circle cx="24" cy="14" r="2.5" fill="currentColor"/></svg>`,
  },
  {
    id: 'piercing_gold',
    kanjiTitle: '光年の針',
    shortCrest: '光年',
    reading: 'こうねんのはり',
    minStageToAppear: 12,
    maxRank: 5,
    rankDescriptions: [
      'トドメのとき、珠が1回だけ突き抜ける',
      '2回まで突き抜ける',
      '3回まで。抜けた直後の一撃が＋1',
      '5回まで。抜けた直後が＋2',
      'トドメなら何回でも貫き、列を一気に縫う',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="8" y1="40" x2="40" y2="8"/><polygon points="40,8 30,11 37,18" fill="currentColor"/><rect x="19" y="19" width="10" height="10" transform="rotate(45 24 24)" stroke-opacity="0.6"/></svg>`,
  },
  {
    id: 'gold_lightning',
    kanjiTitle: '流星の鎖',
    shortCrest: '流星',
    reading: 'りゅうせいのくさり',
    minStageToAppear: 24,
    maxRank: 5,
    rankDescriptions: [
      '16回当たるたび、近くの星へ流星（2）',
      '14回ごと。流星が4',
      '12回ごと。流星が2つの星へ跳ねる',
      '10回ごと。6の流星が3つへ',
      '8回ごと。9の流星が4つを焼く',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="27,6 14,25 25,25 21,42 34,21 23,21 27,6"/></svg>`,
  },
  {
    id: 'bounce_split',
    kanjiTitle: '双星の分裂',
    shortCrest: '双星',
    reading: 'そうせいのぶんれつ',
    minStageToAppear: 24,
    maxRank: 5,
    rankDescriptions: [
      '24回跳ねると、空中で一度だけ二つに割れる',
      '20回跳ねると割れる',
      '16回ごとに、最大2回まで割れる',
      '13回ごとに、最大2回まで割れる',
      '10回ごと。上手80以上なら威力＋1',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M24 40V24L12 12M24 24L36 12"/><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="36" cy="12" r="3" fill="currentColor"/></svg>`,
  },
];

export type BossForm = 'ECLIPSE_MONOLITH' | 'SERAPHIC_LOTUS' | 'ARMILLARY_THRONE';

export interface BossArchetype {
  form: BossForm;
  title: string;
  subtitle: string;
  armorCount: number;
}

export const BOSS_ARCHETYPES: BossArchetype[] = [
  {
    form: 'ECLIPSE_MONOLITH',
    title: '欠け月',
    subtitle: 'ひびの入った月',
    armorCount: 6,
  },
  {
    form: 'SERAPHIC_LOTUS',
    title: '蓮車',
    subtitle: '空に残った祭りの山車',
    armorCount: 8,
  },
  {
    form: 'ARMILLARY_THRONE',
    title: '天儀',
    subtitle: '壊れた天球儀',
    armorCount: 8,
  },
];

export type FormationArchetype = 'GEOMETRY' | 'CONSTELLATION' | 'GUARDIAN_BOSS';
export type StageTier = 'normal' | 'mid' | 'grand';

export interface StageBlueprint {
  stage: number;
  title: string;
  latin: string;
  season: import('./constellations').Season;
  lucida: string;
  whisperHint: string | null;
  archetype: FormationArchetype;
  tier: StageTier;
  geometry: GeometryKind | null;
  baseHp: number;
}

export const SEALS_PER_AWAKENING = 3;

/** 2 幾何 + 1 星座。星座のうち中ボス（6）と大ボス（12）は有名な座。 */
export function isConstellationStage(stage: number): boolean {
  return stage > 0 && stage % 3 === 0;
}

export function isMidBossStage(stage: number): boolean {
  return stage > 0 && stage % 6 === 0 && stage % 12 !== 0;
}

export function isGrandBossStage(stage: number): boolean {
  return stage > 0 && stage % 12 === 0;
}

export function isBossStage(stage: number): boolean {
  return isGrandBossStage(stage);
}

export function isAwakeningStage(stage: number): boolean {
  return stage === 3 || isMidBossStage(stage) || isGrandBossStage(stage);
}

export function constellationClearsBefore(stage: number): number {
  return Math.max(0, Math.floor((Math.max(1, stage) - 1) / 3));
}

/** 傷はゆっくり段で上がる。耐久は傷と、その図で想定する珠の数に追従する。 */
export function stagePearlDamage(stage: number): number {
  if (stage <= 4) return 1;
  return 1 + Math.floor((stage - 2) / 3);
}

export function expectedPearlCount(stage: number): number {
  return 6 + constellationClearsBefore(stage);
}

export function stageBaseHp(stage: number): number {
  const dmg = stagePearlDamage(stage);
  const shots = 8 + Math.ceil(stage / 2);
  const volley = expectedPearlCount(stage) / 6;
  return Math.round(dmg * shots * volley);
}

export function getStageBlueprint(stage: number): StageBlueprint {
  const season = plateSeason(stage);
  const raw = stageBaseHp(stage);

  if (isGrandBossStage(stage)) {
    const figure = constellationForStage(stage);
    return {
      stage,
      title: figure.title,
      latin: figure.latin,
      season: figure.season,
      lucida: figure.lucida,
      whisperHint: figure.lore,
      archetype: 'GUARDIAN_BOSS',
      tier: 'grand',
      geometry: null,
      baseHp: Math.round(raw * 1.5),
    };
  }

  if (isConstellationStage(stage)) {
    const figure = constellationForStage(stage);
    const mid = isMidBossStage(stage);
    return {
      stage,
      title: figure.title,
      latin: figure.latin,
      season: figure.season,
      lucida: figure.lucida,
      whisperHint: figure.lore,
      archetype: 'CONSTELLATION',
      tier: mid ? 'mid' : 'normal',
      geometry: null,
      baseHp: Math.round(raw * (mid ? 1.22 : 1.12)),
    };
  }

  const kind = geometryKindForStage(stage);
  const plate = GEOMETRY_PLATES[kind];
  return {
    stage,
    title: plate.title,
    latin: plate.latin,
    season,
    lucida: '',
    whisperHint: plate.lore,
    archetype: 'GEOMETRY',
    tier: 'normal',
    geometry: kind,
    baseHp: raw,
  };
}

export function formatStageLabel(stage: number): string {
  return stageCaption(stage);
}

export interface LedgerEntry {
  stage: number;
  title: string;
  latin: string;
  chain: number;
  pearls: number;
  isBoss: boolean;
  at: number;
}

export interface KintsugiRecord {
  highestStage: number;
  highestCleared: number;
  longestResonance: number;
  soundOn: boolean;
  totalClears: number;
  runsPlayed: number;
  theme: VisualTheme;
  bestChainByStage: Record<string, number>;
  ledger: LedgerEntry[];
  peakClearPearls: number;
  peakOrbPearls: number;
}

export interface RunSnapshot {
  stage: number;
  integrity: number;
  maxIntegrity: number;
  ranks: Record<AbilityId, number>;
  collectedOrbPearls: number;
  stageClearBonusPearls: number;
  awakeningSeals: number;
  longestChainInRun: number;
  cradleX: number;
}

export interface StageClearInfo {
  stage: number;
  title: string;
  latin: string;
  lucida: string;
  season: string;
  isBoss: boolean;
  pearlCount: number;
  chain: number;
  longestChain: number;
  pearlDamage: number;
  nextPearlDamage: number;
}

const STORAGE_KEY = 'hoshitsugi_kintsugi_record_v5';
const RUN_KEY = 'hoshitsugi_kintsugi_run_v1';
const LEDGER_CAP = 24;

export function emptyRanks(): Record<AbilityId, number> {
  return {
    pearl_surge: 0,
    twin_ring: 0,
    kintsugi_slash: 0,
    chain_burst: 0,
    sky_string: 0,
    piercing_gold: 0,
    gold_lightning: 0,
    bounce_split: 0,
  };
}

export function emptyRecord(): KintsugiRecord {
  return {
    highestStage: 1,
    highestCleared: 0,
    longestResonance: 0,
    soundOn: true,
    totalClears: 0,
    runsPlayed: 0,
    theme: 'atlas',
    bestChainByStage: {},
    ledger: [],
    peakClearPearls: 0,
    peakOrbPearls: 0,
  };
}

export function loadRecord(): KintsugiRecord {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem('hoshitsugi_kintsugi_record_v4') ??
      localStorage.getItem('hoshitsugi_kintsugi_record_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        highestStage: parsed.highestStage ?? 1,
        highestCleared: parsed.highestCleared ?? Math.max(0, (parsed.highestStage ?? 1) - 1),
        longestResonance: parsed.longestResonance ?? 0,
        soundOn: parsed.soundOn ?? true,
        totalClears: parsed.totalClears ?? 0,
        runsPlayed: parsed.runsPlayed ?? 0,
        theme: 'atlas',
        bestChainByStage: parsed.bestChainByStage ?? {},
        ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
        peakClearPearls: parsed.peakClearPearls ?? 0,
        peakOrbPearls: parsed.peakOrbPearls ?? 0,
      };
    }
  } catch {
    // ignore
  }
  return emptyRecord();
}

export function noteClear(rec: KintsugiRecord, info: StageClearInfo): {
  newNight: boolean;
  newChain: boolean;
  newFigure: boolean;
  rank: number;
  total: number;
  figureBest: number;
} {
  const newNight = info.stage > rec.highestCleared;
  const newChain = info.chain > rec.longestResonance;
  const key = String(info.stage);
  const prevFigure = rec.bestChainByStage[key] ?? 0;
  const newFigure = info.chain > prevFigure;

  if (info.stage > rec.highestCleared) rec.highestCleared = info.stage;
  if (info.stage > rec.highestStage) rec.highestStage = info.stage;
  if (info.longestChain > rec.longestResonance) rec.longestResonance = info.longestChain;
  if (info.chain > rec.longestResonance) rec.longestResonance = info.chain;
  if (newFigure) rec.bestChainByStage[key] = info.chain;
  rec.totalClears += 1;

  rec.ledger.unshift({
    stage: info.stage,
    title: info.title,
    latin: info.latin,
    chain: info.chain,
    pearls: info.pearlCount,
    isBoss: info.isBoss,
    at: Date.now(),
  });
  if (rec.ledger.length > LEDGER_CAP) rec.ledger.length = LEDGER_CAP;

  const better = rec.ledger.filter((e) => e.chain > info.chain).length;
  return {
    newNight,
    newChain,
    newFigure,
    rank: better + 1,
    total: rec.ledger.length,
    figureBest: rec.bestChainByStage[key] ?? info.chain,
  };
}

export function saveRecord(rec: KintsugiRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // ignore
  }
}

export function loadRun(): RunSnapshot | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.stage) return null;
    return {
      stage: parsed.stage,
      integrity: parsed.integrity ?? 3,
      maxIntegrity: parsed.maxIntegrity ?? 3,
      ranks: { ...emptyRanks(), ...(parsed.ranks ?? {}) },
      collectedOrbPearls: parsed.collectedOrbPearls ?? 0,
      stageClearBonusPearls: parsed.stageClearBonusPearls ?? 0,
      awakeningSeals: parsed.awakeningSeals ?? 0,
      longestChainInRun: parsed.longestChainInRun ?? 0,
      cradleX: parsed.cradleX ?? 195,
    };
  } catch {
    return null;
  }
}

export function saveRun(snap: RunSnapshot): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(snap));
  } catch {
    // ignore
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    // ignore
  }
}

export function isNightUnlocked(night: number, rec: KintsugiRecord): boolean {
  return night === 1 || night <= rec.highestCleared + 1;
}

export function nightSelectCount(rec: KintsugiRecord): number {
  const reached = Math.max(rec.highestCleared, rec.highestStage, 1);
  const plate = Math.ceil((reached + 6) / 12) * 12;
  return Math.min(CAMPAIGN_LENGTH, Math.max(12, plate));
}
