/**
 * Headless capture of 星継 playfield clips (no browser).
 * Writes WebP/GIF under recordings/<stamp>/ for later SNS edit.
 */
import { createCanvas, loadImage, GlobalFonts, type Canvas, type SKRSContext2D } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TABLET_W = 390;
const TABLET_H = 660;
const DPR = 2;

const rafQueue: FrameRequestCallback[] = [];
const localStore = new Map<string, string>();

function stubDom(main: Canvas): void {
  const style: Record<string, string> = {};
  Object.assign(main, {
    style,
    addEventListener: () => {},
    removeEventListener: () => {},
    setPointerCapture: () => {},
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: TABLET_W,
      height: TABLET_H,
      right: TABLET_W,
      bottom: TABLET_H,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });

  const g = globalThis as unknown as {
    window: unknown;
    document: unknown;
    Image: unknown;
    requestAnimationFrame: typeof requestAnimationFrame;
    cancelAnimationFrame: typeof cancelAnimationFrame;
    localStorage: Storage;
    devicePixelRatio: number;
    performance: { now: () => number };
  };

  g.devicePixelRatio = DPR;
  g.requestAnimationFrame = (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  };
  g.cancelAnimationFrame = () => {};
  g.localStorage = {
    getItem: (k: string) => localStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      localStore.set(k, v);
    },
    removeItem: (k: string) => {
      localStore.delete(k);
    },
    clear: () => localStore.clear(),
    key: () => null,
    length: 0,
  } as Storage;

  g.document = {
    createElement: (tag: string) => {
      if (tag !== 'canvas') return { style: {} };
      const c = createCanvas(64, 64) as Canvas & { style: Record<string, string> };
      c.style = {};
      (c as unknown as { addEventListener: () => void }).addEventListener = () => {};
      return c;
    },
    addEventListener: () => {},
  };

  g.window = g;
  g.Image = class {
    complete = false;
    naturalWidth = 0;
    naturalHeight = 0;
    width = 0;
    height = 0;
    src = '';
  };
}

function drainRaf(now: number): void {
  const batch = rafQueue.splice(0, rafQueue.length);
  for (const cb of batch) cb(now);
}

function writePng(canvas: Canvas, file: string): void {
  fs.writeFileSync(file, canvas.toBuffer('image/png'));
}

function encodeAnim(framesDir: string, outFile: string, delay = 6): void {
  const frames = fs
    .readdirSync(framesDir)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => path.join(framesDir, f));
  if (frames.length === 0) throw new Error(`no frames in ${framesDir}`);
  execFileSync(
    'convert',
    ['-delay', String(delay), '-loop', '0', ...frames, outFile],
    { stdio: 'inherit' }
  );
}

function cropAnim(
  src: string,
  out: string,
  crop: string,
  extra: string[] = []
): void {
  execFileSync('convert', [src, '-coalesce', '-crop', crop, '+repage', ...extra, out], {
    stdio: 'inherit',
  });
}

function registerDemoFonts(): void {
  const faces: Array<[string, string]> = [
    ['@fontsource/zen-old-mincho/files/zen-old-mincho-japanese-400-normal.woff', 'Zen Old Mincho'],
    ['@fontsource/zen-old-mincho/files/zen-old-mincho-japanese-600-normal.woff', 'Zen Old Mincho'],
    ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff', 'Cormorant Garamond'],
    ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff', 'Cormorant Garamond'],
  ];
  for (const [rel, family] of faces) {
    const abs = path.join(ROOT, 'node_modules', rel);
    if (fs.existsSync(abs)) {
      try {
        GlobalFonts.registerFromPath(abs, family);
      } catch {
        /* woff may be unsupported; demos still run */
      }
    }
  }
}

async function main(): Promise<void> {
  registerDemoFonts();
  const stamp =
    process.env.DEMO_STAMP ??
    `${new Date().toISOString().slice(0, 10)}-${(process.env.DEMO_SHA ?? 'dev').slice(0, 7)}`;
  const outDir = path.join(ROOT, 'recordings', stamp);
  const tmp = path.join('/tmp', `hoshitsugi-demo-${stamp}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const canvas = createCanvas(TABLET_W * DPR, TABLET_H * DPR);
  stubDom(canvas);
  const ctx = canvas.getContext('2d') as SKRSContext2D;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const { KintsugiCanvasEngine } = await import('../src/game/kintsugiCanvas.ts');
  const engine = new KintsugiCanvasEngine(canvas as unknown as HTMLCanvasElement, {
    onStateChange: () => {},
    onAwakeningReady: () => {},
    onVesselBroken: () => {},
    onPrologueDismissed: () => {},
    onStageCleared: () => {},
    onRunPersist: () => {},
  });

  const paperPath = path.join(ROOT, 'public/assets/atlas-paper.webp');
  if (fs.existsSync(paperPath)) {
    const paper = await loadImage(paperPath);
    (engine as unknown as { bgImage: unknown }).bgImage = paper;
  }

  (engine as unknown as { canvas: { style: Record<string, string> } }).canvas.style = {
    width: `${TABLET_W}px`,
    height: `${TABLET_H}px`,
  };

  const shoot = () => {
    (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.35;
    engine.releaseGoldenPearls();
    engine.fastForward = true;
  };

  type Scene = { name: string; setup: () => void; frames: number; tick?: (i: number) => void };
  const scenes: Scene[] = [
    {
      name: '01-aim-geometry',
      frames: 48,
      setup: () => {
        engine.beginRun(1, false);
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.58;
        (engine as unknown as { isDrawingThread: boolean }).isDrawingThread = true;
      },
      tick: (i) => {
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.5 - Math.sin(i / 8) * 0.28;
      },
    },
    {
      name: '02-volley-flight',
      frames: 72,
      setup: () => {
        engine.beginRun(1, false);
        shoot();
      },
    },
    {
      name: '03-constellation-triangulum',
      frames: 64,
      setup: () => {
        engine.beginRun(3, false);
        (engine as unknown as { isDrawingThread: boolean }).isDrawingThread = true;
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.52;
      },
      tick: (i) => {
        if (i === 18) shoot();
      },
    },
    {
      name: '04-midboss-cassiopeia',
      frames: 80,
      setup: () => {
        engine.beginRun(6, false);
        shoot();
      },
    },
    {
      name: '05-grand-orion',
      frames: 90,
      setup: () => {
        engine.beginRun(12, false);
        shoot();
      },
    },
    {
      name: '10-chart-vessels',
      frames: 56,
      setup: () => {
        engine.beginRun(1, false);
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.55;
        (engine as unknown as { isDrawingThread: boolean }).isDrawingThread = true;
      },
      tick: (i) => {
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.5 - Math.sin(i / 7) * 0.22;
      },
    },
    {
      name: '11-combo-confirm',
      frames: 72,
      setup: () => {
        engine.beginRun(1, false);
        type ChainEng = {
          phase: string;
          vessels: Array<{ x: number; y: number }>;
          incrementChain: (x?: number, y?: number) => void;
          chainCount: number;
          comboFlash: number;
          chainPopScale: number;
        };
        const e = engine as unknown as ChainEng;
        e.phase = 'FLIGHT';
        const vs = e.vessels;
        if (vs.length > 0) {
          while (e.chainCount < 21) {
            const v = vs[e.chainCount % vs.length];
            e.incrementChain(v.x, v.y);
          }
        }
        e.comboFlash = 1;
        e.chainPopScale = 1.55;
      },
      tick: (i) => {
        type ChainEng = {
          vessels: Array<{ x: number; y: number }>;
          incrementChain: (x?: number, y?: number) => void;
          comboFlash: number;
        };
        const e = engine as unknown as ChainEng;
        if (i % 5 === 0 && e.vessels.length > 0) {
          const v = e.vessels[i % e.vessels.length];
          e.incrementChain(v.x, v.y);
          e.comboFlash = 1;
        }
      },
    },
    {
      name: '14-steps-terrace',
      frames: 72,
      setup: () => {
        engine.beginRun(4, false);
        (engine as unknown as { isDrawingThread: boolean }).isDrawingThread = true;
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.54;
      },
      tick: (i) => {
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.5 - Math.sin(i / 9) * 0.2;
        if (i === 16) shoot();
      },
    },
    {
      name: '15-wings-volley',
      frames: 64,
      setup: () => {
        engine.beginRun(2, false);
        (engine as unknown as { isDrawingThread: boolean }).isDrawingThread = true;
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.62;
      },
      tick: (i) => {
        if (i === 12) shoot();
      },
    },
    {
      name: '16-cluster-vermilion',
      frames: 68,
      setup: () => {
        engine.beginRun(5, false);
        shoot();
      },
    },
    {
      name: '17-orbit-drift',
      frames: 80,
      setup: () => {
        engine.beginRun(10, false);
        (engine as unknown as { isDrawingThread: boolean }).isDrawingThread = true;
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.48;
      },
      tick: (i) => {
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.5 + Math.sin(i / 10) * 0.24;
        if (i === 22) shoot();
      },
    },
    {
      name: '18-bastion-armor',
      frames: 72,
      setup: () => {
        engine.beginRun(8, false);
        shoot();
      },
    },
    {
      name: '19-constellation-field',
      frames: 76,
      setup: () => {
        engine.beginRun(9, false);
        (engine as unknown as { isDrawingThread: boolean }).isDrawingThread = true;
        (engine as unknown as { aimAngle: number }).aimAngle = -Math.PI * 0.5;
      },
      tick: (i) => {
        if (i === 14) shoot();
      },
    },
  ];

  let now = 0;
  const dtMs = 50;
  const only = process.env.DEMO_ONLY?.split(',').map((s) => s.trim()).filter(Boolean);

  for (const scene of scenes) {
    if (only && !only.includes(scene.name)) continue;
    console.log('scene', scene.name);
    const dir = path.join(tmp, scene.name);
    fs.mkdirSync(dir, { recursive: true });
    scene.setup();
    drainRaf(now);
    for (let i = 0; i < scene.frames; i++) {
      scene.tick?.(i);
      now += dtMs;
      drainRaf(now);
      writePng(canvas, path.join(dir, `${String(i).padStart(3, '0')}.png`));
    }
    const dest = path.join(outDir, `${scene.name}.webp`);
    encodeAnim(dir, dest, 5);
    console.log(' wrote', dest, fs.statSync(dest).size);
  }

  const master = path.join(outDir, '02-volley-flight.webp');
  if (fs.existsSync(master)) {
    cropAnim(master, path.join(outDir, '06-square-playfield.webp'), '780x780+0+270');
    cropAnim(master, path.join(outDir, '07-close-cradle.webp'), '780x480+0+840');
    cropAnim(
      path.join(outDir, '03-constellation-triangulum.webp'),
      path.join(outDir, '08-close-stars.webp'),
      '780x780+0+80'
    );
  }

  const portrait = path.join(outDir, '09-portrait-story.webp');
  execFileSync(
    'convert',
    [
      path.join(outDir, '05-grand-orion.webp'),
      '-coalesce',
      '-gravity',
      'center',
      '-background',
      '#cfc3a8',
      '-extent',
      '780x1387',
      portrait,
    ],
    { stdio: 'inherit' }
  );

  if (fs.existsSync(path.join(outDir, '10-chart-vessels.webp'))) {
    cropAnim(path.join(outDir, '10-chart-vessels.webp'), path.join(outDir, '12-close-vessels.webp'), '780x620+0+40');
  }
  if (fs.existsSync(path.join(outDir, '11-combo-confirm.webp'))) {
    cropAnim(
      path.join(outDir, '11-combo-confirm.webp'),
      path.join(outDir, '13-close-combo.webp'),
      '780x780+0+180'
    );
  }
  if (fs.existsSync(path.join(outDir, '14-steps-terrace.webp'))) {
    cropAnim(
      path.join(outDir, '14-steps-terrace.webp'),
      path.join(outDir, '20-close-steps.webp'),
      '780x780+0+80'
    );
  }
  if (fs.existsSync(path.join(outDir, '19-constellation-field.webp'))) {
    cropAnim(
      path.join(outDir, '19-constellation-field.webp'),
      path.join(outDir, '21-close-obstacles.webp'),
      '780x780+0+80'
    );
  }
  if (fs.existsSync(path.join(outDir, '17-orbit-drift.webp'))) {
    cropAnim(
      path.join(outDir, '17-orbit-drift.webp'),
      path.join(outDir, '22-square-orbit.webp'),
      '780x780+0+270'
    );
  }

  fs.writeFileSync(
    path.join(outDir, 'SHOTLIST.md'),
    `# ${stamp}

Playfield captures of 星継 for later SNS edit. Source is the live engine (atlas paper, chart-star vessels, combo astrolabe).

| file | angle / use |
|---|---|
| 01-aim-geometry.webp | 正面・照準（図1 門列） |
| 02-volley-flight.webp | 正面・放つ（珠の軌跡） |
| 03-constellation-triangulum.webp | 正面・小ボス 三角 |
| 04-midboss-cassiopeia.webp | 正面・中ボス カシオペヤ |
| 05-grand-orion.webp | 正面・大ボス オリオン |
| 06-square-playfield.webp | 正方形クロップ（フィード） |
| 07-close-cradle.webp | 寄り・地平の弦／放つ手元 |
| 08-close-stars.webp | 寄り・星座の器 |
| 09-portrait-story.webp | 9:16 ストーリー余白 |
| 10-chart-vessels.webp | 正面・星図の器（カタログ星） |
| 11-combo-confirm.webp | 正面・コンボ確定（等級輪） |
| 12-close-vessels.webp | 寄り・器の材質 |
| 13-close-combo.webp | 寄り・コンボ確定演出 |
| 14-steps-terrace.webp | 正面・段丘（図譜と同じ 4-5-6） |
| 15-wings-volley.webp | 正面・双翼を放つ |
| 16-cluster-vermilion.webp | 正面・朱叢 |
| 17-orbit-drift.webp | 正面・回廊（流れる器） |
| 18-bastion-armor.webp | 正面・砦の装甲 |
| 19-constellation-field.webp | 正面・星座と周囲の障害 |
| 20-close-steps.webp | 寄り・段丘の段 |
| 21-close-obstacles.webp | 寄り・星とハッチの障害 |
| 22-square-orbit.webp | 正方形・回廊 |

20 fps WebP. Re-run: \`npx tsx scripts/record-demo.ts\`
`
  );

  console.log('done', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
