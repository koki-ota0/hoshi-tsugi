export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export interface StarSpec {
  x: number;
  y: number;
  vermilion?: boolean;
  armored?: boolean;
  drift?: number;
  indestructible?: boolean;
}

export interface ConstellationDef {
  id: string;
  title: string;
  latin: string;
  genitive: string;
  season: Season;
  lore: string;
  lucida: string;
  stars: StarSpec[];
  edges: Array<[number, number]>;
  field?: StarSpec[];
}

export type GeometryKind =
  | 'gate'
  | 'wings'
  | 'steps'
  | 'cluster'
  | 'shower'
  | 'bastion'
  | 'orbit'
  | 'triangle'
  | 'hex'
  | 'diamond'
  | 'wedge'
  | 'spiral'
  | 'columns'
  | 'checker'
  | 'ring'
  | 'cross';

export const SEASON_PLATE: Record<Season, { jp: string; la: string }> = {
  winter: { jp: '冬の図', la: 'TABULA HIEMALIS' },
  spring: { jp: '春の図', la: 'TABULA VERNALIS' },
  summer: { jp: '夏の図', la: 'TABULA AESTIVA' },
  autumn: { jp: '秋の図', la: 'TABULA AUTUMNALIS' },
};

export const GEOMETRY_PLATES: Record<GeometryKind, { title: string; latin: string; lore: string }> = {
  gate: { title: '門列', latin: 'PORTA', lore: '隙間を狙って、天井で返す' },
  wings: { title: '双翼', latin: 'ALAE', lore: '左右の翼を、交互に削る' },
  steps: { title: '段丘', latin: 'GRADUS', lore: '下段から、段を登るように' },
  cluster: { title: '朱叢', latin: 'SPINA', lore: '朱の星は、割ると隣へ火が走る' },
  shower: { title: '金雨', latin: 'IMBER', lore: 'もろい星は、連鎖で一気に' },
  bastion: { title: '砦', latin: 'ARX', lore: '硬い星は、壁で裏へ回る' },
  orbit: { title: '回廊', latin: 'AMBITUS', lore: '動く隙間を見て、放つ' },
  triangle: { title: '三角', latin: 'TRIANGLA', lore: '頂点の硬い星を、最後に' },
  hex: { title: '六花', latin: 'HEXAGONUM', lore: '芯を残して、外輪を先に' },
  diamond: { title: '菱', latin: 'RHOMBUS', lore: '長い対角線に、糸を通せ' },
  wedge: { title: '楔', latin: 'CUNEUS', lore: '尖端から、幅を広げて割る' },
  spiral: { title: '渦', latin: 'VORTEX', lore: '外から巻いて、核へ' },
  columns: { title: '双列', latin: 'COLUMNAE', lore: '一列を貫き、もう一列へ返す' },
  checker: { title: '市松', latin: 'TESSERA', lore: '朱と白を、跳び石に' },
  ring: { title: '環', latin: 'ANNULUS', lore: '輪の隙間から、内側へ' },
  cross: { title: '十字', latin: 'CRUX GEOM.', lore: '交差を先に、腕を落とす' },
};

export const GEOMETRY_CYCLE: GeometryKind[] = [
  'gate',
  'wings',
  'steps',
  'cluster',
  'shower',
  'bastion',
  'orbit',
  'triangle',
  'hex',
  'diamond',
  'wedge',
  'spiral',
  'columns',
  'checker',
  'ring',
  'cross',
];

export interface MagnitudeGrade {
  jp: string;
  la: string;
  mag: number;
}

/** 珠の数に対する倍率。六等は2倍から、超新星は15倍。零等は織女の明るさ。 */
export function magnitudeMilestones(pearlCount: number): number[] {
  const n = Math.max(1, pearlCount);
  return [
    Math.ceil(n * 2),
    Math.ceil(n * 4),
    Math.ceil(n * 6),
    Math.ceil(n * 8),
    Math.ceil(n * 10),
    Math.ceil(n * 12),
    Math.ceil(n * 13.5),
    n * 15,
  ];
}

export function magnitudeOf(chain: number, pearlCount = 6): MagnitudeGrade {
  const [vi, v, iv, iii, ii, i, zero, nova] = magnitudeMilestones(pearlCount);
  if (chain >= nova) return { jp: '超新星', la: 'SUPERNOVA', mag: -4 };
  if (chain >= zero) return { jp: '零等星', la: 'MAGNITUDO 0', mag: 0 };
  if (chain >= i) return { jp: '一等星', la: 'MAGNITUDO I', mag: 1 };
  if (chain >= ii) return { jp: '二等星', la: 'MAGNITUDO II', mag: 2 };
  if (chain >= iii) return { jp: '三等星', la: 'MAGNITUDO III', mag: 3 };
  if (chain >= iv) return { jp: '四等星', la: 'MAGNITUDO IV', mag: 4 };
  if (chain >= v) return { jp: '五等星', la: 'MAGNITUDO V', mag: 5 };
  if (chain >= vi) return { jp: '六等星', la: 'MAGNITUDO VI', mag: 6 };
  return { jp: '微光', la: 'NEBULA', mag: 7 };
}

interface Recipe {
  k: string;
  n?: number;
  stars?: StarSpec[];
  edges?: Array<[number, number]>;
  field?: StarSpec[];
}

function sparseField(): StarSpec[] {
  /** 星座の内側には置かない。縁の障害だけ。 */
  return [
    { x: 0.07, y: 0.1, armored: true, indestructible: true },
    { x: 0.93, y: 0.1, armored: true, indestructible: true },
    { x: 0.06, y: 0.38, drift: 18 },
    { x: 0.94, y: 0.38, drift: -18 },
    { x: 0.05, y: 0.62, armored: true },
    { x: 0.95, y: 0.62 },
    { x: 0.18, y: 0.9, vermilion: true },
    { x: 0.5, y: 0.92 },
    { x: 0.82, y: 0.9, vermilion: true },
    { x: 0.07, y: 0.88, armored: true, indestructible: true },
    { x: 0.93, y: 0.88, armored: true, indestructible: true },
  ];
}

function bake(r: Recipe): { stars: StarSpec[]; edges: Array<[number, number]>; field?: StarSpec[] } {
  if (r.k === 'custom') {
    return { stars: r.stars ?? [], edges: r.edges ?? [], field: r.field };
  }
  if (r.k === 'w') {
    const stars: StarSpec[] = [
      { x: 0.1, y: 0.3 },
      { x: 0.3, y: 0.58 },
      { x: 0.5, y: 0.26, armored: true },
      { x: 0.7, y: 0.6 },
      { x: 0.9, y: 0.28 },
    ];
    return { stars, edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ] };
  }
  if (r.k === 'dipper') {
    return {
      stars: [
        { x: 0.1, y: 0.62 },
        { x: 0.28, y: 0.52 },
        { x: 0.46, y: 0.48, armored: true },
        { x: 0.62, y: 0.5 },
        { x: 0.76, y: 0.38 },
        { x: 0.9, y: 0.28 },
        { x: 0.68, y: 0.16 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 3],
      ],
    };
  }
  if (r.k === 'cross') {
    return {
      stars: [
        { x: 0.5, y: 0.14, armored: true },
        { x: 0.5, y: 0.4 },
        { x: 0.5, y: 0.64 },
        { x: 0.5, y: 0.84 },
        { x: 0.16, y: 0.42 },
        { x: 0.84, y: 0.42 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [4, 1],
        [1, 5],
      ],
    };
  }
  if (r.k === 'line') {
    const n = r.n ?? 4;
    const stars: StarSpec[] = [];
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: 0.12 + (0.76 * i) / Math.max(1, n - 1),
        y: 0.28 + (i % 2) * 0.22,
        armored: i === Math.floor(n / 2),
      });
      if (i) edges.push([i - 1, i]);
    }
    return { stars, edges, field: n <= 4 ? sparseField() : undefined };
  }
  if (r.k === 'hook') {
    return {
      stars: [
        { x: 0.22, y: 0.18 },
        { x: 0.38, y: 0.22 },
        { x: 0.5, y: 0.36, armored: true, vermilion: true },
        { x: 0.58, y: 0.5 },
        { x: 0.62, y: 0.64 },
        { x: 0.5, y: 0.78 },
        { x: 0.34, y: 0.82 },
        { x: 0.78, y: 0.28 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [2, 7],
      ],
    };
  }
  if (r.k === 'poly') {
    const n = r.n ?? 5;
    const stars: StarSpec[] = [];
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      stars.push({
        x: 0.5 + Math.cos(a) * 0.36,
        y: 0.48 + Math.sin(a) * 0.34,
        armored: i === 0,
      });
      edges.push([i, (i + 1) % n]);
    }
    return { stars, edges, field: n <= 4 ? sparseField() : undefined };
  }
  if (r.k === 'cluster') {
    const n = r.n ?? 6;
    const stars: StarSpec[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = i === 0 ? 0 : 0.16 + (i % 3) * 0.06;
      stars.push({
        x: 0.5 + Math.cos(a) * rad,
        y: 0.46 + Math.sin(a) * rad,
        armored: i === 0,
        vermilion: i === 3 || i === 6,
      });
    }
    const edges: Array<[number, number]> = [];
    for (let i = 1; i < n; i++) edges.push([0, i]);
    return { stars, edges };
  }
  if (r.k === 'arc') {
    const n = r.n ?? 5;
    const stars: StarSpec[] = [];
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(1, n - 1);
      stars.push({
        x: 0.12 + t * 0.76,
        y: 0.62 - Math.sin(t * Math.PI) * 0.36,
        armored: i === Math.floor(n / 2),
      });
      if (i) edges.push([i - 1, i]);
    }
    return { stars, edges };
  }
  if (r.k === 'lambda') {
    return {
      stars: [
        { x: 0.5, y: 0.18, armored: true },
        { x: 0.5, y: 0.48 },
        { x: 0.28, y: 0.78 },
        { x: 0.72, y: 0.78 },
        { x: 0.5, y: 0.78 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [1, 3],
        [1, 4],
      ],
    };
  }
  if (r.k === 'house') {
    return {
      stars: [
        { x: 0.5, y: 0.16, armored: true },
        { x: 0.22, y: 0.42 },
        { x: 0.78, y: 0.42 },
        { x: 0.22, y: 0.78 },
        { x: 0.78, y: 0.78 },
      ],
      edges: [
        [0, 1],
        [0, 2],
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 4],
      ],
    };
  }
  if (r.k === 'snake') {
    const n = r.n ?? 7;
    const stars: StarSpec[] = [];
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(1, n - 1);
      stars.push({
        x: 0.08 + t * 0.84,
        y: 0.28 + Math.sin(t * Math.PI * 2.2) * 0.28,
        armored: i === Math.floor(n * 0.35),
        drift: 22,
      });
      if (i) edges.push([i - 1, i]);
    }
    return { stars, edges };
  }
  if (r.k === 'pair') {
    return {
      stars: [
        { x: 0.32, y: 0.16, drift: 16, armored: true },
        { x: 0.32, y: 0.4, drift: 16 },
        { x: 0.32, y: 0.64, drift: 16 },
        { x: 0.32, y: 0.84, drift: 16 },
        { x: 0.68, y: 0.16, drift: -16, armored: true },
        { x: 0.68, y: 0.4, drift: -16 },
        { x: 0.68, y: 0.64, drift: -16 },
        { x: 0.68, y: 0.84, drift: -16 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [4, 5],
        [5, 6],
        [6, 7],
        [1, 5],
      ],
    };
  }
  if (r.k === 'kite') {
    return {
      stars: [
        { x: 0.5, y: 0.16, armored: true },
        { x: 0.22, y: 0.46 },
        { x: 0.78, y: 0.46 },
        { x: 0.5, y: 0.62 },
        { x: 0.5, y: 0.86 },
      ],
      edges: [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
        [3, 4],
      ],
    };
  }
  return {
    stars: [
      { x: 0.5, y: 0.2, armored: true },
      { x: 0.5, y: 0.48 },
      { x: 0.22, y: 0.78 },
      { x: 0.78, y: 0.78 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
    ],
  };
}

interface CatalogRow {
  id: string;
  title: string;
  latin: string;
  genitive: string;
  season: Season;
  lore: string;
  lucida: string;
  recipe: Recipe;
}

const CATALOG: CatalogRow[] = [
  {
    id: 'orion',
    title: 'オリオン',
    latin: 'ORION',
    genitive: 'Orionis',
    season: 'winter',
    lore: '冬の狩人。核を割る前に、鎧の星を欠け',
    lucida: 'Rigel',
    recipe: {
      k: 'custom',
      stars: [
        { x: 0.22, y: 0.16 },
        { x: 0.78, y: 0.2 },
        { x: 0.38, y: 0.44 },
        { x: 0.5, y: 0.48, armored: true },
        { x: 0.62, y: 0.52 },
        { x: 0.24, y: 0.78 },
        { x: 0.8, y: 0.74 },
      ],
      edges: [
        [0, 2],
        [1, 4],
        [2, 3],
        [3, 4],
        [2, 5],
        [4, 6],
        [0, 1],
      ],
    },
  },
  {
    id: 'ursa-major',
    title: '北斗',
    latin: 'URSA MAJOR',
    genitive: 'Ursae Majoris',
    season: 'spring',
    lore: '北を指す七つの星。柄から斗へ縫え',
    lucida: 'Alioth',
    recipe: { k: 'dipper' },
  },
  {
    id: 'scorpius',
    title: '蠍',
    latin: 'SCORPIUS',
    genitive: 'Scorpii',
    season: 'summer',
    lore: 'アンタレスを核に、毒針が地平へ伸びる',
    lucida: 'Antares',
    recipe: { k: 'hook' },
  },
  {
    id: 'cygnus',
    title: '白鳥',
    latin: 'CYGNUS',
    genitive: 'Cygni',
    season: 'summer',
    lore: '北十字。翼をひらき、天の川を渡る',
    lucida: 'Deneb',
    recipe: { k: 'cross' },
  },
  {
    id: 'cassiopeia',
    title: 'カシオペヤ',
    latin: 'CASSIOPEIA',
    genitive: 'Cassiopeiae',
    season: 'autumn',
    lore: '玉座のW。折れ線の角を返せ',
    lucida: 'Schedar',
    recipe: { k: 'w' },
  },
  {
    id: 'leo',
    title: '獅子',
    latin: 'LEO',
    genitive: 'Leonis',
    season: 'spring',
    lore: '鉤のたてがみ。頭を残して胴を縫え',
    lucida: 'Regulus',
    recipe: { k: 'hook' },
  },
  {
    id: 'taurus',
    title: '牡牛',
    latin: 'TAURUS',
    genitive: 'Tauri',
    season: 'winter',
    lore: 'アルデバランが目。角を両側へ',
    lucida: 'Aldebaran',
    recipe: { k: 'lambda' },
  },
  {
    id: 'crux',
    title: '南十字',
    latin: 'CRUX',
    genitive: 'Crucis',
    season: 'spring',
    lore: '南の四星。短い腕を先に落とす',
    lucida: 'Acrux',
    recipe: { k: 'cross' },
  },
  {
    id: 'gemini',
    title: '双子',
    latin: 'GEMINI',
    genitive: 'Geminorum',
    season: 'winter',
    lore: 'カストルとポルックス。対の列がすれ違う',
    lucida: 'Pollux',
    recipe: { k: 'pair' },
  },
  {
    id: 'sagittarius',
    title: '射手',
    latin: 'SAGITTARIUS',
    genitive: 'Sagittarii',
    season: 'summer',
    lore: '南の急須。注ぎ口から銀河の中心へ',
    lucida: 'Kaus Australis',
    recipe: { k: 'teapot' as Recipe['k'] } as Recipe,
  },
  {
    id: 'andromeda',
    title: 'アンドロメダ',
    latin: 'ANDROMEDA',
    genitive: 'Andromedae',
    season: 'autumn',
    lore: '鎖に繋がれた王女。線を端まで伸ばせ',
    lucida: 'Alpheratz',
    recipe: { k: 'line', n: 6 },
  },
  {
    id: 'draco',
    title: '竜',
    latin: 'DRACO',
    genitive: 'Draconis',
    season: 'summer',
    lore: '北極を巻く竜。頭を欠けば胴はほどける',
    lucida: 'Eltanin',
    recipe: { k: 'snake', n: 8 },
  },
  {
    id: 'lyra',
    title: '琴',
    latin: 'LYRA',
    genitive: 'Lyrae',
    season: 'summer',
    lore: '織女の琴。ベガを核に四辺を張る',
    lucida: 'Vega',
    recipe: { k: 'poly', n: 5 },
  },
  {
    id: 'pegasus',
    title: 'ペガスス',
    latin: 'PEGASUS',
    genitive: 'Pegasi',
    season: 'autumn',
    lore: '秋の大方。四辺を閉じれば馬は飛ぶ',
    lucida: 'Enif',
    recipe: { k: 'house' },
  },
  {
    id: 'aquila',
    title: '鷲',
    latin: 'AQUILA',
    genitive: 'Aquilae',
    season: 'summer',
    lore: '彦星。三つの頭を先に打ち、翼を落とす',
    lucida: 'Altair',
    recipe: { k: 'y' },
  },
  {
    id: 'perseus',
    title: 'ペルセウス',
    latin: 'PERSEUS',
    genitive: 'Persei',
    season: 'autumn',
    lore: 'メドゥーサの首を提げる。核は瞬く',
    lucida: 'Mirfak',
    recipe: { k: 'lambda' },
  },
  {
    id: 'canis-major',
    title: '大犬',
    latin: 'CANIS MAJOR',
    genitive: 'Canis Majoris',
    season: 'winter',
    lore: 'シリウスが踵。狩人の足元を縫え',
    lucida: 'Sirius',
    recipe: { k: 'kite' },
  },
  {
    id: 'centaurus',
    title: 'ケンタウルス',
    latin: 'CENTAURUS',
    genitive: 'Centauri',
    season: 'autumn',
    lore: '南の人馬。αを核に、長い脚を落とす',
    lucida: 'Rigil Kentaurus',
    recipe: { k: 'lambda' },
  },
  {
    id: 'ophiuchus',
    title: '蛇遣',
    latin: 'OPHIUCHUS',
    genitive: 'Ophiuchi',
    season: 'summer',
    lore: '蛇を抱く医者。胴の環を先にほどけ',
    lucida: 'Rasalhague',
    recipe: { k: 'house' },
  },
  {
    id: 'carina',
    title: '竜骨',
    latin: 'CARINA',
    genitive: 'Carinae',
    season: 'winter',
    lore: 'カノープス。沈んだ船の竜骨を継げ',
    lucida: 'Canopus',
    recipe: { k: 'arc', n: 6 },
  },
  {
    id: 'hydra',
    title: '海蛇',
    latin: 'HYDRA',
    genitive: 'Hydrae',
    season: 'spring',
    lore: 'いちばん長い座。胴が横へ流れる',
    lucida: 'Alphard',
    recipe: { k: 'snake', n: 9 },
  },
  {
    id: 'phoenix',
    title: '鳳凰',
    latin: 'PHOENIX',
    genitive: 'Phoenicis',
    season: 'autumn',
    lore: '南の火の鳥。灰の星から核を起こせ',
    lucida: 'Ankaa',
    recipe: { k: 'arc', n: 5 },
  },
];

type QuickRow = [string, string, string, string, Season, string, string, Recipe];

const QUICK: QuickRow[] = [
  ['triangulum', '三角', 'TRIANGULUM', 'Trianguli', 'autumn', '北の小さな三角。頂点から縫え', 'Mothallah', { k: 'poly', n: 3 }],
  ['delphinus', '海豚', 'DELPHINUS', 'Delphini', 'summer', '跳ねる四辺。頭を先に', 'Rotanev', { k: 'poly', n: 5 }],
  ['corona-borealis', '冠', 'CORONA BOREALIS', 'Coronae Borealis', 'spring', '北の冠。弧の要を打て', 'Alphecca', { k: 'arc', n: 6 }],
  ['sagitta', '矢', 'SAGITTA', 'Sagittae', 'summer', '短い矢。一直線に貫け', 'Gamma Sge', { k: 'line', n: 4 }],
  ['ursa-minor', '小熊', 'URSA MINOR', 'Ursae Minoris', 'spring', '北極星が柄の先。碗を守るな', 'Polaris', { k: 'dipper' }],
  ['equuleus', '小馬', 'EQUULEUS', 'Equulei', 'autumn', 'いちばん小さい座。四点を結べ', 'Kitalpha', { k: 'poly', n: 4 }],
  ['canes-venatici', '猟犬', 'CANES VENATICI', 'Canum Venaticorum', 'spring', '二匹の犬。コル・カロリが核', 'Cor Caroli', { k: 'pair' }],
  ['vulpecula', '小狐', 'VULPECULA', 'Vulpeculae', 'summer', '天の川の狐。かすかな列', 'Anser', { k: 'line', n: 5 }],
  ['lepus', '兎', 'LEPUS', 'Leporis', 'winter', '狩人の足元の兎。逃げ道を塞げ', 'Arneb', { k: 'house' }],
  ['canis-minor', '小犬', 'CANIS MINOR', 'Canis Minoris', 'winter', 'プロキオン。二点を橋に', 'Procyon', { k: 'line', n: 3 }],
  ['leo-minor', '小獅子', 'LEO MINOR', 'Leonis Minoris', 'spring', '獅子の北の小さな弧', 'Praecipua', { k: 'arc', n: 4 }],
  ['cancer', '蟹', 'CANCER', 'Cancri', 'spring', '暗い星座。殻は硬く、はさみは朱', 'Al Tarf', { k: 'cluster', n: 6 }],
  ['sextans', '六分儀', 'SEXTANS', 'Sextantis', 'spring', '測る道具。三点の角', 'Alpha Sex', { k: 'poly', n: 3 }],
  ['aries', '牡羊', 'ARIES', 'Arietis', 'autumn', '黄道の入り口。角を先に', 'Hamal', { k: 'line', n: 4 }],
  ['auriga', '御者', 'AURIGA', 'Aurigae', 'winter', 'カペラを核に、五角形の手綱', 'Capella', { k: 'poly', n: 5 }],
  ['monoceros', '一角獣', 'MONOCEROS', 'Monocerotis', 'winter', '天の川の一角。長い顔を縫え', 'Alpha Mon', { k: 'y' }],
  ['eridanus', 'エリダヌス', 'ERIDANUS', 'Eridani', 'winter', '天の川を外れた河。蛇行を追え', 'Achernar', { k: 'snake', n: 8 }],
  ['fornax', '炉', 'FORNAX', 'Fornacis', 'autumn', '化学の炉。三点の火', 'Dalim', { k: 'poly', n: 3 }],
  ['musca', '蠅', 'MUSCA', 'Muscae', 'spring', '南十字の下の蠅。小さな十字', 'Alpha Mus', { k: 'cross' }],
  ['lupus', '狼', 'LUPUS', 'Lupi', 'spring', '人馬に狩られる狼。背を折れ', 'Alpha Lup', { k: 'kite' }],
  ['scutum', '盾', 'SCUTUM', 'Scuti', 'summer', 'ソビエスキの盾。天の川の濃い場', 'Alpha Sct', { k: 'poly', n: 4 }],
  ['serpens', '蛇', 'SERPENS', 'Serpentis', 'summer', '二つに分かれた蛇。頭と尾を別々に', 'Unukalhai', { k: 'snake', n: 7 }],
  ['lacerta', '蜥蜴', 'LACERTA', 'Lacertae', 'autumn', 'カシオペヤの隣のトカゲ', 'Alpha Lac', { k: 'zigzag' as Recipe['k'] } as Recipe],
  ['cepheus', 'ケフェウス', 'CEPHEUS', 'Cephei', 'autumn', '王の家。屋根型に組め', 'Alderamin', { k: 'house' }],
  ['camelopardalis', '麒麟', 'CAMELOPARDALIS', 'Camelopardalis', 'winter', '淡い麒麟。長い首を辿れ', 'Beta Cam', { k: 'line', n: 6 }],
  ['lynx', '山猫', 'LYNX', 'Lyncis', 'winter', '見えにくい猫。目を凝らして列を', 'Alpha Lyn', { k: 'line', n: 5 }],
  ['bootes', '牛飼', 'BOOTES', 'Bootis', 'spring', 'アークトゥルスが裾。凧を落とせ', 'Arcturus', { k: 'kite' }],
  ['coma', '髪', 'COMA BERENICES', 'Comae Berenices', 'spring', '女王の髪。星団を朱で', 'Beta Com', { k: 'cluster', n: 7 }],
  ['virgo', '乙女', 'VIRGO', 'Virginis', 'spring', 'スピカが穂。長いドレスを縫え', 'Spica', { k: 'y' }],
  ['libra', '天秤', 'LIBRA', 'Librae', 'spring', '二つの皿。左右を同時に削ると傾く', 'Zubeneschamali', { k: 'y' }],
  ['hercules', 'ヘルクレス', 'HERCULES', 'Herculis', 'summer', '逆立ちの英雄。腰の四辺が核', 'Kornephoros', { k: 'house' }],
  ['corona-australis', '南冠', 'CORONA AUSTRALIS', 'Coronae Australis', 'summer', '南の冠。小さな弧', 'Alfecca Meridiana', { k: 'arc', n: 5 }],
  ['aquarius', '水瓶', 'AQUARIUS', 'Aquarii', 'autumn', '水を流す。瓶から川筋へ', 'Sadalsuud', { k: 'lambda' }],
  ['capricornus', '山羊', 'CAPRICORNUS', 'Capricorni', 'autumn', '海山羊。角から尾へ三角', 'Deneb Algedi', { k: 'poly', n: 6 }],
  ['piscis-austrinus', '南魚', 'PISCIS AUSTRINUS', 'Piscis Austrini', 'autumn', 'フォーマルハウトが口。一点の一等', 'Fomalhaut', { k: 'kite' }],
  ['microscopium', '顕微鏡', 'MICROSCOPIUM', 'Microscopii', 'autumn', 'ラカーユの顕微鏡。淡い四点', 'Gamma Mic', { k: 'poly', n: 4 }],
  ['crater', '杯', 'CRATER', 'Crateris', 'spring', '海蛇の背の杯', 'Alkes', { k: 'poly', n: 5 }],
  ['corvus', '烏', 'CORVUS', 'Corvi', 'spring', '海蛇を突く烏。四辺の帆', 'Gienah', { k: 'poly', n: 4 }],
  ['antlia', '空気ポンプ', 'ANTLIA', 'Antliae', 'spring', '真空のポンプ。三点', 'Alpha Ant', { k: 'poly', n: 3 }],
  ['vela', '帆', 'VELA', 'Velorum', 'winter', 'アルゴの帆。四点の風', 'Suhail', { k: 'poly', n: 4 }],
  ['puppis', '船尾', 'PUPPIS', 'Puppis', 'winter', 'アルゴの船尾。長い竜骨へ続く', 'Naos', { k: 'arc', n: 6 }],
  ['pyxis', '羅針盤', 'PYXIS', 'Pyxidis', 'winter', '船の羅針。三点の針', 'Alpha Pyx', { k: 'poly', n: 3 }],
  ['grus', '鶴', 'GRUS', 'Gruis', 'autumn', '南の鶴。長い首を弧に', 'Alnair', { k: 'lambda' }],
  ['tucana', '巨嘴鳥', 'TUCANA', 'Tucanae', 'autumn', '小マゼランを抱く鳥', 'Alpha Tuc', { k: 'kite' }],
  ['pavo', '孔雀', 'PAVO', 'Pavonis', 'autumn', '南の孔雀。扇を広げよ', 'Peacock', { k: 'arc', n: 7 }],
  ['cetus', '鯨', 'CETUS', 'Ceti', 'autumn', 'アンドロメダを呑む鯨。尾がミラ', 'Deneb Kaitos', { k: 'snake', n: 7 }],
  ['pisces', '魚', 'PISCES', 'Piscium', 'autumn', '紐で結ばれた二匹。輪を先に', 'Alpherg', { k: 'pair' }],
  ['columba', '鳩', 'COLUMBA', 'Columbae', 'winter', 'ノアの鳩。アルゴの前を飛ぶ', 'Phact', { k: 'kite' }],
  ['caelum', '彫刻具', 'CAELUM', 'Caeli', 'winter', 'ノミ。短い二点', 'Alpha Cae', { k: 'line', n: 3 }],
  ['ara', '祭壇', 'ARA', 'Arae', 'summer', '南の祭壇。煙は上へ', 'Beta Ara', { k: 'house' }],
  ['sculptor', '彫刻室', 'SCULPTOR', 'Sculptoris', 'autumn', '工房。淡い四点', 'Alpha Scl', { k: 'poly', n: 4 }],
  ['dorado', '金魚', 'DORADO', 'Doradus', 'winter', '大マゼランを呑む魚', 'Alpha Dor', { k: 'kite' }],
  ['pictor', '画架', 'PICTOR', 'Pictoris', 'winter', '絵の架。三点の脚', 'Alpha Pic', { k: 'poly', n: 3 }],
  ['triangulum-australe', '南三角', 'TRIANGULUM AUSTRALE', 'Trianguli Australis', 'spring', '南の正三角形。均等に削れ', 'Atria', { k: 'poly', n: 3 }],
  ['norma', '定規', 'NORMA', 'Normae', 'spring', '大工の定規。直角に組め', 'Gamma2 Nor', { k: 'lambda' }],
  ['circinus', 'コンパス', 'CIRCINUS', 'Circini', 'spring', 'コンパス。二脚と要', 'Alpha Cir', { k: 'poly', n: 3 }],
  ['telescopium', '望遠鏡', 'TELESCOPIUM', 'Telescopii', 'summer', 'ラカーユの筒。長い筒を貫け', 'Alpha Tel', { k: 'line', n: 4 }],
  ['volans', '飛魚', 'VOLANS', 'Volantis', 'winter', '飛魚。ひし形の鰭', 'Beta Vol', { k: 'poly', n: 4 }],
  ['horologium', '時計', 'HOROLOGIUM', 'Horologii', 'winter', '振り子時計。長い鎖', 'Alpha Hor', { k: 'line', n: 5 }],
  ['hydrus', '水蛇', 'HYDRUS', 'Hydri', 'autumn', '南の水蛇。小マゼランの傍', 'Beta Hyi', { k: 'poly', n: 3 }],
  ['indus', 'インディアン', 'INDUS', 'Indi', 'autumn', '南のインディアン。長い槍', 'Alpha Ind', { k: 'line', n: 5 }],
  ['octans', '八分儀', 'OCTANS', 'Octantis', 'autumn', '南極を抱く。動かぬ座', 'Nu Oct', { k: 'poly', n: 3 }],
  ['mensa', 'テーブル山', 'MENSA', 'Mensae', 'winter', '大マゼランの麓の山', 'Alpha Men', { k: 'poly', n: 4 }],
  ['chamaeleon', 'カメレオン', 'CHAMAELEON', 'Chamaeleontis', 'spring', '南極のカメレオン', 'Alpha Cha', { k: 'arc', n: 4 }],
  ['apus', '極楽鳥', 'APUS', 'Apodis', 'spring', '極楽鳥。南極の近く', 'Alpha Aps', { k: 'lambda' }],
  ['reticulum', 'レチクル', 'RETICULUM', 'Reticuli', 'winter', '観測の網。菱を閉じよ', 'Alpha Ret', { k: 'poly', n: 4 }],
];

function asRow(row: QuickRow): CatalogRow {
  const [id, title, latin, genitive, season, lore, lucida, recipe] = row;
  return { id, title, latin, genitive, season, lore, lucida, recipe };
}

function fixRecipe(r: Recipe): Recipe {
  if ((r as { k: string }).k === 'teapot') {
    return {
      k: 'custom',
      stars: [
        { x: 0.3, y: 0.28 },
        { x: 0.46, y: 0.22 },
        { x: 0.58, y: 0.36 },
        { x: 0.44, y: 0.48, armored: true },
        { x: 0.28, y: 0.58 },
        { x: 0.7, y: 0.52 },
        { x: 0.82, y: 0.7 },
        { x: 0.18, y: 0.78, vermilion: true },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [3, 4],
        [2, 5],
        [5, 6],
        [4, 7],
      ],
    };
  }
  if ((r as { k: string }).k === 'zigzag') return { k: 'w' };
  return r;
}

const BY_ID: Record<string, ConstellationDef> = {};

function register(row: CatalogRow): void {
  const baked = bake(fixRecipe(row.recipe));
  BY_ID[row.id] = {
    id: row.id,
    title: row.title,
    latin: row.latin,
    genitive: row.genitive,
    season: row.season,
    lore: row.lore,
    lucida: row.lucida,
    stars: baked.stars,
    edges: baked.edges,
    field: baked.field,
  };
}

for (const row of CATALOG) register(row);
for (const row of QUICK) register(asRow(row));

/** 小・中・小・大 の順。有名な座を中ボス・大ボスへ。IAU 88座をすべて一度ずつ。 */
export const CAMPAIGN: string[] = [
  'triangulum',
  'cassiopeia',
  'delphinus',
  'orion',
  'corona-borealis',
  'lyra',
  'sagitta',
  'ursa-major',
  'ursa-minor',
  'pegasus',
  'equuleus',
  'scorpius',
  'canes-venatici',
  'aquila',
  'vulpecula',
  'cygnus',
  'lepus',
  'canis-major',
  'canis-minor',
  'leo',
  'leo-minor',
  'cancer',
  'sextans',
  'taurus',
  'aries',
  'perseus',
  'auriga',
  'gemini',
  'monoceros',
  'eridanus',
  'fornax',
  'crux',
  'musca',
  'centaurus',
  'lupus',
  'sagittarius',
  'scutum',
  'ophiuchus',
  'serpens',
  'andromeda',
  'lacerta',
  'cepheus',
  'camelopardalis',
  'draco',
  'lynx',
  'bootes',
  'coma',
  'virgo',
  'libra',
  'hercules',
  'corona-australis',
  'aquarius',
  'capricornus',
  'piscis-austrinus',
  'microscopium',
  'hydra',
  'crater',
  'corvus',
  'antlia',
  'carina',
  'vela',
  'puppis',
  'pyxis',
  'phoenix',
  'grus',
  'tucana',
  'pavo',
  'cetus',
  'pisces',
  'columba',
  'caelum',
  'ara',
  'sculptor',
  'dorado',
  'pictor',
  'triangulum-australe',
  'norma',
  'circinus',
  'telescopium',
  'volans',
  'horologium',
  'hydrus',
  'indus',
  'octans',
  'mensa',
  'chamaeleon',
  'apus',
  'reticulum',
];

export const IAU_COUNT = 88;
export const STAGES_PER_STAR = 3;
export const CAMPAIGN_LENGTH = IAU_COUNT * STAGES_PER_STAR;

export function constellationById(id: string): ConstellationDef {
  const c = BY_ID[id];
  if (!c) throw new Error(`unknown constellation ${id}`);
  return c;
}

export interface AtlasGlyph {
  stars: Array<{ x: number; y: number }>;
  edges: Array<[number, number]>;
}

export type LayoutShape = 'OCTAGON' | 'DIAMOND' | 'HEXAGON' | 'DISC';

export interface LayoutStar {
  x: number;
  y: number;
  hpMul?: number;
  vermilion?: boolean;
  armored?: boolean;
  vx?: number;
  shape?: LayoutShape;
}

/** 盤面と同じ座標。図譜もここから描く。 */
export function geometryLayout(kind: GeometryKind): LayoutStar[] {
  const pts: LayoutStar[] = [];
  const put = (s: LayoutStar) => pts.push(s);

  if (kind === 'gate') {
    for (const c of [0.2, 0.4, 0.6, 0.8]) put({ x: c, y: 0.18, hpMul: 1.1 });
    for (const c of [0.2, 0.8]) {
      put({ x: c, y: 0.42, hpMul: 1 });
      put({ x: c, y: 0.66, hpMul: 0.9, shape: 'DIAMOND' });
    }
  } else if (kind === 'wings') {
    for (let i = 0; i < 6; i++) put({ x: 0.08 + i * 0.168, y: 0.16, hpMul: 1.15 });
    for (const c of [0.08, 0.24, 0.76, 0.92]) put({ x: c, y: 0.4, hpMul: 1 });
    for (const c of [0.24, 0.5, 0.76]) put({ x: c, y: 0.64, hpMul: 0.85, shape: 'DISC' });
  } else if (kind === 'steps') {
    for (let r = 0; r < 3; r++) {
      const n = 4 + r;
      for (let i = 0; i < n; i++) {
        put({ x: 0.12 + (0.76 * i) / (n - 1), y: 0.18 + r * 0.26, hpMul: 1.1 - r * 0.12 });
      }
    }
  } else if (kind === 'cluster') {
    for (let i = 0; i < 6; i++) put({ x: 0.12 + i * 0.15, y: 0.16, hpMul: 1.1 });
    for (let i = 0; i < 6; i++) {
      const bomb = i === 2 || i === 3;
      put({ x: 0.12 + i * 0.15, y: 0.44, hpMul: bomb ? 0.6 : 1, vermilion: bomb });
    }
    for (let i = 1; i < 5; i++) {
      const bomb = i === 1 || i === 4;
      put({ x: 0.12 + i * 0.15, y: 0.7, hpMul: bomb ? 0.6 : 0.9, vermilion: bomb });
    }
  } else if (kind === 'shower') {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        if ((r + c) % 5 === 0) continue;
        put({ x: 0.08 + c * 0.168, y: 0.12 + r * 0.2, hpMul: 0.85, vermilion: (r + c) % 7 === 0 });
      }
    }
  } else if (kind === 'bastion') {
    for (let i = 0; i < 6; i++) put({ x: 0.08 + i * 0.168, y: 0.16, hpMul: 0.9 });
    for (let i = 1; i < 5; i++) {
      put({ x: 0.08 + i * 0.168, y: 0.4, hpMul: 0.85, vermilion: i === 2 || i === 3 });
    }
    for (let i = 1; i < 5; i++) {
      put({ x: 0.08 + i * 0.168, y: 0.66, hpMul: 1.7, armored: true, shape: 'OCTAGON' });
    }
  } else if (kind === 'orbit') {
    for (let r = 0; r < 4; r++) {
      const vx = (r % 2 === 0 ? 1 : -1) * (20 + r * 4);
      const cols = r % 2 === 0 ? [0, 1, 3, 4] : [1, 2, 4, 5];
      for (const c of cols) {
        put({
          x: 0.08 + c * 0.168,
          y: 0.14 + r * 0.2,
          hpMul: 1,
          vermilion: r === 2 && (c === 2 || c === 4),
          vx,
          shape: 'DISC',
        });
      }
    }
  } else if (kind === 'triangle') {
    const rows = [[0.5], [0.35, 0.65], [0.22, 0.5, 0.78], [0.12, 0.34, 0.66, 0.88]];
    rows.forEach((row, r) => {
      row.forEach((x) => put({ x, y: 0.14 + r * 0.22, hpMul: r === 0 ? 1.6 : 1, armored: r === 0 }));
    });
  } else if (kind === 'hex') {
    put({ x: 0.5, y: 0.46, hpMul: 1.5, armored: true, shape: 'HEXAGON' });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      put({ x: 0.5 + Math.cos(a) * 0.34, y: 0.46 + Math.sin(a) * 0.32, hpMul: 1 });
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      put({
        x: 0.5 + Math.cos(a) * 0.18,
        y: 0.46 + Math.sin(a) * 0.16,
        hpMul: 0.85,
        vermilion: i % 2 === 0,
      });
    }
  } else if (kind === 'diamond') {
    const spots = [
      [0.5, 0.1],
      [0.32, 0.32],
      [0.68, 0.32],
      [0.18, 0.54],
      [0.5, 0.54],
      [0.82, 0.54],
      [0.32, 0.76],
      [0.68, 0.76],
      [0.5, 0.9],
    ];
    spots.forEach(([x, y], i) =>
      put({ x, y, hpMul: i === 4 ? 1.5 : 1, armored: i === 4, shape: 'DIAMOND' })
    );
  } else if (kind === 'wedge') {
    for (let r = 0; r < 5; r++) {
      const n = r + 1;
      for (let i = 0; i < n; i++) {
        put({
          x: 0.5 + (i - (n - 1) / 2) * 0.16,
          y: 0.12 + r * 0.17,
          hpMul: r === 0 ? 1.4 : 1,
          armored: r === 0,
        });
      }
    }
  } else if (kind === 'spiral') {
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const a = t * Math.PI * 3.2;
      const rad = 0.08 + t * 0.34;
      put({
        x: 0.5 + Math.cos(a) * rad,
        y: 0.46 + Math.sin(a) * rad * 0.9,
        hpMul: i === 0 ? 1.5 : 0.95,
        vermilion: i === 8,
        armored: i === 0,
      });
    }
  } else if (kind === 'columns') {
    for (let r = 0; r < 5; r++) {
      put({ x: 0.28, y: 0.12 + r * 0.18, hpMul: 1, armored: r === 0 });
      put({ x: 0.72, y: 0.12 + r * 0.18, hpMul: 1, vermilion: r === 2, armored: r === 0 });
    }
  } else if (kind === 'checker') {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const bomb = (r + c) % 2 === 0;
        put({ x: 0.14 + c * 0.18, y: 0.14 + r * 0.22, hpMul: bomb ? 0.7 : 1.05, vermilion: bomb });
      }
    }
  } else if (kind === 'ring') {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      put({ x: 0.5 + Math.cos(a) * 0.38, y: 0.46 + Math.sin(a) * 0.34, hpMul: 1 });
    }
    put({ x: 0.5, y: 0.46, hpMul: 1.6, armored: true, shape: 'OCTAGON' });
  } else if (kind === 'cross') {
    for (let i = 0; i < 5; i++) {
      put({ x: 0.5, y: 0.1 + i * 0.18, hpMul: i === 2 ? 1.5 : 1, armored: i === 2 });
    }
    for (const x of [0.18, 0.34, 0.66, 0.82]) put({ x, y: 0.46, hpMul: 1 });
  } else {
    for (let i = 0; i < 5; i++) put({ x: 0.15 + i * 0.175, y: 0.35, hpMul: 1 });
  }
  return pts;
}

function connectLayout(pts: Array<{ x: number; y: number }>, maxD = 0.3): Array<[number, number]> {
  const edges: Array<[number, number]> = [];
  const seen = new Set<string>();
  for (let i = 0; i < pts.length; i++) {
    const near: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d > 0.02 && d <= maxD) near.push({ j, d });
    }
    near.sort((a, b) => a.d - b.d);
    for (const n of near.slice(0, 2)) {
      const a = Math.min(i, n.j);
      const b = Math.max(i, n.j);
      const key = `${a}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([a, b]);
    }
  }
  return edges;
}

export function geometryFigure(kind: GeometryKind): AtlasGlyph {
  const pts = geometryLayout(kind);
  return { stars: pts.map((p) => ({ x: p.x, y: p.y })), edges: connectLayout(pts) };
}

export function atlasFigure(stage: number): AtlasGlyph {
  if (stage > 0 && stage % 3 === 0) {
    const fig = constellationForStage(stage);
    return {
      stars: fig.stars.map((s) => ({ x: s.x, y: s.y })),
      edges: fig.edges.map(([a, b]) => [a, b]),
    };
  }
  return geometryFigure(geometryKindForStage(stage));
}

export function constellationIndexForStage(stage: number): number | null {
  if (stage < 3 || stage % 3 !== 0) return null;
  return Math.floor(stage / 3 - 1);
}

export function constellationForStage(stage: number): ConstellationDef {
  const idx = constellationIndexForStage(stage);
  const i = idx === null ? Math.floor((Math.max(1, stage) - 1) / 3) : idx;
  const id = CAMPAIGN[((i % CAMPAIGN.length) + CAMPAIGN.length) % CAMPAIGN.length];
  return constellationById(id);
}

export function geometryKindForStage(stage: number): GeometryKind {
  const serial = stage - Math.floor(stage / 3) - 1;
  return GEOMETRY_CYCLE[((serial % GEOMETRY_CYCLE.length) + GEOMETRY_CYCLE.length) % GEOMETRY_CYCLE.length];
}

export function plateSeason(stage: number): Season {
  const plate = Math.floor((Math.max(1, stage) - 1) / 12);
  return (['winter', 'spring', 'summer', 'autumn'] as Season[])[plate % 4];
}
