// Gradual Progression, Incremental 5-Rank Abilities & Celestial Karakuri Bosses for 『星継 — HOSHITSUGI』

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
      '一度に放たれる金珠が ＋2珠 増える',
      '一度に放たれる金珠がさらに ＋2珠 増える（計＋4）',
      '一度に放たれる金珠がさらに ＋3珠 増える（計＋7）',
      '一度に放たれる金珠がさらに ＋3珠 増える（計＋10）',
      '一度に放たれる金珠がさらに ＋4珠 増える（計＋14）',
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
      '盤上に金の輪が出現し、毎ターン 3珠 まで通った金珠を分裂させる',
      '金の輪の力が強まり、毎ターン 6珠 まで金珠を分裂させる',
      '金の輪が拡張され、毎ターン 10珠 まで金珠を分裂させる',
      '盤上に 二つ目の金の輪 が出現し、それぞれ 12珠 まで分裂させる',
      'ふたつの金の輪が極まり、それぞれ 18珠 まで金珠を分裂させる',
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
      '【操作解禁】各ステージ1回、飛行中タップで全金珠を一点へ収束させる',
      '毎ターン1回『一閃』を放てるようになる',
      '一閃の軌跡に少しのあいだ金の刃が残り、触れる器を削る',
      '器を8つ砕くたびに、飛行中でも『一閃』が1回回復する',
      '毎ターン2回放てるようになり、金の刃の持続と威力が強化される',
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
      '器を砕いたとき、隣接する器へ 1ダメージ の金の波紋を広げる',
      '器破壊時の金の波紋が 2ダメージ に強化される',
      '波紋が 4ダメージ になり、影響範囲も少し広がる',
      '波紋が 6ダメージ になり、砕けた器から余韻の金珠が1つ飛び出す',
      '波紋が 9ダメージ になり、砕けた器から余韻の金珠が2つ飛び出す',
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
      '底に金の弦を張り、毎ターン 2珠 まで落ちた金珠を空へ弾き返す',
      '底の金の弦が毎ターン 4珠 まで金珠を空へ弾き返す',
      '底の金の弦が毎ターン 7珠 まで金珠を空へ弾き返す',
      '底の金の弦が毎ターン 11珠 まで金珠を空へ弾き返す',
      '底の金の弦が毎ターン 16珠 まで金珠を空へ弾き返す',
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
      '各金珠が1回だけ、器にトドメを刺した瞬間に跳ね返らず貫通する',
      '各金珠が 2回 までトドメ時に貫通できるようになる',
      '各金珠が 3回 まで貫通し、貫通直後の1ヒットが＋1ダメージ',
      '各金珠が 5回 まで貫通し、貫通直後の1ヒットが＋2ダメージ',
      'トドメ時は回数制限なく貫通し続け、列を一気に射抜く',
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
      '金珠が 16回 当たるたび、近くの器1つへ金の稲妻（2ダメージ）が走る',
      '14回 当たるたびに発動し、稲妻の威力が 4ダメージ に増す',
      '12回 当たるたびに発動し、稲妻が 2つの器 へ連鎖する',
      '10回 当たるたびに発動し、稲妻（6ダメージ）が 3つの器 へ連鎖する',
      '8回 当たるたびに発動し、稲妻（9ダメージ）が 4つの器 を焼き貫く',
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
      '金珠が 24回 跳ねると、1度だけ空中で2つに分裂する',
      '金珠が 20回 跳ねると分裂するようになる',
      '金珠が 16回 跳ねるごとに最大2回まで自己分裂する',
      '金珠が 13回 跳ねるごとに最大2回まで自己分裂する',
      '金珠が 10回 跳ねるごとに分裂し、80共鳴以上で威力＋1',
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
    title: '蝕天の機巧',
    subtitle: '黄金の六翼と護盾を纏う日蝕核',
    armorCount: 6,
  },
  {
    form: 'SERAPHIC_LOTUS',
    title: '八葉の機神',
    subtitle: '開閉する白磁の剣弁と金剛核',
    armorCount: 8,
  },
  {
    form: 'ARMILLARY_THRONE',
    title: '虚空の天球座',
    subtitle: '三次元に交差する黄金の審判輪',
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
      title: '白磁の門',
      whisperHint: '門の隙間を狙い、奥の天井で跳ね返らせよ',
      archetype: 'TUTORIAL_GATE',
      baseHp,
    };
  }
  if (stage === 2) {
    return {
      stage,
      title: '双翼の回廊',
      whisperHint: '輝く「＋1珠」に触れると、持ち珠が永続で増える',
      archetype: 'TWIN_WINGS',
      baseHp,
    };
  }
  if (stage === 3) {
    return {
      stage,
      title: '三段の石階',
      whisperHint: 'この幕を浄化すれば、最初の「能力」が覚醒する',
      archetype: 'STEPPED_SHRINE',
      baseHp,
    };
  }
  if (stage === 4) {
    return {
      stage,
      title: '朱核の胎動',
      whisperHint: '赤い「朱核」を砕けば、周囲の器を巻き込んで爆ぜる',
      archetype: 'VERMILION_CLUSTER',
      baseHp,
    };
  }
  if (isBossStage(stage)) {
    const idx = Math.floor(stage / 5 - 1) % BOSS_ARCHETYPES.length;
    return {
      stage,
      title: BOSS_ARCHETYPES[idx].title,
      whisperHint: '毎ターン降下する機神——結界へ届く前に真核を射抜け',
      archetype: 'GUARDIAN_BOSS',
      baseHp,
    };
  }

  const cycle = (stage - 6) % 4;
  if (cycle === 0) {
    return {
      stage,
      title: '金砂の回廊',
      whisperHint: stage === 6 ? '脆き星々の群れ——連鎖で一気に砕け' : null,
      archetype: 'FESTIVAL_SHOWER',
      baseHp: Math.max(6, Math.round(baseHp * 0.52)),
    };
  }
  if (cycle === 1) {
    return {
      stage,
      title: '金縁の要塞',
      whisperHint: stage === 7 ? '硬き「重器」は左右の壁反射で裏へ回り込め' : null,
      archetype: 'ARMORED_BASTION',
      baseHp,
    };
  }
  if (cycle === 2) {
    return {
      stage,
      title: '巡る天球儀',
      whisperHint: stage === 8 ? '静かに巡る器の隙間を見極めて放て' : null,
      archetype: 'CLOCKWORK_ORBIT',
      baseHp: Math.round(baseHp * 0.92),
    };
  }
  return {
    stage,
    title: '朱印の迷宮',
    whisperHint: null,
    archetype: 'VERMILION_CLUSTER',
    baseHp,
  };
}

export function formatStageLabel(stage: number): string {
  return `STAGE ${stage}`;
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
