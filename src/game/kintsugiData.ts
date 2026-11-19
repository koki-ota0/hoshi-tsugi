// 星継 — 夜の金継ぎ屋。落ちた星を、金で縫う。

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
    kanjiTitle: '連珠の契',
    shortCrest: '連珠',
    reading: 'れんじゅのちぎり',
    minStageToAppear: 3,
    maxRank: 5,
    rankDescriptions: [
      '一度に出す珠が、ふたつ増える',
      'さらにふたつ増える（いま＋4）',
      'さらにみっつ増える（いま＋7）',
      'さらにみっつ増える（いま＋10）',
      'さらによっつ増える（いま＋14）',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="15" cy="28" r="4.5"/><circle cx="24" cy="20" r="4.5"/><circle cx="33" cy="12" r="4.5" fill="currentColor" fill-opacity="0.25"/><path d="M10 38L36 10" stroke-dasharray="3 3"/></svg>`,
  },
  {
    id: 'twin_ring',
    kanjiTitle: '星輪の紋',
    shortCrest: '星輪',
    reading: 'せいりんのもん',
    minStageToAppear: 3,
    maxRank: 5,
    rankDescriptions: [
      '金の輪が出る。通った珠を、毎ターン3個まで分ける',
      '毎ターン6個まで分ける',
      '毎ターン10個まで分ける',
      '輪がふたつ。それぞれ12個まで分ける',
      'ふたつの輪が、それぞれ18個まで分ける',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="10" stroke-opacity="0.55"/><path d="M24 5V11M24 37V43M5 24H11M37 24H43"/></svg>`,
  },
  {
    id: 'kintsugi_slash',
    kanjiTitle: '金継ぎの一閃',
    shortCrest: '一閃',
    reading: 'きんつぎのいっせん',
    minStageToAppear: 3,
    maxRank: 5,
    rankDescriptions: [
      '飛ぶあいだ、画面を叩くと珠が一点に集まる（各夜1回）',
      '毎ターン、一閃を1回打てる',
      '一閃の跡に金の線が残り、触れた器を削る',
      '器を8つ割るたび、一閃が1回戻る',
      '毎ターン2回。金の線が長く、強く残る',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="24" cy="24" r="14"/><path d="M9 39L24 24M39 9L24 24M11 14L24 24M37 34L24 24"/><circle cx="24" cy="24" r="3" fill="currentColor"/></svg>`,
  },
  {
    id: 'chain_burst',
    kanjiTitle: '連鎖の火花',
    shortCrest: '火花',
    reading: 'れんさのひばな',
    minStageToAppear: 3,
    maxRank: 5,
    rankDescriptions: [
      '器が割れると、隣へ金の波が1だけ走る',
      '波が2になる',
      '波が4。届く範囲も少し広い',
      '波が6。割れた器から珠が1つ跳ねる',
      '波が9。珠が2つ跳ねる',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="24" cy="24" r="4" fill="#D94136" stroke="#D94136"/><circle cx="24" cy="24" r="11"/><circle cx="24" cy="24" r="18" stroke-dasharray="3 3"/></svg>`,
  },
  {
    id: 'sky_string',
    kanjiTitle: '天球の弦',
    shortCrest: '天弦',
    reading: 'てんきゅうのつる',
    minStageToAppear: 5,
    maxRank: 5,
    rankDescriptions: [
      '店の敷居に金の弦。落ちた珠を毎ターン2つまで返す',
      '毎ターン4つまで返す',
      '毎ターン7つまで返す',
      '毎ターン11つまで返す',
      '毎ターン16つまで返す',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="6" y1="34" x2="42" y2="34"/><path d="M16 14L24 33L32 14"/><circle cx="24" cy="14" r="2.5" fill="currentColor"/></svg>`,
  },
  {
    id: 'piercing_gold',
    kanjiTitle: '貫通の金針',
    shortCrest: '貫通',
    reading: 'かんつうのきんしん',
    minStageToAppear: 5,
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
    kanjiTitle: '雷光の鎖',
    shortCrest: '雷光',
    reading: 'らいこうのくさり',
    minStageToAppear: 8,
    maxRank: 5,
    rankDescriptions: [
      '16回当たるたび、近くの器へ金の稲妻（2）',
      '14回ごと。稲妻が4',
      '12回ごと。稲妻が2つの器へ跳ねる',
      '10回ごと。6の稲妻が3つへ',
      '8回ごと。9の稲妻が4つを焼く',
    ],
    sigilSvg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="27,6 14,25 25,25 21,42 34,21 23,21 27,6"/></svg>`,
  },
  {
    id: 'bounce_split',
    kanjiTitle: '分裂の煌めき',
    shortCrest: '分裂',
    reading: 'ぶんれつのきらめき',
    minStageToAppear: 8,
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

export type FormationArchetype =
  | 'TUTORIAL_GATE'
  | 'TWIN_WINGS'
  | 'STEPPED_SHRINE'
  | 'VERMILION_CLUSTER'
  | 'GUARDIAN_BOSS'
  | 'FESTIVAL_SHOWER'
  | 'ARMORED_BASTION'
  | 'CLOCKWORK_ORBIT';

export interface StageBlueprint {
  stage: number;
  title: string;
  whisperHint: string | null;
  archetype: FormationArchetype;
  baseHp: number;
}

export const SEALS_PER_AWAKENING = 3;

/**
 * Does clearing `stage` trigger an Ability Awakening?
 * - Normal stages grant +1 Seal; every 3 Seals (Stage 3, 8, 13, 18...) triggers Awakening!
 * - Boss stages (Stage 5, 10, 15, 20...) ALWAYS trigger an immediate Awakening upon victory!
 */
export function isBossStage(stage: number): boolean {
  return stage % 5 === 0;
}

export function getStageBlueprint(stage: number): StageBlueprint {
  // Smooth, gradual HP curve calibrated for starting at 6 pearls (+1~2 per stage) and incremental upgrades!
  const baseHp =
    stage === 1
      ? 4
      : stage === 2
      ? 6
      : stage === 3
      ? 8
      : stage === 4
      ? 11
      : Math.round(11 + (stage - 4) * 3.8 + Math.pow(Math.max(0, stage - 4), 1.32) * 1.45);

  if (stage === 1) {
    return {
      stage,
      title: '門前',
      whisperHint: '隙間を狙って、天井で返す',
      archetype: 'TUTORIAL_GATE',
      baseHp,
    };
  }
  if (stage === 2) {
    return {
      stage,
      title: '鳥居',
      whisperHint: '光る珠に触れると、持ち珠が増える',
      archetype: 'TWIN_WINGS',
      baseHp,
    };
  }
  if (stage === 3) {
    return {
      stage,
      title: '石段',
      whisperHint: 'ここを継げば、技がひとつ増える',
      archetype: 'STEPPED_SHRINE',
      baseHp,
    };
  }
  if (stage === 4) {
    return {
      stage,
      title: '朱蔵',
      whisperHint: '赤い器は、割ると周りも巻き込む',
      archetype: 'VERMILION_CLUSTER',
      baseHp,
    };
  }
  if (isBossStage(stage)) {
    const idx = Math.floor(stage / 5 - 1) % BOSS_ARCHETYPES.length;
    return {
      stage,
      title: BOSS_ARCHETYPES[idx].title,
      whisperHint: '降りる前に、まん中の核を割る',
      archetype: 'GUARDIAN_BOSS',
      baseHp,
    };
  }

  const cycle = (stage - 6) % 4;
  if (cycle === 0) {
    return {
      stage,
      title: '金砂',
      whisperHint: stage === 6 ? 'もろい星は、連鎖で一気に' : null,
      archetype: 'FESTIVAL_SHOWER',
      baseHp: Math.max(6, Math.round(baseHp * 0.52)),
    };
  }
  if (cycle === 1) {
    return {
      stage,
      title: '砦',
      whisperHint: stage === 7 ? '硬い器は、壁で裏へ回る' : null,
      archetype: 'ARMORED_BASTION',
      baseHp,
    };
  }
  if (cycle === 2) {
    return {
      stage,
      title: '回廊',
      whisperHint: stage === 8 ? '動く隙間を見て、放つ' : null,
      archetype: 'CLOCKWORK_ORBIT',
      baseHp: Math.round(baseHp * 0.92),
    };
  }
  return {
    stage,
    title: '朱迷宮',
    whisperHint: null,
    archetype: 'VERMILION_CLUSTER',
    baseHp,
  };
}

export function formatStageLabel(stage: number): string {
  return `夜${stage}`;
}

export interface KintsugiRecord {
  highestStage: number;
  longestResonance: number;
  soundOn: boolean;
}

const STORAGE_KEY = 'hoshitsugi_kintsugi_record_v3';

export function loadRecord(): KintsugiRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        highestStage: parsed.highestStage ?? 1,
        longestResonance: parsed.longestResonance ?? 0,
        soundOn: parsed.soundOn ?? true,
      };
    }
  } catch {
    // ignore
  }
  return { highestStage: 1, longestResonance: 0, soundOn: true };
}

export function saveRecord(rec: KintsugiRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // ignore
  }
}
