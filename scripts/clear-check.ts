/**
 * Headless volley-count for stages 1–20. Aims at the lowest star and fast-forwards.
 */
import { createCanvas, type Canvas } from '@napi-rs/canvas';
import { getStageBlueprint, stageBaseHp, stagePearlDamage } from '../src/game/kintsugiData.ts';

const TABLET_W = 390;
const TABLET_H = 660;
const CRADLE_Y = 596;
const rafQueue: FrameRequestCallback[] = [];

function stubDom(main: Canvas): void {
  Object.assign(main, {
    style: {},
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
  const g = globalThis as unknown as Record<string, unknown>;
  g.devicePixelRatio = 1;
  g.requestAnimationFrame = (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  };
  g.cancelAnimationFrame = () => {};
  g.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
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
    src = '';
  };
  g.performance = { now: () => 0 };
}

function drainRaf(now: number): void {
  const batch = rafQueue.splice(0, rafQueue.length);
  for (const cb of batch) cb(now);
}

type Eng = {
  phase: string;
  integrity: number;
  cradleX: number;
  aimAngle: number;
  fastForward: boolean;
  vessels: Array<{ x: number; y: number; hp: number; indestructible?: boolean }>;
  guardian: { hp: number } | null;
  beginRun: (n: number, fire: boolean) => void;
  releaseGoldenPearls: () => void;
  getBasePearlCount: () => number;
  getCurrentPearlDamage: () => number;
};

function aimAt(e: Eng, volley: number): void {
  const vs = e.vessels.filter((v) => !v.indestructible && v.hp > 0);
  if (vs.length === 0 && !e.guardian) {
    e.aimAngle = -Math.PI / 2 + (volley % 2 === 0 ? 0.22 : -0.22);
    return;
  }
  const t = vs.length
    ? vs.reduce((a, b) => (a.hp >= b.hp ? a : b))
    : { x: e.cradleX, y: 180 };
  const wall = volley % 3 === 0 ? 0.32 : volley % 3 === 1 ? -0.28 : 0.12;
  let ang = Math.atan2(t.y - CRADLE_Y, t.x - e.cradleX) + wall * 0.15;
  ang = Math.max(-Math.PI + 0.18, Math.min(-0.18, ang));
  e.aimAngle = ang;
}

async function main(): Promise<void> {
  const canvas = createCanvas(TABLET_W, TABLET_H);
  stubDom(canvas);
  const { KintsugiCanvasEngine } = await import('../src/game/kintsugiCanvas.ts');
  const engine = new KintsugiCanvasEngine(canvas as unknown as HTMLCanvasElement, {
    onStateChange: () => {},
    onAwakeningReady: () => {},
    onVesselBroken: () => {},
    onPrologueDismissed: () => {},
    onStageCleared: () => {},
    onRunPersist: () => {},
  }) as unknown as Eng;

  (engine as unknown as { canvas: { style: Record<string, string> } }).canvas.style = {
    width: `${TABLET_W}px`,
    height: `${TABLET_H}px`,
  };

  let now = 0;
  const dt = 40;
  console.log('st  title           dmg hp  n  pearls volleys result');
  for (let stage = 1; stage <= 20; stage++) {
    const bp = getStageBlueprint(stage);
    engine.beginRun(stage, false);
    const n = engine.vessels.filter((v) => !v.indestructible).length;
    const hp = stageBaseHp(stage);
    const dmg = stagePearlDamage(stage);
    const pearls = engine.getBasePearlCount();
    let volleys = 0;
    let result = 'timeout';
    for (let step = 0; step < 8000 && volleys < 30; step++) {
      now += dt;
      drainRaf(now);
      if (engine.phase === 'CLEARED') {
        result = 'clear';
        break;
      }
      if (engine.phase === 'SHATTERED') {
        result = 'broke';
        break;
      }
      if (engine.phase === 'AIMING' || engine.phase === 'TRANSITION') {
        aimAt(engine, volleys);
        engine.releaseGoldenPearls();
        engine.fastForward = true;
        volleys += 1;
      }
    }
    const mark = result === 'clear' && volleys <= 2 ? ' TOO_EASY' : result !== 'clear' ? ' FAIL' : '';
    console.log(
      `${String(stage).padStart(2)}  ${bp.title.padEnd(12)} ${String(dmg).padStart(3)} ${String(hp).padStart(4)} ${String(n).padStart(2)}  ${String(pearls).padStart(3)}    ${String(volleys).padStart(3)}   ${result}${mark}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
