import { sound } from '../audio/kintsugiAudio';
import {
  ABILITIES,
  AbilityId,
  BOSS_ARCHETYPES,
  BossForm,
  RunSnapshot,
  SEALS_PER_AWAKENING,
  StageBlueprint,
  StageClearInfo,
  constellationClearsBefore,
  constellationForStage,
  emptyRanks,
  getStageBlueprint,
  isAwakeningStage,
  isBossStage,
  isConstellationStage,
} from './kintsugiData';
import {
  MAGNITUDE_MILESTONES,
  atlasFigure,
  geometryFigure,
  geometryLayout,
  magnitudeOf,
} from './constellations';
import { SKIN, type CanvasSkin, type VisualTheme } from './visualTheme';

export const TABLET_W = 390;
export const TABLET_H = 660;
const CRADLE_Y = 596;
const SEAL_LINE_Y = 552;
const TURN_DESCENT_Y = 46;
const BOSS_DESCENT_Y = 34;
const MAX_PEARLS = 200;

type VesselShape = 'OCTAGON' | 'DIAMOND' | 'HEXAGON' | 'DISC';

interface CrackBranch {
  pts: Array<{ x: number; y: number }>;
}

export interface PorcelainVessel {
  id: number;
  shape: VesselShape;
  isVermilion: boolean;
  isArmored: boolean;
  anchored?: boolean;
  x: number;
  y: number;
  vx: number;
  targetY: number;
  radius: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  scalePop: number;
  cracks: CrackBranch[];
  isObstacle?: boolean;
}

export interface PearlOrb {
  id: number;
  x: number;
  y: number;
  targetY: number;
  r: number;
  bonus: number;
  phase: number;
}

export interface BossArmorSegment {
  index: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  scalePop: number;
}

export interface GuardianEntity {
  id: number;
  form: BossForm;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  targetY: number;
  vx: number;
  coreR: number;
  armorR: number;
  hp: number;
  maxHp: number;
  rotPrimary: number;
  rotSecondary: number;
  breathPhase: number;
  hitFlash: number;
  scalePop: number;
  segments: BossArmorSegment[];
}

export interface SeirinRing {
  id: number;
  x: number;
  y: number;
  vx: number;
  r: number;
  charges: number;
  maxCharges: number;
  phase: number;
  flash: number;
}

export interface GoldenPearl {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  bounces: number;
  splitCount: number;
  nextSplitAt: number;
  piercesLeft: number;
  bonusNextHit: number;
  ribbon: Array<{ x: number; y: number }>;
  lastRingId: number;
}

interface LingeringGoldSeam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
  dmgTickTimer: number;
}

interface GoldLightningArc {
  pts: Array<{ x: number; y: number }>;
  life: number;
  maxLife: number;
}

interface CeramicShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  isGold: boolean;
  isVermilion: boolean;
  life: number;
  maxLife: number;
}

interface GoldSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  isVermilion: boolean;
}

interface GoldRipple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

interface WhisperCallout {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface DustMote {
  x: number;
  y: number;
  vy: number;
  vx: number;
  r: number;
  alpha: number;
  phase: number;
}

export type EnginePhase =
  | 'PROLOGUE'
  | 'AIMING'
  | 'FLIGHT'
  | 'CLEARED'
  | 'TRANSITION'
  | 'INTERLUDE'
  | 'SHATTERED';

export interface ActiveAbilityBadge {
  id: AbilityId;
  shortCrest: string;
  rank: number;
}

export interface KintsugiHudState {
  phase: EnginePhase;
  stage: number;
  stageLabel: string;
  stageTitle: string;
  awakeningSeals: number; // 0..2 progress toward next 3-seal Awakening
  sealsNeeded: number;
  vesselsIntegrity: number;
  maxIntegrity: number;
  hasSlashAbility: boolean;
  slashesLeft: number;
  maxSlashes: number;
  fastForward: boolean;
  chainCount: number;
  activePearlCount: number;
  basePearlCount: number;
  guardianTitle: string | null;
  guardianSubtitle: string | null;
  guardianRatio: number;
  guardianTurnsLeft: number | null;
  acquiredBadges: ActiveAbilityBadge[];
}

export interface KintsugiCallbacks {
  onStateChange: (hud: KintsugiHudState) => void;
  onAwakeningReady: (stageCleared: number, maxChain: number) => void;
  onVesselBroken: (stageReached: number, longestChain: number) => void;
  onPrologueDismissed: () => void;
  onStageCleared: (info: StageClearInfo) => void;
  onRunPersist: (snap: RunSnapshot) => void;
}

export class KintsugiCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: KintsugiCallbacks;
  private pearlGlowSprite: HTMLCanvasElement;
  private coronaGlowSprite: HTMLCanvasElement;

  public phase: EnginePhase = 'PROLOGUE';
  public stage = 1;
  public awakeningSeals = 0;
  private transitionTimer = 0;
  private currentBlueprint: StageBlueprint = getStageBlueprint(1);
  public integrity = 3;
  public maxIntegrity = 3;
  public fastForward = false;

  public ranks: Record<AbilityId, number> = emptyRanks();

  public collectedOrbPearls = 0;
  public stageClearBonusPearls = 0;
  private pendingAwakening = false;
  private clearBurstTimer = 0;

  // Cradle & Thread State
  private cradleX = TABLET_W * 0.5;
  private nextCradleX: number | null = null;
  private aimAngle = -Math.PI * 0.5;
  private isDrawingThread = false;
  private activePointerId: number | null = null;
  private lastTickBucket = 0;

  // Pearls & Volley State
  public pearls: GoldenPearl[] = [];
  private bonusPearlsBuffer: GoldenPearl[] = [];
  private launchQueue = 0;
  private launchTotalThisVolley = 6;
  private launchTimer = 0;
  private launchDirX = 0;
  private launchDirY = -1;

  public slashesLeft = 0;
  public maxSlashes = 0;
  private slashUsedThisStage = false;
  private stringBouncesLeft = 0;
  private killsSinceRecharge = 0;
  private lightningHitCounter = 0;

  public chainCount = 0;
  private chainPopScale = 1;
  public longestChainInRun = 0;
  private flightElapsed = 0;

  // Entities
  public vessels: PorcelainVessel[] = [];
  public orbs: PearlOrb[] = [];
  public guardian: GuardianEntity | null = null;
  public rings: SeirinRing[] = [];
  private seams: LingeringGoldSeam[] = [];
  private lightningArcs: GoldLightningArc[] = [];
  private shards: CeramicShard[] = [];
  private sparks: GoldSpark[] = [];
  private ripples: GoldRipple[] = [];
  private callouts: WhisperCallout[] = [];
  private dust: DustMote[] = [];

  // Screen & Time Aesthetics
  private hitStopTimer = 0;
  private slowMoTimer = 0;
  private shakeTimer = 0;
  private shakeAmp = 0;
  private veilAlpha = 0;
  private veilColor = '#ece8e1';
  private chapterBannerTimer = 0;
  private figureLinks: Array<[number, number]> = [];
  private stitches: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    life: number;
    maxLife: number;
  }> = [];
  private lastHit: { x: number; y: number } | null = null;
  private clearHoldMax = 12;
  private comboFlash = 0;
  private aimContact: { vesselId: number; x: number; y: number; nx: number; ny: number } | null =
    null;
  private aimPts: Array<{ x: number; y: number }> = [];

  private bgImage: HTMLImageElement;
  private nextId = 1;
  private timeSec = 0;
  private rafId = 0;
  private skin: CanvasSkin = SKIN;

  constructor(canvas: HTMLCanvasElement, callbacks: KintsugiCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D context unavailable');
    this.ctx = context;
    this.cb = callbacks;
    this.pearlGlowSprite = this.buildPearlGlowSprite();
    this.coronaGlowSprite = this.buildCoronaGlowSprite();

    this.bgImage = new Image();
    this.setTheme('atlas');

    this.initAmbientGoldDust();
    this.bindPointer();
    this.preparePrologue();
    this.startLoop();
  }

  private buildPearlGlowSprite(): HTMLCanvasElement {
    const size = 44;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const gctx = c.getContext('2d')!;
    const half = size * 0.5;
    const s = this.skin ?? SKIN;
    const grad = gctx.createRadialGradient(half, half, 1.5, half, half, half);
    grad.addColorStop(0, s.pearlGlow0);
    grad.addColorStop(0.32, s.pearlGlow1);
    grad.addColorStop(1, s.pearlGlow2);
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, size, size);
    return c;
  }

  private buildCoronaGlowSprite(): HTMLCanvasElement {
    const size = 160;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const gctx = c.getContext('2d')!;
    const half = size * 0.5;
    const s = this.skin ?? SKIN;
    const grad = gctx.createRadialGradient(half, half, 14, half, half, half);
    grad.addColorStop(0, 'rgba(138, 106, 46, 0.45)');
    grad.addColorStop(0.4, 'rgba(122, 36, 28, 0.18)');
    grad.addColorStop(1, 'rgba(138, 106, 46, 0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, size, size);
    return c;
  }

  private initAmbientGoldDust(): void {
    this.dust = [];
    for (let i = 0; i < 34; i++) {
      this.dust.push({
        x: Math.random() * TABLET_W,
        y: Math.random() * TABLET_H,
        vx: (Math.random() - 0.5) * 6,
        vy: -4 - Math.random() * 9,
        r: 0.7 + Math.random() * 1.4,
        alpha: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  public resizeToStage(maxWidth: number, maxHeight: number): void {
    const aspect = TABLET_W / TABLET_H;
    let cssW = maxWidth;
    let cssH = cssW / aspect;
    if (cssH > maxHeight) {
      cssH = maxHeight;
      cssW = cssH * aspect;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.style.width = `${Math.floor(cssW)}px`;
    this.canvas.style.height = `${Math.floor(cssH)}px`;
    this.canvas.width = Math.floor(TABLET_W * dpr);
    this.canvas.height = Math.floor(TABLET_H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public toggleFastForward(): void {
    this.fastForward = !this.fastForward;
    this.emitHud();
  }

  public setTheme(_theme: VisualTheme): void {
    this.skin = SKIN;
    if (this.skin.bgImage) {
      this.bgImage.src = this.skin.bgImage;
    } else {
      this.bgImage.src = '';
    }
    this.pearlGlowSprite = this.buildPearlGlowSprite();
    this.coronaGlowSprite = this.buildCoronaGlowSprite();
  }

  private font(weight: string, size: number, ui = false): string {
    return `${weight} ${size}px ${ui ? this.skin.fontUi : this.skin.font}`;
  }

  public preparePrologue(): void {
    this.phase = 'PROLOGUE';
    this.stage = 1;
    this.awakeningSeals = 0;
    this.currentBlueprint = getStageBlueprint(1);
    this.integrity = 3;
    this.maxIntegrity = 3;
    this.longestChainInRun = 0;
    this.chainCount = 0;
    this.collectedOrbPearls = 0;
    this.stageClearBonusPearls = 0;
    this.pendingAwakening = false;
    this.fastForward = false;
    this.cradleX = TABLET_W * 0.5;
    this.aimAngle = -Math.PI * 0.5;
    this.pearls = [];
    this.bonusPearlsBuffer = [];
    this.vessels = [];
    this.orbs = [];
    this.guardian = null;
    this.rings = [];
    this.seams = [];
    this.lightningArcs = [];
    this.ranks = emptyRanks();
    this.emitHud();
  }

  public beginExpeditionAndOptionallyFire(fireImmediately = false): void {
    this.beginRun(1, fireImmediately);
  }

  public beginRun(startStage = 1, fireImmediately = false): void {
    this.stage = Math.max(1, startStage);
    this.awakeningSeals = 0;
    this.integrity = 3;
    this.maxIntegrity = 3;
    this.longestChainInRun = 0;
    this.collectedOrbPearls = 0;
    this.stageClearBonusPearls = constellationClearsBefore(startStage);
    this.pendingAwakening = false;
    this.fastForward = false;
    this.ranks = emptyRanks();
    this.cradleX = TABLET_W * 0.5;
    this.setupStage(this.stage);
    this.cb.onPrologueDismissed();
    if (fireImmediately) {
      this.releaseGoldenPearls();
    }
  }

  public restoreRun(snap: RunSnapshot): void {
    this.stage = snap.stage;
    this.integrity = snap.integrity;
    this.maxIntegrity = snap.maxIntegrity;
    this.ranks = { ...emptyRanks(), ...snap.ranks };
    this.collectedOrbPearls = snap.collectedOrbPearls;
    this.stageClearBonusPearls = snap.stageClearBonusPearls;
    this.awakeningSeals = snap.awakeningSeals;
    this.longestChainInRun = snap.longestChainInRun;
    this.cradleX = snap.cradleX;
    this.pendingAwakening = false;
    this.fastForward = false;
    this.setupStage(this.stage);
    this.cb.onPrologueDismissed();
  }

  public exportRun(): RunSnapshot {
    return {
      stage: this.stage,
      integrity: this.integrity,
      maxIntegrity: this.maxIntegrity,
      ranks: { ...this.ranks },
      collectedOrbPearls: this.collectedOrbPearls,
      stageClearBonusPearls: this.stageClearBonusPearls,
      awakeningSeals: this.awakeningSeals,
      longestChainInRun: this.longestChainInRun,
      cradleX: this.cradleX,
    };
  }

  public skipClearHold(): void {
    if (this.phase === 'CLEARED' && this.transitionTimer < this.clearHoldMax - 0.85) {
      this.transitionTimer = 0;
    }
  }

  private persistRun(): void {
    if (this.phase === 'PROLOGUE' || this.phase === 'SHATTERED') return;
    this.cb.onRunPersist(this.exportRun());
  }

  public inscribeAbility(id: AbilityId): void {
    this.ranks[id] = (this.ranks[id] ?? 0) + 1;
  }

  public proceedAfterAwakening(): void {
    this.stage += 1;
    if (isBossStage(this.stage - 1) && this.integrity < this.maxIntegrity) {
      this.integrity += 1;
    }
    this.setupStage(this.stage);
  }

  /**
   * Starts humbly at 6 Golden Pearls on Stage 1, climbing +1 per stage clear,
   * +1 per Golden Orb collected on board, and +2..+14 gradually via `連珠の契`!
   */
  public getBasePearlCount(): number {
    const surgeTable = [0, 2, 4, 7, 10, 14];
    const surge = surgeTable[Math.min(surgeTable.length - 1, this.ranks.pearl_surge)] ?? 0;
    return 6 + this.stageClearBonusPearls + this.collectedOrbPearls + surge;
  }

  public getCurrentPearlDamage(): number {
    if (this.ranks.bounce_split >= 5 && this.chainCount >= 80) {
      return 2;
    }
    return 1;
  }

  private getMaxStringBounces(): number {
    const table = [0, 2, 4, 7, 11, 16];
    return table[Math.min(table.length - 1, this.ranks.sky_string)] ?? 0;
  }

  private getRingChargesPerTurn(): number {
    const table = [0, 3, 6, 10, 12, 18];
    return table[Math.min(table.length - 1, this.ranks.twin_ring)] ?? 0;
  }

  private getPiercesPerPearl(): number {
    const table = [0, 1, 2, 3, 5, 999];
    return table[Math.min(table.length - 1, this.ranks.piercing_gold)] ?? 0;
  }

  // ============================================================================
  // STAGE & BOSS GENERATOR
  // ============================================================================

  public setupStage(stageNum: number): void {
    const bp = getStageBlueprint(stageNum);
    this.currentBlueprint = bp;
    this.phase = 'AIMING';
    this.fastForward = false;
    this.pearls = [];
    this.bonusPearlsBuffer = [];
    this.seams = [];
    this.lightningArcs = [];
    this.rings = [];
    this.vessels = [];
    this.orbs = [];
    this.guardian = null;
    this.figureLinks = [];
    this.stitches = [];
    this.lastHit = null;
    this.comboFlash = 0;
    this.chainCount = 0;
    this.killsSinceRecharge = 0;
    this.lightningHitCounter = 0;
    this.slashUsedThisStage = false;
    this.awakeningSeals = (stageNum - 1) % 3;

    // `金継ぎの一閃` (`kintsugi_slash`):
    // Rank 1 = 1 use for the entire stage; Rank 2..4 = 1 use per turn; Rank 5 = 2 uses per turn!
    const slashRank = this.ranks.kintsugi_slash;
    this.maxSlashes = slashRank === 0 ? 0 : slashRank >= 5 ? 2 : 1;
    this.slashesLeft = this.maxSlashes;
    this.stringBouncesLeft = this.getMaxStringBounces();
    this.chapterBannerTimer = bp.whisperHint ? 3.6 : 2.2;

    // Spawn `星輪の紋` (`twin_ring`) ONLY if unlocked, with measured split charges!
    const ringCap = this.getRingChargesPerTurn();
    if (this.ranks.twin_ring >= 1) {
      this.rings.push({
        id: this.nextId++,
        x: TABLET_W * 0.38,
        y: 424,
        vx: 32,
        r: 22 + Math.min(4, this.ranks.twin_ring),
        charges: ringCap,
        maxCharges: ringCap,
        phase: 0,
        flash: 0,
      });
    }
    if (this.ranks.twin_ring >= 4) {
      this.rings.push({
        id: this.nextId++,
        x: TABLET_W * 0.65,
        y: 352,
        vx: -38,
        r: 22,
        charges: ringCap,
        maxCharges: ringCap,
        phase: Math.PI * 0.5,
        flash: 0,
      });
    }

    if (bp.archetype === 'GUARDIAN_BOSS') {
      this.buildGuardianBoss(bp);
    } else if (bp.archetype === 'CONSTELLATION') {
      this.buildConstellationFigure(bp);
    } else {
      this.buildGeometry(bp);
    }

    this.emitHud();
    this.persistRun();
  }

  private colX(col: number, totalCols = 6): number {
    const padX = 35;
    const stepX = (TABLET_W - padX * 2) / (totalCols - 1);
    return padX + col * stepX;
  }

  private mapStar(nx: number, ny: number): { x: number; y: number } {
    return { x: 38 + nx * 314, y: 88 + ny * 292 };
  }

  private buildConstellationFigure(bp: StageBlueprint): void {
    const fig = constellationForStage(bp.stage);
    const ids: number[] = [];
    const shapes: VesselShape[] = ['DISC', 'HEXAGON', 'OCTAGON', 'DIAMOND'];
    fig.stars.forEach((star, i) => {
      const p = this.mapStar(star.x, star.y);
      const hp = Math.round(bp.baseHp * (star.armored ? 1.7 : star.vermilion ? 0.55 : 1));
      this.addVessel(
        p.x,
        p.y,
        hp,
        star.vermilion ? 'DIAMOND' : star.armored ? 'OCTAGON' : shapes[i % 3],
        Boolean(star.vermilion),
        Boolean(star.armored),
        star.drift ?? 0,
        false
      );
      ids.push(this.vessels[this.vessels.length - 1].id);
    });
    this.figureLinks = fig.edges
      .filter(([a, b]) => ids[a] && ids[b])
      .map(([a, b]) => [ids[a], ids[b]]);

    for (const extra of fig.field ?? []) {
      const p = this.mapStar(extra.x, extra.y);
      this.addVessel(
        p.x,
        p.y,
        Math.max(3, Math.round(bp.baseHp * 0.7)),
        extra.vermilion ? 'DIAMOND' : extra.armored ? 'OCTAGON' : 'DISC',
        Boolean(extra.vermilion),
        Boolean(extra.armored),
        extra.drift ?? 0,
        true
      );
    }

    if (this.vessels.length < 8) {
      const extras: Array<{ x: number; y: number; armored?: boolean; vermilion?: boolean; drift?: number }> = [
        { x: 0.12, y: 0.18, armored: true },
        { x: 0.88, y: 0.18, armored: true },
        { x: 0.08, y: 0.52, drift: 20 },
        { x: 0.92, y: 0.52, drift: -20 },
        { x: 0.22, y: 0.84, vermilion: true },
        { x: 0.78, y: 0.84 },
        { x: 0.5, y: 0.72 },
      ];
      for (const extra of extras) {
        if (this.vessels.length >= 11) break;
        const p = this.mapStar(extra.x, extra.y);
        if (this.vessels.some((v) => Math.hypot(v.x - p.x, v.y - p.y) < 36)) continue;
        this.addVessel(
          p.x,
          p.y,
          Math.max(3, Math.round(bp.baseHp * (extra.armored ? 1.1 : 0.65))),
          extra.vermilion ? 'DIAMOND' : extra.armored ? 'OCTAGON' : 'HEXAGON',
          Boolean(extra.vermilion),
          Boolean(extra.armored),
          extra.drift ?? 0,
          true
        );
      }
    }

    this.addOrb(TABLET_W * 0.18, 300, 1);
    if (bp.stage >= 2) this.addOrb(TABLET_W * 0.82, 268, 1);
  }

  /**
   * Stage 5, 10, 15...: PROCEDURAL CELESTIAL KARAKURI BOSS!
   * Features individually destructible Hakuji Porcelain Armor Segments + Sacred Eclipse/Lotus/Armillary Core!
   */
  private buildGuardianBoss(bp: StageBlueprint): void {
    const bossIdx = Math.floor(Math.max(0, bp.stage / 12 - 1)) % BOSS_ARCHETYPES.length;
    const arch = BOSS_ARCHETYPES[bossIdx];
    const coreHp = Math.round(bp.baseHp * (bp.stage <= 12 ? 4.4 : 5.4));
    const segHp = Math.max(7, Math.round(bp.baseHp * 0.8));

    const segments: BossArmorSegment[] = [];
    for (let i = 0; i < arch.armorCount; i++) {
      segments.push({
        index: i,
        hp: segHp,
        maxHp: segHp,
        hitFlash: 0,
        scalePop: 1,
      });
    }

    const fig = constellationForStage(bp.stage);
    const startY = 148;
    this.guardian = {
      id: this.nextId++,
      form: arch.form,
      title: fig.title,
      subtitle: '',
      x: TABLET_W * 0.5,
      y: startY - 22,
      targetY: startY,
      vx: 16 + Math.min(36, bp.stage * 0.22),
      coreR: 33,
      armorR: 65,
      hp: coreHp,
      maxHp: coreHp,
      rotPrimary: 0,
      rotSecondary: 0,
      breathPhase: 0,
      hitFlash: 0,
      scalePop: 1,
      segments,
    };

    // Upper canopy — also descends, so the board keeps pressing the shop floor
    for (const c of [1, 2, 3, 4]) {
      this.addVessel(this.colX(c), 68, Math.round(bp.baseHp * 0.72), 'OCTAGON', false, false, 0);
    }
    // Flanking vermilion — they walk the threshold too
    for (const c of [0, 5]) {
      this.addVessel(this.colX(c), 168, Math.round(bp.baseHp * 0.5), 'DIAMOND', true, false, 0);
    }
    for (const c of [1, 4]) {
      this.addVessel(this.colX(c), 236, Math.round(bp.baseHp * 0.62), 'HEXAGON', false, false, 0);
    }
    this.addOrb(this.colX(0), 108, 1);
    this.addOrb(this.colX(5), 108, 1);

    const ids: number[] = [];
    fig.stars.slice(0, 4).forEach((star, i) => {
      const p = this.mapStar(star.x, 0.08 + star.y * 0.22);
      this.addVessel(
        p.x,
        Math.min(92, p.y),
        Math.round(bp.baseHp * 0.55),
        i % 2 === 0 ? 'DISC' : 'HEXAGON',
        false,
        false,
        0
      );
      ids.push(this.vessels[this.vessels.length - 1].id);
    });
    this.figureLinks = fig.edges
      .filter(([a, b]) => ids[a] && ids[b])
      .map(([a, b]) => [ids[a], ids[b]]);
    sound.playPorcelainShatter(true);
  }

  private buildGeometry(bp: StageBlueprint): void {
    const kind = bp.geometry ?? 'gate';
    const heat = Math.min(1, Math.max(0, (bp.stage - 10) / 50));
    const columnDrift = kind === 'columns' && bp.stage >= 22 ? 18 + heat * 16 : 0;
    const layout = geometryLayout(kind);
    const ids: number[] = [];

    for (const star of layout) {
      const p = this.mapStar(star.x, star.y);
      const vermilion = Boolean(star.vermilion);
      const armored = Boolean(star.armored);
      let vx = star.vx ?? 0;
      if (vx === 0 && columnDrift) vx = (star.x < 0.5 ? 1 : -1) * columnDrift * 0.6;
      const shape: VesselShape =
        star.shape ?? (armored ? 'OCTAGON' : vermilion ? 'DIAMOND' : 'HEXAGON');
      this.addVessel(
        p.x,
        p.y,
        Math.round(bp.baseHp * (star.hpMul ?? 1) * (vermilion ? 0.55 : 1)),
        shape,
        vermilion,
        armored,
        vx,
        false
      );
      ids.push(this.vessels[this.vessels.length - 1].id);
    }

    this.figureLinks = geometryFigure(kind)
      .edges.filter(([a, b]) => ids[a] && ids[b])
      .map(([a, b]) => [ids[a], ids[b]]);

    this.addOrb(TABLET_W * 0.18, 310, 1);
    if (bp.stage >= 2) this.addOrb(TABLET_W * 0.82, 278, 1);
  }

  public getGuardianTurnsUntilBreach(): number | null {
    if (!this.guardian) return null;
    const breachCenterY = SEAL_LINE_Y - this.guardian.armorR;
    const remPx = breachCenterY - this.guardian.targetY;
    return Math.max(1, Math.ceil(remPx / BOSS_DESCENT_Y));
  }

  private addVessel(
    x: number,
    targetY: number,
    hp: number,
    shape: VesselShape,
    isVermilion: boolean,
    isArmored: boolean,
    vx: number,
    isObstacle = false
  ): void {
    const finalHp = Math.max(3, hp);
    const radius = isArmored ? 21 : isObstacle ? 16.2 : 18.5;
    this.vessels.push({
      id: this.nextId++,
      shape,
      isVermilion,
      isArmored,
      x,
      y: targetY - 22,
      vx,
      targetY,
      radius,
      hp: finalHp,
      maxHp: finalHp,
      hitFlash: 0,
      scalePop: 1,
      cracks: this.generateKintsugiCracks(radius),
      isObstacle,
    });
  }

  private addOrb(x: number, targetY: number, bonus: number): void {
    this.orbs.push({
      id: this.nextId++,
      x,
      y: targetY - 16,
      targetY,
      r: 13,
      bonus,
      phase: Math.random() * Math.PI * 2,
    });
  }

  private vesselLocalVerts(shape: VesselShape, r: number): Array<{ x: number; y: number }> {
    if (shape === 'DISC') return [];
    if (shape === 'DIAMOND') {
      return [
        { x: 0, y: -r },
        { x: r * 0.86, y: 0 },
        { x: 0, y: r },
        { x: -r * 0.86, y: 0 },
      ];
    }
    const sides = shape === 'HEXAGON' ? 6 : 8;
    const offset = shape === 'OCTAGON' ? Math.PI / 8 : Math.PI / 6;
    const out: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < sides; i++) {
      const a = offset + (i / sides) * Math.PI * 2;
      out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return out;
  }

  private vesselWorldVerts(v: PorcelainVessel): Array<{ x: number; y: number }> {
    return this.vesselLocalVerts(v.shape, v.radius).map((p) => ({ x: v.x + p.x, y: v.y + p.y }));
  }

  private pointInConvex(px: number, py: number, verts: Array<{ x: number; y: number }>): boolean {
    let sign = 0;
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % verts.length];
      const cross = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
      if (Math.abs(cross) < 1e-8) continue;
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
    return true;
  }

  /** Closest surface point + outward normal. Depth is penetration of a circle `pr`. */
  private vesselContact(
    px: number,
    py: number,
    pr: number,
    v: PorcelainVessel
  ): { nx: number; ny: number; qx: number; qy: number; depth: number } | null {
    if (v.shape === 'DISC') {
      const dx = px - v.x;
      const dy = py - v.y;
      const dist = Math.hypot(dx, dy);
      const hitR = v.radius + pr;
      if (dist > hitR) return null;
      const nx = dist > 0.001 ? dx / dist : 0;
      const ny = dist > 0.001 ? dy / dist : -1;
      return {
        nx,
        ny,
        qx: v.x + nx * v.radius,
        qy: v.y + ny * v.radius,
        depth: hitR - dist,
      };
    }

    const verts = this.vesselWorldVerts(v);
    let bestD = Infinity;
    let qx = v.x;
    let qy = v.y;
    let nx = 0;
    let ny = -1;
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % verts.length];
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const len2 = abx * abx + aby * aby || 1;
      const t = Math.max(0, Math.min(1, ((px - a.x) * abx + (py - a.y) * aby) / len2));
      const sx = a.x + abx * t;
      const sy = a.y + aby * t;
      const dx = px - sx;
      const dy = py - sy;
      const d = Math.hypot(dx, dy);
      if (d >= bestD) continue;
      bestD = d;
      qx = sx;
      qy = sy;
      let enx = aby;
      let eny = -abx;
      const nlen = Math.hypot(enx, eny) || 1;
      enx /= nlen;
      eny /= nlen;
      if (enx * (sx - v.x) + eny * (sy - v.y) < 0) {
        enx = -enx;
        eny = -eny;
      }
      if (t > 0.04 && t < 0.96) {
        nx = enx;
        ny = eny;
      } else if (d > 0.001) {
        nx = dx / d;
        ny = dy / d;
        if (nx * (px - v.x) + ny * (py - v.y) < 0) {
          nx = -nx;
          ny = -ny;
        }
      } else {
        nx = enx;
        ny = eny;
      }
    }

    const inside = this.pointInConvex(px, py, verts);
    if (!inside && bestD > pr) return null;
    return { nx, ny, qx, qy, depth: inside ? pr + bestD : pr - bestD };
  }

  private bounceOffNormal(
    p: GoldenPearl,
    nx: number,
    ny: number,
    qx: number,
    qy: number
  ): void {
    const vn = p.vx * nx + p.vy * ny;
    if (vn < 0) {
      p.vx -= 2 * vn * nx;
      p.vy -= 2 * vn * ny;
    }
    p.x = qx + nx * (p.r + 0.9);
    p.y = qy + ny * (p.r + 0.9);
    p.bounces++;
  }

  private generateKintsugiCracks(r: number): CrackBranch[] {
    const branches: CrackBranch[] = [];
    for (let i = 0; i < 4; i++) {
      const baseAngle = (i / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const midAngle = baseAngle + (Math.random() - 0.5) * 0.45;
      branches.push({
        pts: [
          { x: 0, y: 0 },
          { x: Math.cos(midAngle) * r * 0.48, y: Math.sin(midAngle) * r * 0.48 },
          { x: Math.cos(baseAngle) * r * 0.92, y: Math.sin(baseAngle) * r * 0.92 },
        ],
      });
    }
    return branches;
  }

  // ============================================================================
  // TACTILE INPUT
  // ============================================================================

  private toLogical(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = TABLET_W / Math.max(1, rect.width);
    const scaleY = TABLET_H / Math.max(1, rect.height);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private bindPointer(): void {
    this.canvas.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      sound.unlock();
      const pt = this.toLogical(ev.clientX, ev.clientY);

      if (this.phase === 'AIMING') {
        this.isDrawingThread = true;
        this.activePointerId = ev.pointerId;
        this.canvas.setPointerCapture(ev.pointerId);
        this.updateThreadAim(pt.x, pt.y);
      } else if (this.phase === 'CLEARED') {
        this.skipClearHold();
      } else if (this.phase === 'FLIGHT' && this.ranks.kintsugi_slash > 0) {
        this.triggerKintsugiConvergence(pt.x, pt.y);
      }
    });

    this.canvas.addEventListener('pointermove', (ev) => {
      if (!this.isDrawingThread || ev.pointerId !== this.activePointerId) return;
      const pt = this.toLogical(ev.clientX, ev.clientY);
      this.updateThreadAim(pt.x, pt.y);
    });

    const release = (ev: PointerEvent) => {
      if (!this.isDrawingThread || ev.pointerId !== this.activePointerId) return;
      this.isDrawingThread = false;
      this.activePointerId = null;

      if (this.phase === 'AIMING') {
        this.releaseGoldenPearls();
      }
    };

    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
  }

  private updateThreadAim(px: number, py: number): void {
    let dx = px - this.cradleX;
    let dy = py - CRADLE_Y;

    if (dy > 14) {
      dx = -dx;
      dy = -dy;
    }
    if (Math.hypot(dx, dy) < 8) {
      dx = 0;
      dy = -1;
    }

    let ang = Math.atan2(dy, dx);
    const minAng = -Math.PI + 0.16;
    const maxAng = -0.16;
    if (ang > 0) {
      ang = dx >= 0 ? maxAng : minAng;
    } else {
      ang = Math.max(minAng, Math.min(maxAng, ang));
    }

    const bucket = Math.round(ang * 24);
    if (bucket !== this.lastTickBucket) {
      this.lastTickBucket = bucket;
      sound.playThreadTick(bucket);
    }
    this.aimAngle = ang;
  }

  public releaseGoldenPearls(): void {
    if (this.phase !== 'AIMING') return;
    this.phase = 'FLIGHT';
    this.chapterBannerTimer = 0;
    this.chainCount = 0;
    this.lastHit = null;
    this.comboFlash = 0;
    this.flightElapsed = 0;
    this.killsSinceRecharge = 0;
    this.nextCradleX = null;
    // Rank 1 `kintsugi_slash`: 1 charge for the entire stage; Rank 2+: refreshes every turn!
    if (this.ranks.kintsugi_slash >= 2) {
      this.slashesLeft = this.maxSlashes;
    } else if (this.ranks.kintsugi_slash === 1) {
      this.slashesLeft = this.slashUsedThisStage ? 0 : 1;
    } else {
      this.slashesLeft = 0;
    }
    this.stringBouncesLeft = this.getMaxStringBounces();

    this.launchDirX = Math.cos(this.aimAngle);
    this.launchDirY = Math.sin(this.aimAngle);
    this.launchTotalThisVolley = this.getBasePearlCount();
    this.launchQueue = this.launchTotalThisVolley;
    this.launchTimer = 0;

    this.spawnSinglePearlFromCradle();
    this.launchQueue -= 1;
    this.emitHud();
  }

  private spawnSinglePearlFromCradle(): void {
    const speed = 610;
    const index = this.launchTotalThisVolley - this.launchQueue;
    sound.playPearlRelease(index);

    const baseAng = Math.atan2(this.launchDirY, this.launchDirX);
    const jitter = (Math.random() - 0.5) * 0.01;
    const splitStep = [0, 24, 20, 16, 13, 10][Math.min(5, this.ranks.bounce_split)] ?? 0;

    this.pearls.push({
      id: this.nextId++,
      x: this.cradleX,
      y: CRADLE_Y - 4,
      vx: Math.cos(baseAng + jitter) * speed,
      vy: Math.sin(baseAng + jitter) * speed,
      r: 4.8,
      bounces: 0,
      splitCount: 0,
      nextSplitAt: splitStep,
      piercesLeft: this.getPiercesPerPearl(),
      bonusNextHit: 0,
      ribbon: [],
      lastRingId: -1,
    });
  }

  private spawnEphemeralBurstPearls(cx: number, cy: number, count: number): void {
    const room = MAX_PEARLS - (this.pearls.length + this.bonusPearlsBuffer.length);
    const actual = Math.min(count, room);
    if (actual <= 0) return;

    const spd = 605;
    for (let i = 0; i < actual; i++) {
      const ang = -Math.PI * (0.18 + Math.random() * 0.64) + (i % 2 === 0 ? 0 : Math.PI * 0.2);
      this.bonusPearlsBuffer.push({
        id: this.nextId++,
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 4.5,
        bounces: 0,
        splitCount: 99, // Ephemeral pearls don't recursively self-split
        nextSplitAt: 0,
        piercesLeft: this.getPiercesPerPearl(),
        bonusNextHit: 0,
        ribbon: [],
        lastRingId: -1,
      });
    }
  }

  public triggerKintsugiConvergence(tx: number, ty: number): boolean {
    if (
      this.phase !== 'FLIGHT' ||
      this.ranks.kintsugi_slash <= 0 ||
      this.slashesLeft <= 0 ||
      this.pearls.length === 0
    ) {
      return false;
    }

    const clampedX = Math.max(22, Math.min(TABLET_W - 22, tx));
    const clampedY = Math.max(32, Math.min(CRADLE_Y - 34, ty));

    this.slashesLeft -= 1;
    this.slashUsedThisStage = true;
    this.hitStopTimer = 0.045;
    this.slowMoTimer = 0.14;
    this.shakeTimer = 0.2;
    this.shakeAmp = 6;
    this.veilAlpha = 0.25;
    this.veilColor = '#FFEAB3';

    sound.playKintsugiConvergence();

    this.ripples.push({
      x: clampedX,
      y: clampedY,
      r: 6,
      maxR: 108,
      color: this.skin.gold,
      alpha: 0.96,
      lineWidth: 2.3,
    });

    const rank = this.ranks.kintsugi_slash;
    const seamDuration = rank >= 5 ? 1.85 : rank >= 3 ? 1.15 : 0.32;
    const seamStride = Math.max(1, Math.ceil(this.pearls.length / 40));

    this.pearls.forEach((p, i) => {
      if (i % seamStride === 0) {
        this.seams.push({
          x1: p.x,
          y1: p.y,
          x2: clampedX,
          y2: clampedY,
          life: seamDuration,
          maxLife: seamDuration,
          dmgTickTimer: 0,
        });
      }

      const dx = clampedX - p.x;
      const dy = clampedY - p.y;
      const baseAng = Math.atan2(dy, dx);
      const spread = ((i % 9) - 4) * 0.015;
      const spd = 685;
      p.vx = Math.cos(baseAng + spread) * spd;
      p.vy = Math.sin(baseAng + spread) * spd;
      p.lastRingId = -1;
    });

    this.spawnWhisper(clampedX, clampedY - 20, '一閃', this.skin.pearlCore, 16.5);
    this.emitHud();
    return true;
  }

  // ============================================================================
  // MAIN SIMULATION LOOP
  // ============================================================================

  private startLoop(): void {
    let prev = performance.now();
    const step = (now: number) => {
      const rawDt = Math.min(0.045, (now - prev) / 1000);
      prev = now;
      this.update(rawDt);
      this.render();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  private update(rawDt: number): void {
    this.timeSec += rawDt;

    if (this.chapterBannerTimer > 0) {
      this.chapterBannerTimer = Math.max(0, this.chapterBannerTimer - rawDt);
    }
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - rawDt);
    if (this.veilAlpha > 0) this.veilAlpha = Math.max(0, this.veilAlpha - rawDt * 1.8);
    if (this.comboFlash > 0) this.comboFlash = Math.max(0, this.comboFlash - rawDt * 1.6);
    if (this.chainPopScale > 1) {
      this.chainPopScale = Math.max(1, this.chainPopScale - rawDt * 3.5);
    }

    for (const m of this.dust) {
      m.x += m.vx * rawDt + Math.sin(this.timeSec * 0.9 + m.phase) * 0.12;
      m.y += m.vy * rawDt;
      if (m.y < -10) {
        m.y = TABLET_H + 10;
        m.x = Math.random() * TABLET_W;
      }
    }

    if (this.phase === 'CLEARED' || this.phase === 'TRANSITION') {
      this.updateVisualParticles(rawDt);
      this.transitionTimer -= rawDt;
      this.clearBurstTimer = Math.max(0, this.clearBurstTimer - rawDt);
      if (this.transitionTimer <= 0) {
        this.finishClearHold();
      }
      return;
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= rawDt;
      this.updateVisualParticles(rawDt * 0.25);
      return;
    }

    let timeScale = 1.0;
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDt;
      timeScale = 0.35;
    } else if (this.phase === 'FLIGHT') {
      if (this.fastForward) {
        timeScale = 2.4;
      } else if (this.flightElapsed > 6.0) {
        timeScale = this.flightElapsed > 9.0 ? 2.8 : 1.9;
      }
    }

    const dt = rawDt * timeScale;
    this.updateVisualParticles(dt);

    for (const v of this.vessels) {
      v.y += (v.targetY - v.y) * Math.min(1, rawDt * 10);
      if (v.vx !== 0) {
        v.x += v.vx * dt;
        if (v.x < 34) {
          v.x = 34;
          v.vx = Math.abs(v.vx);
        } else if (v.x > TABLET_W - 34) {
          v.x = TABLET_W - 34;
          v.vx = -Math.abs(v.vx);
        }
      }
      if (v.hitFlash > 0) v.hitFlash = Math.max(0, v.hitFlash - rawDt * 5.5);
      if (v.scalePop > 1) v.scalePop = Math.max(1, v.scalePop - rawDt * 5.0);
    }

    for (const o of this.orbs) {
      o.y += (o.targetY - o.y) * Math.min(1, rawDt * 10);
      o.phase += rawDt * 3.5;
    }

    for (const r of this.rings) {
      r.phase += dt * 1.2;
      if (r.flash > 0) r.flash = Math.max(0, r.flash - rawDt * 4.2);
      r.x += r.vx * dt;
      if (r.x < 68) {
        r.x = 68;
        r.vx = Math.abs(r.vx);
      } else if (r.x > TABLET_W - 68) {
        r.x = TABLET_W - 68;
        r.vx = -Math.abs(r.vx);
      }
    }

    // Update Procedural Celestial Boss (including smooth turn-by-turn descent!)
    if (this.guardian) {
      const g = this.guardian;
      g.y += (g.targetY - g.y) * Math.min(1, rawDt * 8.5);
      g.rotPrimary += dt * 0.48;
      g.rotSecondary -= dt * 0.72;
      g.breathPhase += dt * 1.35;
      if (g.hitFlash > 0) g.hitFlash = Math.max(0, g.hitFlash - rawDt * 5.5);
      if (g.scalePop > 1) g.scalePop = Math.max(1, g.scalePop - rawDt * 4.2);
      for (const seg of g.segments) {
        if (seg.hitFlash > 0) seg.hitFlash = Math.max(0, seg.hitFlash - rawDt * 5.5);
        if (seg.scalePop > 1) seg.scalePop = Math.max(1, seg.scalePop - rawDt * 4.8);
      }

      g.x += g.vx * dt;
      const bound = g.armorR + 28;
      if (g.x < bound) {
        g.x = bound;
        g.vx = Math.abs(g.vx);
      } else if (g.x > TABLET_W - bound) {
        g.x = TABLET_W - bound;
        g.vx = -Math.abs(g.vx);
      }
    }

    // Rank 3+ `kintsugi_slash`: Lingering Golden Seams
    if (this.ranks.kintsugi_slash >= 3 && this.seams.length > 0) {
      for (const s of this.seams) {
        s.dmgTickTimer -= dt;
        if (s.dmgTickTimer <= 0) {
          s.dmgTickTimer = 0.14;
          const seamDmg = this.ranks.kintsugi_slash >= 5 ? 2 : 1;
          const snapVessels = [...this.vessels];
          for (const v of snapVessels) {
            if (!v || v.hp <= 0) continue;
            if (this.distPointToSegment(v.x, v.y, s.x1, s.y1, s.x2, s.y2) <= v.radius + 4) {
              this.strikeVessel(v, seamDmg, false);
            }
          }
          if (
            this.guardian &&
            this.distPointToSegment(
              this.guardian.x,
              this.guardian.y,
              s.x1,
              s.y1,
              s.x2,
              s.y2
            ) <= this.guardian.coreR
          ) {
            this.strikeGuardianCore(seamDmg, this.guardian.x, this.guardian.y, false);
          }
        }
      }
    }

    if (this.phase !== 'FLIGHT') return;

    this.flightElapsed += rawDt;

    if (this.launchQueue > 0) {
      const interval = Math.max(
        0.018,
        Math.min(0.042, 0.72 / Math.max(6, this.launchTotalThisVolley))
      );
      this.launchTimer -= dt;
      while (this.launchTimer <= 0 && this.launchQueue > 0) {
        this.launchTimer += interval;
        if (this.pearls.length < MAX_PEARLS) {
          this.spawnSinglePearlFromCradle();
        }
        this.launchQueue -= 1;
      }
    }

    const substeps = 5;
    const subDt = dt / substeps;
    for (let s = 0; s < substeps; s++) {
      this.substepPearls(subDt);
    }

    if (this.bonusPearlsBuffer.length > 0) {
      const space = Math.max(0, MAX_PEARLS - this.pearls.length);
      if (space > 0) {
        this.pearls.push(...this.bonusPearlsBuffer.slice(0, space));
      }
      this.bonusPearlsBuffer.length = 0;
    }

    if (this.vessels.length === 0 && !this.guardian) {
      for (const o of this.orbs) {
        this.collectedOrbPearls += o.bonus;
      }
      this.orbs = [];
      this.pearls = [];
      this.launchQueue = 0;
      this.concludeStageCleared();
      return;
    }

    if (this.pearls.length === 0 && this.launchQueue === 0) {
      this.onVolleySettled();
    }

    this.emitHud();
  }

  private substepPearls(dt: number): void {
    const newTwins: GoldenPearl[] = [];
    const baseDmg = this.getCurrentPearlDamage();
    const splitStep = [0, 24, 20, 16, 13, 10][Math.min(5, this.ranks.bounce_split)] ?? 0;
    const maxSelfSplits = this.ranks.bounce_split >= 3 ? 2 : this.ranks.bounce_split >= 1 ? 1 : 0;

    for (let i = this.pearls.length - 1; i >= 0; i--) {
      const p = this.pearls[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (
        p.ribbon.length === 0 ||
        Math.hypot(
          p.x - p.ribbon[p.ribbon.length - 1].x,
          p.y - p.ribbon[p.ribbon.length - 1].y
        ) > 5.5
      ) {
        p.ribbon.push({ x: p.x, y: p.y });
        if (p.ribbon.length > 8) p.ribbon.shift();
      }

      let bouncedWall = false;
      if (p.x - p.r < 14) {
        p.x = 14 + p.r;
        p.vx = Math.abs(p.vx);
        bouncedWall = true;
      } else if (p.x + p.r > TABLET_W - 14) {
        p.x = TABLET_W - 14 - p.r;
        p.vx = -Math.abs(p.vx);
        bouncedWall = true;
      }
      if (p.y - p.r < 14) {
        p.y = 14 + p.r;
        p.vy = Math.abs(p.vy);
        bouncedWall = true;
      }
      if (bouncedWall) {
        p.bounces++;
      }

      const spd = Math.hypot(p.vx, p.vy);
      if (spd > 1 && Math.abs(p.vy) < 58) {
        p.vy = (p.vy >= 0 ? 1 : -1) * 66;
        const ns = Math.hypot(p.vx, p.vy);
        p.vx = (p.vx / ns) * spd;
        p.vy = (p.vy / ns) * spd;
      }

      // Bottom Cradle / `天球の弦` (`sky_string`)
      if (p.y > CRADLE_Y + 6) {
        if (this.stringBouncesLeft > 0) {
          this.stringBouncesLeft -= 1;
          p.y = CRADLE_Y + 2;
          p.vy = -Math.abs(p.vy);
          this.ripples.push({
            x: p.x,
            y: CRADLE_Y + 4,
            r: 3,
            maxR: 26,
            color: this.skin.gold,
            alpha: 0.75,
            lineWidth: 1.3,
          });
          sound.playPorcelainChime(this.chainCount + 2, false);
          continue;
        }
        if (this.nextCradleX === null) {
          this.nextCradleX = Math.max(44, Math.min(TABLET_W - 44, p.x));
        }
        this.pearls.splice(i, 1);
        continue;
      }

      // Collectible `+1珠` Golden Pearl Orbs
      for (let oIdx = this.orbs.length - 1; oIdx >= 0; oIdx--) {
        const orb = this.orbs[oIdx];
        const dxO = p.x - orb.x;
        const dyO = p.y - orb.y;
        if (dxO * dxO + dyO * dyO <= (orb.r + p.r) * (orb.r + p.r)) {
          this.collectedOrbPearls += orb.bonus;
          this.orbs.splice(oIdx, 1);
          sound.playOrbPickup();
          this.ripples.push({
            x: orb.x,
            y: orb.y,
            r: 4,
            maxR: 44,
            color: this.skin.gold,
            alpha: 0.95,
            lineWidth: 1.8,
          });
          this.spawnWhisper(orb.x, orb.y - 8, `珠 +${orb.bonus}`, this.skin.gold, 12.5);
          this.spawnEphemeralBurstPearls(orb.x, orb.y, orb.bonus);
        }
      }

      // `星輪の紋` (`twin_ring`) — Measured split charges!
      for (let rIdx = 0; rIdx < this.rings.length; rIdx++) {
        const ring = this.rings[rIdx];
        if (ring.charges <= 0 || p.lastRingId === ring.id) continue;
        const dxR = p.x - ring.x;
        const dyR = p.y - ring.y;
        if (dxR * dxR + dyR * dyR <= (ring.r + p.r) * (ring.r + p.r)) {
          p.lastRingId = ring.id;
          ring.charges -= 1;
          ring.flash = 1;
          sound.playAstrolabeTwin();

          if (this.pearls.length + newTwins.length < MAX_PEARLS) {
            const curSpd = Math.hypot(p.vx, p.vy);
            const ang = Math.atan2(p.vy, p.vx);
            p.vx = Math.cos(ang - 0.1) * curSpd;
            p.vy = Math.sin(ang - 0.1) * curSpd;
            newTwins.push({
              id: this.nextId++,
              x: p.x,
              y: p.y,
              vx: Math.cos(ang + 0.1) * curSpd,
              vy: Math.sin(ang + 0.1) * curSpd,
              r: p.r,
              bounces: p.bounces,
              splitCount: p.splitCount,
              nextSplitAt: p.nextSplitAt,
              piercesLeft: p.piercesLeft,
              bonusNextHit: 0,
              ribbon: [],
              lastRingId: ring.id,
            });
          }
        }
      }

      // Procedural Boss Articulated Armor & True Core Collision!
      if (this.guardian && this.collidePearlWithBoss(p, baseDmg)) {
        continue;
      }

      // Porcelain Vessels Collision — bounce off the drawn face, not a hidden circle
      for (let vIdx = 0; vIdx < this.vessels.length; vIdx++) {
        const v = this.vessels[vIdx];
        if (!v || v.hp <= 0) continue;
        const hit = this.vesselContact(p.x, p.y, p.r, v);
        if (hit) {
          const hitDmg = baseDmg + p.bonusNextHit;
          p.bonusNextHit = 0;
          const willKill = v.hp <= hitDmg;
          const shouldPierce = willKill && p.piercesLeft > 0;

          if (!shouldPierce) {
            this.bounceOffNormal(p, hit.nx, hit.ny, hit.qx, hit.qy);
          } else {
            p.piercesLeft -= 1;
            if (this.ranks.piercing_gold >= 4) {
              p.bonusNextHit = 2;
            } else if (this.ranks.piercing_gold >= 3) {
              p.bonusNextHit = 1;
            }
          }

          // `分裂の煌めき`: Controlled self-split
          if (
            splitStep > 0 &&
            p.splitCount < maxSelfSplits &&
            p.bounces >= p.nextSplitAt &&
            this.pearls.length + newTwins.length < MAX_PEARLS
          ) {
            p.splitCount += 1;
            p.nextSplitAt = p.bounces + splitStep;
            const curSpd = Math.hypot(p.vx, p.vy);
            const bAng = Math.atan2(p.vy, p.vx) + 0.24;
            newTwins.push({
              id: this.nextId++,
              x: p.x,
              y: p.y,
              vx: Math.cos(bAng) * curSpd,
              vy: Math.sin(bAng) * curSpd,
              r: p.r,
              bounces: 0,
              splitCount: maxSelfSplits, // Daughter pearls don't chain-split infinitely
              nextSplitAt: 999,
              piercesLeft: p.piercesLeft,
              bonusNextHit: 0,
              ribbon: [],
              lastRingId: p.lastRingId,
            });
          }

          this.spawnImpactSparks(p.x, p.y, v.isVermilion);
          const vid = v.id;
          const vx = v.x;
          const vy = v.y;
          this.strikeVessel(v, hitDmg, v.isVermilion);
          this.checkGoldLightningProc(vx, vy, vid);
          break;
        }
      }
    }

    if (newTwins.length > 0) {
      this.pearls.push(...newTwins);
    }
  }

  /**
   * Articulated Boss Collision:
   * 1. Checks each intact Porcelain Armor Plate / Blooming Lotus Sword-Petal / Obelisk!
   * 2. Checks the central True Core (`真核`)!
   */
  private collidePearlWithBoss(p: GoldenPearl, baseDmg: number): boolean {
    const g = this.guardian;
    if (!g) return false;

    const totalSegs = g.segments.length;
    const dynamicArmorR =
      g.form === 'SERAPHIC_LOTUS'
        ? g.armorR + Math.sin(g.breathPhase) * 10
        : g.armorR;

    // 1. Check destructible outer Porcelain Armor Segments
    for (let k = 0; k < totalSegs; k++) {
      const seg = g.segments[k];
      if (seg.hp <= 0) continue;

      const ang =
        (k % 2 === 1 && g.form === 'ARMILLARY_THRONE'
          ? g.rotSecondary + Math.PI / totalSegs
          : g.rotPrimary) +
        (k / totalSegs) * Math.PI * 2;
      const sx = g.x + Math.cos(ang) * dynamicArmorR;
      const sy = g.y + Math.sin(ang) * dynamicArmorR;
      const hitRadius = g.form === 'ECLIPSE_MONOLITH' ? 16.5 : 14.5;

      const dist = Math.hypot(p.x - sx, p.y - sy);
      if (dist <= hitRadius + p.r) {
        const nx = (p.x - sx) / Math.max(0.1, dist);
        const ny = (p.y - sy) / Math.max(0.1, dist);
        const curSpd = Math.hypot(p.vx, p.vy);
        p.x = sx + nx * (hitRadius + p.r + 1);
        p.y = sy + ny * (hitRadius + p.r + 1);
        p.vx = nx * curSpd;
        p.vy = ny * curSpd;
        p.bounces++;

        const hitDmg = baseDmg + p.bonusNextHit;
        p.bonusNextHit = 0;
        seg.hp -= hitDmg;
        seg.hitFlash = 1;
        seg.scalePop = 1.15;

        this.incrementChain(p.x, p.y);
        this.spawnImpactSparks(p.x, p.y, false);
        sound.playPorcelainChime(this.chainCount, false);

        if (seg.hp <= 0) {
          // ARMOR SEGMENT SHATTERED! Permanently opens a breach & shocks the True Core!
          this.burstPorcelainShards(sx, sy, 14, true);
          this.ripples.push({
            x: sx,
            y: sy,
            r: 5,
            maxR: 54,
            color: this.skin.gold,
            alpha: 0.95,
            lineWidth: 2,
          });
          sound.playPorcelainShatter(true);
          this.spawnWhisper(sx, sy - 8, '欠けた', this.skin.gold, 12);
          this.spawnEphemeralBurstPearls(sx, sy, 2);
          const fractureShock = Math.max(8, Math.round(g.maxHp * 0.09));
          this.strikeGuardianCore(fractureShock, g.x, g.y, false);
        }
        this.checkGoldLightningProc(sx, sy, -1);
        return true;
      }
    }

    // 2. Check True Core (`真核`)!
    const distCore = Math.hypot(p.x - g.x, p.y - g.y);
    if (distCore <= g.coreR + p.r) {
      const nx = (p.x - g.x) / Math.max(0.1, distCore);
      const ny = (p.y - g.y) / Math.max(0.1, distCore);
      const curSpd = Math.hypot(p.vx, p.vy);
      p.x = g.x + nx * (g.coreR + p.r + 1.5);
      p.y = g.y + ny * (g.coreR + p.r + 1.5);
      p.vx = nx * curSpd;
      p.vy = ny * curSpd;
      p.bounces++;

      const hitDmg = baseDmg + p.bonusNextHit;
      p.bonusNextHit = 0;
      this.strikeGuardianCore(hitDmg, p.x, p.y, true);
      this.checkGoldLightningProc(p.x, p.y, -1);
      return true;
    }

    return false;
  }

  private checkGoldLightningProc(originX: number, originY: number, excludeId: number): void {
    const rank = this.ranks.gold_lightning;
    if (rank <= 0) return;

    this.lightningHitCounter += 1;
    const triggerEvery = [999, 16, 14, 12, 10, 8][Math.min(5, rank)];
    if (this.lightningHitCounter < triggerEvery) return;
    this.lightningHitCounter = 0;

    const maxTargets = [0, 1, 1, 2, 3, 4][Math.min(5, rank)];
    const boltDmg = [0, 2, 4, 4, 6, 9][Math.min(5, rank)];

    const candidates = this.vessels
      .filter((v) => v.hp > 0 && v.id !== excludeId)
      .sort(
        (a, b) =>
          Math.hypot(a.x - originX, a.y - originY) - Math.hypot(b.x - originX, b.y - originY)
      )
      .slice(0, maxTargets);

    if (candidates.length === 0 && !this.guardian) return;

    sound.playGoldLightning();
    let prevX = originX;
    let prevY = originY;
    const pts: Array<{ x: number; y: number }> = [{ x: prevX, y: prevY }];

    for (const tgt of candidates) {
      const midX = (prevX + tgt.x) * 0.5 + (Math.random() - 0.5) * 18;
      const midY = (prevY + tgt.y) * 0.5 + (Math.random() - 0.5) * 18;
      pts.push({ x: midX, y: midY }, { x: tgt.x, y: tgt.y });
      prevX = tgt.x;
      prevY = tgt.y;
      this.strikeVessel(tgt, boltDmg, false);
    }

    if (candidates.length < maxTargets && this.guardian) {
      const gx = this.guardian.x;
      const gy = this.guardian.y;
      pts.push(
        { x: (prevX + gx) * 0.5 + (Math.random() - 0.5) * 20, y: (prevY + gy) * 0.5 },
        { x: gx, y: gy }
      );
      this.strikeGuardianCore(boltDmg, gx, gy, false);
    }

    this.lightningArcs.push({
      pts,
      life: 0.24,
      maxLife: 0.24,
    });
  }

  private strikeVessel(v: PorcelainVessel, dmg: number, isVermilionAccent: boolean): void {
    if (!v || v.hp <= 0) return;

    v.hp -= dmg;
    v.hitFlash = 1;
    v.scalePop = 1.15;

    this.incrementChain(v.x, v.y);
    sound.playPorcelainChime(this.chainCount, isVermilionAccent);

    if (v.hp <= 0) {
      const idx = this.vessels.indexOf(v);
      if (idx < 0) return;
      const vx = v.x;
      const vy = v.y;
      const wasVermilion = v.isVermilion;
      this.vessels.splice(idx, 1);

      this.burstPorcelainShards(vx, vy, wasVermilion ? 12 : 7, wasVermilion);
      sound.playPorcelainShatter(wasVermilion);

      // Rank 4+ `kintsugi_slash`: Recharges +1 slash every 8 shattered vessels!
      if (this.ranks.kintsugi_slash >= 4) {
        this.killsSinceRecharge += 1;
        if (this.killsSinceRecharge >= 8) {
          this.killsSinceRecharge = 0;
          if (this.slashesLeft < this.maxSlashes + 1) {
            this.slashesLeft += 1;
            this.spawnWhisper(vx, vy - 10, '一閃 もどった', this.skin.gold, 12);
          }
        }
      }

      if (wasVermilion) {
        this.hitStopTimer = Math.max(this.hitStopTimer, 0.016);
        const waveDmg = Math.max(2, Math.round(2 + this.stage * 0.28));
        this.unleashKintsugiWave(vx, vy, 58, waveDmg, this.skin.vermilion);
      } else if (this.ranks.chain_burst > 0) {
        const cbRank = this.ranks.chain_burst;
        if (cbRank >= 4) {
          this.spawnEphemeralBurstPearls(vx, vy, cbRank >= 5 ? 2 : 1);
        }
        const echoDmg = [0, 1, 2, 4, 6, 9][Math.min(5, cbRank)];
        const echoR = cbRank >= 3 ? 86 : 70;
        this.unleashKintsugiWave(vx, vy, echoR, echoDmg, this.skin.gold);
      }
    }
  }

  private unleashKintsugiWave(
    cx: number,
    cy: number,
    radius: number,
    dmg: number,
    color: string
  ): void {
    this.ripples.push({
      x: cx,
      y: cy,
      r: 8,
      maxR: radius,
      color,
      alpha: 0.88,
      lineWidth: 1.9,
    });
    this.shakeTimer = Math.max(this.shakeTimer, 0.12);
    this.shakeAmp = Math.max(this.shakeAmp, 4);

    if (
      this.guardian &&
      Math.hypot(this.guardian.x - cx, this.guardian.y - cy) <= radius + this.guardian.coreR
    ) {
      this.strikeGuardianCore(dmg, this.guardian.x, this.guardian.y, false);
    }

    const targets = [...this.vessels];
    for (const other of targets) {
      if (!other || other.hp <= 0) continue;
      if (Math.hypot(other.x - cx, other.y - cy) <= radius + other.radius * 0.5) {
        this.strikeVessel(other, dmg, false);
      }
    }
  }

  private strikeGuardianCore(
    dmg: number,
    hx: number,
    hy: number,
    isDirectCore: boolean
  ): void {
    const g = this.guardian;
    if (!g) return;

    g.hp -= dmg;
    g.hitFlash = 1;
    g.scalePop = isDirectCore ? 1.09 : 1.04;

    this.incrementChain(hx, hy);
    sound.playPorcelainChime(this.chainCount, isDirectCore);
    this.spawnImpactSparks(hx, hy, true);

    if (g.hp <= 0) {
      const gx = g.x;
      const gy = g.y;
      this.guardian = null;
      this.vessels = [];
      this.hitStopTimer = 0.09;
      this.slowMoTimer = 0.38;
      this.shakeTimer = 0.36;
      this.shakeAmp = 8.5;
      this.veilAlpha = 0.45;
      this.veilColor = this.skin.pearlCore;

      this.burstPorcelainShards(gx, gy, 36, true);
      this.ripples.push({
        x: gx,
        y: gy,
        r: 12,
        maxR: 220,
        color: this.skin.gold,
        alpha: 1,
        lineWidth: 3,
      });
      this.ripples.push({
        x: gx,
        y: gy,
        r: 4,
        maxR: 150,
        color: this.skin.vermilion,
        alpha: 0.95,
        lineWidth: 2,
      });
      sound.playPorcelainShatter(true);
    }
  }

  private incrementChain(x?: number, y?: number): void {
    this.chainCount += 1;
    const milestone = MAGNITUDE_MILESTONES.includes(this.chainCount);
    this.chainPopScale = milestone ? 1.72 : Math.max(this.chainPopScale, 1.18);
    this.comboFlash = Math.max(this.comboFlash, milestone ? 1 : 0.38);
    if (this.chainCount > this.longestChainInRun) {
      this.longestChainInRun = this.chainCount;
    }

    if (x != null && y != null) {
      if (this.lastHit) {
        const dist = Math.hypot(x - this.lastHit.x, y - this.lastHit.y);
        this.stitches.push({
          x1: this.lastHit.x,
          y1: this.lastHit.y,
          x2: x,
          y2: y,
          life: milestone ? 2.1 : Math.min(1.5, 0.65 + dist / 260),
          maxLife: milestone ? 2.1 : 1.35,
        });
        if (this.stitches.length > 56) this.stitches.shift();
      }
      this.lastHit = { x, y };
      this.ripples.push({
        x,
        y,
        r: 2,
        maxR: milestone ? 28 : 14,
        color: this.skin.gold,
        alpha: 0.85,
        lineWidth: 0.9,
      });
      const burst = milestone ? 0 : 5;
      for (let i = 0; i < burst; i++) {
        const ang = (i / burst) * Math.PI * 2 + this.timeSec;
        this.sparks.push({
          x,
          y,
          vx: Math.cos(ang) * 70,
          vy: Math.sin(ang) * 70,
          life: 0.22,
          maxLife: 0.28,
          isVermilion: false,
        });
      }
    }

    if (milestone) {
      this.comboFlash = 0.42;
      this.hitStopTimer = Math.max(this.hitStopTimer, this.chainCount >= 21 ? 0.08 : 0.045);
      this.shakeTimer = Math.max(this.shakeTimer, 0.18);
      this.shakeAmp = Math.max(this.shakeAmp, this.chainCount >= 34 ? 6 : 3.5);
      this.veilAlpha = Math.max(this.veilAlpha, 0.12);
      this.veilColor = this.skin.gold;
      if (x != null && y != null) {
        const mag = magnitudeOf(this.chainCount);
        this.ripples.push({
          x,
          y,
          r: 8,
          maxR: 90 + this.chainCount,
          color: this.skin.gold,
          alpha: 1,
          lineWidth: 2.4,
        });
        this.ripples.push({
          x,
          y,
          r: 3,
          maxR: 46,
          color: this.skin.ink,
          alpha: 0.7,
          lineWidth: 1,
        });
        this.spawnWhisper(x, y - 18, mag.jp, this.skin.gold, this.chainCount >= 34 ? 16 : 13);
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2;
          this.sparks.push({
            x,
            y,
            vx: Math.cos(ang) * (80 + this.chainCount),
            vy: Math.sin(ang) * (80 + this.chainCount),
            life: 0.32,
            maxLife: 0.4,
            isVermilion: false,
          });
        }
      }
      if (this.chainCount >= 21) sound.playKintsugiConvergence();
      else sound.playAstrolabeTwin();
    }
  }

  private onVolleySettled(): void {
    this.fastForward = false;
    if (this.nextCradleX !== null) {
      this.cradleX = this.nextCradleX;
    }

    if (this.vessels.length === 0 && !this.guardian) {
      for (const o of this.orbs) this.collectedOrbPearls += o.bonus;
      this.orbs = [];
      this.concludeStageCleared();
      return;
    }

    let breached = false;
    let bossBreached = false;

    for (let i = this.vessels.length - 1; i >= 0; i--) {
      const v = this.vessels[i];
      if (v.anchored) continue;
      v.targetY += TURN_DESCENT_Y;
      if (v.targetY + v.radius * 0.5 >= SEAL_LINE_Y) {
        breached = true;
        this.burstPorcelainShards(v.x, v.y, 9, true);
        this.vessels.splice(i, 1);
      }
    }

    for (let i = this.orbs.length - 1; i >= 0; i--) {
      this.orbs[i].targetY += TURN_DESCENT_Y;
      if (this.orbs[i].targetY >= SEAL_LINE_Y) {
        this.orbs.splice(i, 1);
      }
    }

    // Boss inexorably descends toward the Sacred Seal Line every turn!
    if (this.guardian) {
      const g = this.guardian;
      g.targetY += BOSS_DESCENT_Y;
      const breachCenterY = SEAL_LINE_Y - g.armorR;
      if (g.targetY >= breachCenterY) {
        breached = true;
        bossBreached = true;
      }
    }

    const ringCap = this.getRingChargesPerTurn();
    for (const r of this.rings) {
      r.charges = ringCap;
    }

    if (breached) {
      this.integrity -= 1;
      this.shakeTimer = 0.32;
      this.shakeAmp = 7.5;
      this.veilAlpha = 0.36;
      this.veilColor = this.skin.vermilion;
      sound.playPorcelainShatter(true);

      if (this.integrity <= 0) {
        this.phase = 'SHATTERED';
        this.emitHud();
        this.cb.onVesselBroken(this.stage, this.longestChainInRun);
        return;
      }

      // If Integrity remains after a Boss breach, the Sacrificial Seal blasts the Boss back 4 steps!
      if (bossBreached && this.guardian) {
        const g = this.guardian;
        g.targetY = SEAL_LINE_Y - g.armorR - BOSS_DESCENT_Y * 4;
        this.ripples.push({
          x: g.x,
          y: SEAL_LINE_Y,
          r: 14,
          maxR: 180,
          color: this.skin.vermilion,
          alpha: 0.95,
          lineWidth: 2.6,
        });
        this.spawnWhisper(g.x, SEAL_LINE_Y - 24, '敷居が弾いた', '#FF8E82', 14);
      }
    } else if (this.guardian) {
      const turnsLeft = this.getGuardianTurnsUntilBreach();
      if (turnsLeft === 2) {
        this.spawnWhisper(this.guardian.x, this.guardian.targetY + 72, '敷居まで あと2手', this.skin.gold, 13);
      } else if (turnsLeft === 1) {
        this.spawnWhisper(this.guardian.x, this.guardian.targetY + 72, 'いま、敷居の前', '#FF7A6E', 14);
      }
    }

    if (this.vessels.length === 0 && !this.guardian) {
      this.concludeStageCleared();
      return;
    }

    this.phase = 'AIMING';
    if (this.ranks.kintsugi_slash >= 2) {
      this.slashesLeft = this.maxSlashes;
    }
    this.emitHud();
    this.persistRun();
  }

  private concludeStageCleared(): void {
    this.fastForward = false;
    if (isConstellationStage(this.stage)) {
      this.stageClearBonusPearls += 1;
    }
    sound.playActComplete();

    const bossJustCleared = isBossStage(this.stage);
    this.pendingAwakening = isAwakeningStage(this.stage);
    this.awakeningSeals = this.pendingAwakening ? 0 : (this.stage % 3);

    this.phase = 'CLEARED';
    this.clearHoldMax = bossJustCleared ? 16 : isConstellationStage(this.stage) ? 14 : 10;
    this.transitionTimer = this.clearHoldMax;
    this.clearBurstTimer = 0.9;
    this.shakeTimer = Math.max(this.shakeTimer, 0.22);
    this.shakeAmp = Math.max(this.shakeAmp, bossJustCleared ? 7 : 4);
    this.veilAlpha = bossJustCleared ? 0.28 : 0.16;
    this.veilColor = this.skin.pearlCore;

    for (let i = 0; i < (bossJustCleared ? 4 : 2); i++) {
      this.ripples.push({
        x: TABLET_W * 0.5 + (Math.random() - 0.5) * 40,
        y: TABLET_H * 0.42 + (Math.random() - 0.5) * 24,
        r: 10 + i * 6,
        maxR: 120 + i * 40,
        color: i % 2 === 0 ? this.skin.gold : this.skin.pearlCore,
        alpha: 0.9,
        lineWidth: 2.2 - i * 0.3,
      });
    }
    this.burstPorcelainShards(TABLET_W * 0.5, TABLET_H * 0.4, bossJustCleared ? 28 : 16, bossJustCleared);
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2;
      this.sparks.push({
        x: TABLET_W * 0.5,
        y: TABLET_H * 0.4,
        vx: Math.cos(ang) * (70 + Math.random() * 90),
        vy: Math.sin(ang) * (70 + Math.random() * 90) - 30,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        isVermilion: false,
      });
    }

    this.cb.onStageCleared({
      stage: this.stage,
      title: this.currentBlueprint.title,
      latin: this.currentBlueprint.latin,
      lucida: this.currentBlueprint.lucida,
      season: this.currentBlueprint.season,
      isBoss: bossJustCleared,
      pearlCount: this.getBasePearlCount(),
      chain: this.chainCount,
      longestChain: this.longestChainInRun,
    });
    this.emitHud();
  }

  private finishClearHold(): void {
    if (this.pendingAwakening) {
      this.pendingAwakening = false;
      this.phase = 'INTERLUDE';
      this.emitHud();
      this.cb.onAwakeningReady(this.stage, this.longestChainInRun);
      return;
    }
    this.stage += 1;
    this.setupStage(this.stage);
  }

  // ============================================================================
  // VISUAL PARTICLES & HELPERS
  // ============================================================================

  private spawnImpactSparks(x: number, y: number, isVermilion: boolean): void {
    if (this.sparks.length > 210) return;
    const count = isVermilion ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 115;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.2 + Math.random() * 0.16,
        maxLife: 0.36,
        isVermilion: isVermilion && i === 0,
      });
    }
  }

  private burstPorcelainShards(
    x: number,
    y: number,
    count: number,
    includeVermilion: boolean
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.shards.length > 180) break;
      const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const spd = 55 + Math.random() * 165;
      this.shards.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 24,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 9,
        size: 3.2 + Math.random() * 5.2,
        isGold: i % 2 === 0,
        isVermilion: includeVermilion && i % 4 === 1,
        life: 0.42 + Math.random() * 0.38,
        maxLife: 0.8,
      });
    }
  }

  private spawnWhisper(
    x: number,
    y: number,
    text: string,
    color: string,
    size: number
  ): void {
    this.callouts.push({
      x,
      y,
      vy: -26,
      text,
      color,
      size,
      life: 0.9,
      maxLife: 0.9,
    });
  }

  private updateVisualParticles(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }

    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      this.lightningArcs[i].life -= dt;
      if (this.lightningArcs[i].life <= 0) this.lightningArcs.splice(i, 1);
    }

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 170 * dt;
      s.rot += s.vRot * dt;
      s.life -= dt;
      if (s.life <= 0) this.shards.splice(i, 1);
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.r += (r.maxR - r.r) * Math.min(1, dt * 9.0);
      r.alpha -= dt * 2.2;
      if (r.alpha <= 0) this.ripples.splice(i, 1);
    }

    for (let i = this.seams.length - 1; i >= 0; i--) {
      this.seams[i].life -= dt;
      if (this.seams[i].life <= 0) this.seams.splice(i, 1);
    }

    for (let i = this.stitches.length - 1; i >= 0; i--) {
      this.stitches[i].life -= dt;
      if (this.stitches[i].life <= 0) this.stitches.splice(i, 1);
    }

    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.y += c.vy * dt;
      c.life -= dt;
      if (c.life <= 0) this.callouts.splice(i, 1);
    }
  }

  private distPointToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private emitHud(): void {
    const badges: ActiveAbilityBadge[] = [];
    for (const def of ABILITIES) {
      const r = this.ranks[def.id] ?? 0;
      if (r > 0) {
        badges.push({ id: def.id, shortCrest: def.shortCrest, rank: r });
      }
    }

    this.cb.onStateChange({
      phase: this.phase,
      stage: this.stage,
      stageLabel: `第${this.stage}図`,
      stageTitle: this.currentBlueprint.title,
      awakeningSeals: this.awakeningSeals,
      sealsNeeded: SEALS_PER_AWAKENING,
      vesselsIntegrity: this.integrity,
      maxIntegrity: this.maxIntegrity,
      hasSlashAbility: this.ranks.kintsugi_slash > 0,
      slashesLeft: this.slashesLeft,
      maxSlashes: this.maxSlashes,
      fastForward: this.fastForward,
      chainCount: this.chainCount,
      activePearlCount: this.pearls.length + this.launchQueue,
      basePearlCount: this.getBasePearlCount(),
      guardianTitle: this.guardian ? this.guardian.title : null,
      guardianSubtitle: this.guardian ? this.guardian.subtitle : null,
      guardianRatio: this.guardian ? Math.max(0, this.guardian.hp / this.guardian.maxHp) : 0,
      guardianTurnsLeft: this.getGuardianTurnsUntilBreach(),
      acquiredBadges: badges,
    });
  }

  // ============================================================================
  // MUSEUM-GRADE URUSHI × HAKUJI × PROCEDURAL BOSS RENDERER
  // ============================================================================

  private render(): void {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeTimer > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeAmp,
        (Math.random() - 0.5) * this.shakeAmp
      );
    }

    ctx.fillStyle = this.skin.bg;
    ctx.fillRect(0, 0, TABLET_W, TABLET_H);

    if (this.skin.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      ctx.globalAlpha = this.skin.bgAlpha;
      ctx.drawImage(this.bgImage, 0, 0, TABLET_W, TABLET_H);
      ctx.globalAlpha = 1;
    }

    if (false) {
      ctx.strokeStyle = this.skin.goldSoft;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(28, 36);
      ctx.lineTo(TABLET_W - 28, 36);
      ctx.moveTo(28, TABLET_H - 36);
      ctx.lineTo(TABLET_W - 28, TABLET_H - 36);
      ctx.stroke();
    } else if (false) {
      ctx.strokeStyle = 'rgba(232, 164, 40, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, TABLET_W - 20, TABLET_H - 20);
      ctx.strokeStyle = 'rgba(180, 170, 150, 0.16)';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, TABLET_W - 12, TABLET_H - 12);
    } else {
      ctx.strokeStyle = 'rgba(44, 36, 22, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, TABLET_W - 28, TABLET_H - 28);
      ctx.strokeRect(18, 18, TABLET_W - 36, TABLET_H - 36);
    }

    for (const m of this.dust) {
      ctx.fillStyle = this.skin.dust;
      ctx.globalAlpha = m.alpha * (0.65 + 0.35 * Math.sin(this.timeSec * 2 + m.phase));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Shop threshold (`敷居`) — solid plank, not a HUD hairline
    if (this.phase !== 'PROLOGUE') {
      const bossTurns = this.getGuardianTurnsUntilBreach();
      const isUrgent = bossTurns !== null && bossTurns <= 2;
      const pulse = isUrgent ? 0.72 + 0.28 * Math.sin(this.timeSec * 6.5) : 0.42;
      ctx.save();
      if (false) {
        ctx.strokeStyle = isUrgent ? `rgba(180, 60, 50, ${pulse.toFixed(2)})` : this.skin.goldSoft;
        ctx.lineWidth = isUrgent ? 1.2 : 0.7;
        ctx.beginPath();
        ctx.moveTo(24, SEAL_LINE_Y);
        ctx.lineTo(TABLET_W - 24, SEAL_LINE_Y);
        ctx.stroke();
      } else if (false) {
        ctx.strokeStyle = isUrgent ? `rgba(255, 90, 60, ${pulse.toFixed(2)})` : 'rgba(232, 164, 40, 0.55)';
        ctx.shadowColor = this.skin.gold;
        ctx.shadowBlur = isUrgent ? 10 : 4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, SEAL_LINE_Y);
        ctx.lineTo(TABLET_W - 18, SEAL_LINE_Y);
        ctx.stroke();
      } else {
        ctx.strokeStyle = isUrgent ? `rgba(122, 36, 28, ${pulse.toFixed(2)})` : 'rgba(44, 36, 22, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(22, SEAL_LINE_Y);
        ctx.lineTo(TABLET_W - 22, SEAL_LINE_Y);
        ctx.stroke();
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.moveTo(22, SEAL_LINE_Y + 3);
        ctx.lineTo(TABLET_W - 22, SEAL_LINE_Y + 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Bottom Horizon `天球の弦` (`sky_string`)
    if (this.stringBouncesLeft > 0) {
      ctx.save();
      ctx.strokeStyle = this.skin.gold;
      ctx.shadowColor = this.skin.gold;
      ctx.shadowBlur = false ? 10 : false ? 0 : 3;
      ctx.lineWidth = false ? 1 : 1.6;
      ctx.beginPath();
      ctx.moveTo(22, CRADLE_Y + 4);
      ctx.lineTo(TABLET_W - 22, CRADLE_Y + 4);
      ctx.stroke();
      ctx.restore();
    }

    for (const o of this.orbs) {
      const pulse = 1 + Math.sin(o.phase) * 0.08;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.scale(pulse, pulse);
      if (false) {
        ctx.drawImage(this.pearlGlowSprite, -15, -15, 30, 30);
      }
      if (this.skin.orbFill !== 'transparent') {
        ctx.fillStyle = this.skin.orbFill;
        ctx.beginPath();
        ctx.arc(0, 0, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = this.skin.orbStroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, o.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = this.skin.orbText;
      ctx.font = this.font('600', 16, false);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${o.bonus}`, 0, 0.5);
      ctx.restore();
    }

    for (const r of this.rings) {
      if (r.charges <= 0) continue;
      ctx.save();
      ctx.translate(r.x, r.y);

      ctx.save();
      ctx.rotate(r.phase);
      ctx.strokeStyle = r.flash > 0 ? this.skin.pearlCore : this.skin.gold;
      ctx.shadowColor = this.skin.gold;
      ctx.shadowBlur = false ? 0 : 6 + r.flash * 10;
      ctx.lineWidth = false ? 1 : 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, r.r - 4.5, 0, Math.PI * 2);
      ctx.stroke();

      const ticks = true ? 8 : 4;
      for (let t = 0; t < ticks; t++) {
        const a = (t * Math.PI * 2) / ticks;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r.r - 6.5), Math.sin(a) * (r.r - 6.5));
        ctx.lineTo(Math.cos(a) * (r.r + 3.5), Math.sin(a) * (r.r + 3.5));
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = r.flash > 0 ? this.skin.pearlCore : this.skin.gold;
      ctx.font = this.font('500', 11, false);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`×${r.charges}`, 0, 0.5);
      ctx.restore();
    }

    if (this.figureLinks.length > 0) {
      ctx.save();
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = 'rgba(44, 36, 22, 0.38)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (const [a, b] of this.figureLinks) {
        const va = this.vessels.find((v) => v.id === a);
        const vb = this.vessels.find((v) => v.id === b);
        if (!va || !vb) continue;
        ctx.moveTo(va.x, va.y);
        ctx.lineTo(vb.x, vb.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (this.stitches.length > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const st of this.stitches) {
        const a = Math.max(0, st.life / st.maxLife);
        ctx.strokeStyle = this.skin.gold;
        ctx.globalAlpha = a * 0.35;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(st.x1, st.y1);
        ctx.lineTo(st.x2, st.y2);
        ctx.stroke();
        ctx.globalAlpha = 0.55 + a * 0.45;
        ctx.lineWidth = 0.85;
        ctx.setLineDash([4, 3]);
        ctx.lineDashOffset = -this.timeSec * 28;
        ctx.beginPath();
        ctx.moveTo(st.x1, st.y1);
        ctx.lineTo(st.x2, st.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = this.skin.gold;
        this.traceChartStar(ctx, st.x1, st.y1, 2.6 + a, 4);
        ctx.fill();
        this.traceChartStar(ctx, st.x2, st.y2, 2.6 + a, 4);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.phase === 'AIMING' || (this.phase === 'PROLOGUE' && this.isDrawingThread)) {
      this.computeAimPath();
    } else {
      this.aimContact = null;
      this.aimPts = [];
    }

    for (const v of this.vessels) {
      this.drawPorcelainVessel(ctx, v);
    }

    // PROCEDURAL ARCHITECTURAL BOSS!
    if (this.guardian) {
      this.drawProceduralBoss(ctx, this.guardian);
    }

    // Lingering Kintsugi Gold Seams
    for (const s of this.seams) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.skin.gold;
      ctx.lineWidth = false ? 1 : 1.7;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Golden Lightning Arcs
    for (const arc of this.lightningArcs) {
      if (arc.pts.length < 2) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, arc.life / arc.maxLife);
      ctx.strokeStyle = this.skin.pearlCore;
      ctx.shadowColor = this.skin.gold;
      ctx.shadowBlur = false ? 0 : 10;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(arc.pts[0].x, arc.pts[0].y);
      for (let i = 1; i < arc.pts.length; i++) {
        ctx.lineTo(arc.pts[i].x, arc.pts[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (this.phase === 'AIMING' || (this.phase === 'PROLOGUE' && this.isDrawingThread)) {
      this.drawGoldenAimThread(ctx);
    }

    this.drawBottomCradle(ctx);

    // Batched Golden Pearls & Additive Sunlight Bloom
    if (this.pearls.length > 0) {
      ctx.save();
      ctx.strokeStyle = this.skin.pearlTrail;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = false ? 0.7 : 0.5;
      ctx.lineWidth = false ? 1.4 : 2.2;
      ctx.beginPath();
      for (let i = 0; i < this.pearls.length; i++) {
        const rib = this.pearls[i].ribbon;
        if (rib.length < 2) continue;
        ctx.moveTo(rib[0].x, rib[0].y);
        for (let k = 1; k < rib.length; k++) {
          ctx.lineTo(rib[k].x, rib[k].y);
        }
      }
      ctx.stroke();
      ctx.restore();

      const sprSize = this.skin.glowSize;
      const halfSpr = sprSize * 0.5;
      ctx.save();
      if (this.skin.additivePearls) ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.pearls.length; i++) {
        const p = this.pearls[i];
        ctx.drawImage(this.pearlGlowSprite, p.x - halfSpr, p.y - halfSpr, sprSize, sprSize);
      }
      ctx.restore();

      ctx.fillStyle = this.skin.pearlCore;
      ctx.strokeStyle = this.skin.ink;
      ctx.lineWidth = 0.85;
      for (let i = 0; i < this.pearls.length; i++) {
        const p = this.pearls[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Sparks, Ripples, Shards & Whispers
    if (this.sparks.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.sparks.length; i++) {
        const sp = this.sparks[i];
        ctx.globalAlpha = Math.max(0, sp.life / sp.maxLife);
        ctx.strokeStyle = sp.isVermilion ? this.skin.vermilion : this.skin.spark;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x - sp.vx * 0.035, sp.y - sp.vy * 0.035);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const rp of this.ripples) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, rp.alpha);
      ctx.strokeStyle = rp.color;
      ctx.lineWidth = rp.lineWidth * 0.75;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const sh of this.shards) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sh.life / sh.maxLife);
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.rot);
      ctx.fillStyle = sh.isVermilion
        ? this.skin.vermilion
        : sh.isGold
        ? this.skin.shardGold
        : this.skin.ink;
      this.traceChartStar(ctx, 0, 0, sh.size * 0.7, sh.isGold ? 4 : 5);
      ctx.fill();
      ctx.restore();
    }

    for (const c of this.callouts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.life / c.maxLife);
      ctx.font = this.font('500', c.size);
      ctx.textAlign = 'center';
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, c.x, c.y);
      ctx.restore();
    }

    this.drawComboAstrolabe(ctx);

    if (this.phase === 'CLEARED') {
      const pop = Math.min(1, 1.2 - this.transitionTimer * 0.35);
      ctx.save();
      this.drawStageFigure(ctx, TABLET_W * 0.5, TABLET_H * 0.34, 240, 170, 0.55 + 0.4 * pop);
      ctx.globalAlpha = 0.9 * Math.min(1, pop);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.skin.ink;
      ctx.font = this.font('400', 22);
      ctx.fillText(this.currentBlueprint.title, TABLET_W * 0.5, TABLET_H * 0.52);
      ctx.restore();
    }

    if (this.chapterBannerTimer > 0 && this.phase === 'AIMING') {
      const maxT = this.currentBlueprint.whisperHint ? 3.6 : 2.2;
      const a =
        Math.min(1, this.chapterBannerTimer * 1.2) *
        Math.min(1, (maxT - this.chapterBannerTimer) * 3.5 + 0.2);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(0.96, a));
      ctx.textAlign = 'center';
      ctx.fillStyle = this.skin.gold;
      ctx.font = this.font('400', 11, false);
      ctx.fillText(`第${this.stage}図`, TABLET_W * 0.5, 470);
      ctx.fillStyle = this.skin.ink;
      ctx.font = this.font('400', 22);
      ctx.fillText(this.currentBlueprint.title, TABLET_W * 0.5, 498);
      if (this.currentBlueprint.whisperHint) {
        ctx.fillStyle = 'rgba(44,36,22,0.62)';
        ctx.font = this.font('400', 11);
        ctx.fillText(this.currentBlueprint.whisperHint, TABLET_W * 0.5, 522);
      }
      ctx.restore();
    }

    if (this.veilAlpha > 0) {
      ctx.fillStyle = this.veilColor;
      ctx.globalAlpha = this.veilAlpha;
      ctx.fillRect(0, 0, TABLET_W, TABLET_H);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // ============================================================================
  // 3 BESPOKE PROCEDURAL SACRED KARAKURI BOSS ARCHITECTURES
  // ============================================================================

  private drawProceduralBoss(ctx: CanvasRenderingContext2D, g: GuardianEntity): void {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.scale(g.scalePop, g.scalePop);

    // 1. Ambient Corona Aura Behind Boss
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const auraScale = 1 + Math.sin(g.breathPhase * 1.6) * 0.06 + g.hitFlash * 0.14;
    const auraSize = 156 * auraScale;
    ctx.drawImage(this.coronaGlowSprite, -auraSize * 0.5, -auraSize * 0.5, auraSize, auraSize);
    ctx.restore();

    if (g.form === 'ECLIPSE_MONOLITH') {
      this.drawBossEclipseMonolith(ctx, g);
    } else if (g.form === 'SERAPHIC_LOTUS') {
      this.drawBossSeraphicLotus(ctx, g);
    } else {
      this.drawBossArmillaryThrone(ctx, g);
    }

    ctx.restore();
  }

  /**
   * BOSS I (Stage 5): 『蝕天の機巧 — ECLIPSE SERAPH』
   * Sweeping 6-Winged 24K Gold Filigree + 6 Faceted Hakuji Greatsword Relics + Tracking Eclipse Eye!
   */
  private drawBossEclipseMonolith(ctx: CanvasRenderingContext2D, g: GuardianEntity): void {
    const wingLift = Math.sin(g.breathPhase * 1.1) * 0.08;

    // A. Sweeping 6-Winged Golden Seraphim Silhouette (`黄金の六翼`)
    for (const side of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        ctx.save();
        ctx.scale(side, 1);
        ctx.rotate((-0.34 + w * 0.34 + wingLift * (w + 1) * 0.5));
        const len = 118 - w * 14;
        ctx.beginPath();
        ctx.moveTo(28, -4);
        ctx.quadraticCurveTo(len * 0.58, -22, len, -8);
        ctx.quadraticCurveTo(len * 0.65, 4, 30, 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(230, 184, 92, 0.09)';
        ctx.fill();
        ctx.strokeStyle = w === 0 ? 'rgba(242, 196, 100, 0.68)' : 'rgba(230, 184, 92, 0.38)';
        ctx.lineWidth = w === 0 ? 1.3 : 0.9;
        ctx.stroke();

        // Inner feather vein
        ctx.beginPath();
        ctx.moveTo(34, -1);
        ctx.quadraticCurveTo(len * 0.55, -10, len * 0.88, -6);
        ctx.strokeStyle = 'rgba(230, 184, 92, 0.28)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
      }
    }

    // B. Sacred Astrolabe Halo & 4 Long Cardinal Spears
    ctx.save();
    ctx.rotate(g.rotSecondary * 0.35);
    ctx.strokeStyle = 'rgba(230, 184, 92, 0.32)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.save();
      ctx.rotate(a);
      ctx.strokeStyle = 'rgba(242, 196, 100, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.lineTo(4, -54);
      ctx.lineTo(0, -96);
      ctx.lineTo(-4, -54);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // C. Counter-Rotating Golden Octagram Filigree
    ctx.save();
    ctx.rotate(g.rotSecondary);
    ctx.strokeStyle = 'rgba(230, 184, 92, 0.5)';
    ctx.lineWidth = 1.0;
    for (let sq = 0; sq < 2; sq++) {
      ctx.save();
      ctx.rotate((sq * Math.PI) / 4);
      ctx.strokeRect(-35, -35, 70, 70);
      ctx.restore();
    }
    ctx.restore();

    // D. 6 Sculpted Faceted Hakuji Porcelain Greatsword Relics (Individually Destructible!)
    const total = g.segments.length;
    for (let k = 0; k < total; k++) {
      const seg = g.segments[k];
      if (seg.hp <= 0) continue;

      const ang = g.rotPrimary + (k / total) * Math.PI * 2;
      const dmgRatio = 1 - Math.max(0, seg.hp / seg.maxHp);

      ctx.save();
      ctx.rotate(ang);
      ctx.translate(g.armorR, 0);
      ctx.scale(seg.scalePop, seg.scalePop);

      // Regal Sculpted Porcelain Shield-Blade oriented tangentially & outward!
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(-4, -18);
      ctx.lineTo(10, -12);
      ctx.lineTo(19, 0);
      ctx.lineTo(10, 12);
      ctx.lineTo(-4, 18);
      ctx.closePath();

      const pGrad = ctx.createLinearGradient(-12, -16, 16, 16);
      if (seg.hitFlash > 0.25) {
        pGrad.addColorStop(0, '#FFFDF9');
        pGrad.addColorStop(1, '#FCE6AC');
      } else {
        pGrad.addColorStop(0, '#FAF6EE');
        pGrad.addColorStop(1, '#D5CCB9');
      }
      ctx.fillStyle = pGrad;
      ctx.fill();

      ctx.strokeStyle = dmgRatio > 0.35 ? this.skin.gold : '#C2B7A3';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Sculpted golden cross-filigree ridge
      ctx.strokeStyle = 'rgba(230, 184, 92, 0.72)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(15, 0);
      ctx.moveTo(1, -12);
      ctx.lineTo(1, 12);
      ctx.stroke();

      // Spreading 24K Kintsugi fracture veins when damaged
      if (dmgRatio > 0.08) {
        ctx.strokeStyle = this.skin.vermilion;
        ctx.lineWidth = 1.2 + dmgRatio * 0.8;
        ctx.beginPath();
        ctx.moveTo(-4, -10);
        ctx.lineTo(3, 1);
        ctx.lineTo(11, 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // E. Blazing Solar Corona + Tracking Obsidian Eclipse Eye!
    this.drawSacredEclipseCore(ctx, g);
  }

  /**
   * BOSS II (Stage 10): 『八葉の機神 — SERAPHIC LOTUS』
   * Tall Pointed Buddhist Mandorla Halo (`舟形光背`) + Double-Tier Curved Porcelain Lotus Blades + Dharma Wheel
   */
  private drawBossSeraphicLotus(ctx: CanvasRenderingContext2D, g: GuardianEntity): void {
    const dynamicR = g.armorR + Math.sin(g.breathPhase) * 9;

    // A. Grand Pointed Sacred Mandorla Halo (`黄金の舟形光背`) behind Boss!
    ctx.save();
    ctx.strokeStyle = 'rgba(230, 184, 92, 0.38)';
    ctx.fillStyle = 'rgba(217, 65, 54, 0.05)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -108);
    ctx.quadraticCurveTo(96, -24, 0, 98);
    ctx.quadraticCurveTo(-96, -24, 0, -108);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -96);
    ctx.quadraticCurveTo(80, -20, 0, 86);
    ctx.quadraticCurveTo(-80, -20, 0, -96);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(230, 184, 92, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // B. Inner Golden Sub-Petals (8 filigree petals counter-rotating)
    ctx.save();
    ctx.rotate(g.rotSecondary * 0.7);
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 4);
      ctx.strokeStyle = 'rgba(230, 184, 92, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.quadraticCurveTo(42, -9, 54, 0);
      ctx.quadraticCurveTo(42, 9, 28, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // C. 8 Sculpted S-Curved White-Porcelain Lotus Sword-Petals!
    const total = g.segments.length;
    for (let k = 0; k < total; k++) {
      const seg = g.segments[k];
      if (seg.hp <= 0) continue;

      const ang = g.rotPrimary + (k / total) * Math.PI * 2;
      const dmgRatio = 1 - Math.max(0, seg.hp / seg.maxHp);

      ctx.save();
      ctx.rotate(ang);
      ctx.translate(dynamicR, 0);
      ctx.scale(seg.scalePop, seg.scalePop);

      ctx.beginPath();
      ctx.moveTo(-17, 0);
      ctx.quadraticCurveTo(-3, -14, 24, 0);
      ctx.quadraticCurveTo(-3, 14, -17, 0);
      ctx.closePath();

      const lGrad = ctx.createLinearGradient(-16, -12, 22, 12);
      lGrad.addColorStop(0, seg.hitFlash > 0.25 ? '#FFFDF9' : '#FAF6EE');
      lGrad.addColorStop(1, seg.hitFlash > 0.25 ? '#FCE6AC' : '#D8CFC0');
      ctx.fillStyle = lGrad;
      ctx.fill();

      ctx.strokeStyle = '#E0B458';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Gold & Vermilion central rib + side veins
      ctx.strokeStyle = dmgRatio > 0.25 ? this.skin.vermilion : '#C99B3B';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(19, 0);
      ctx.stroke();

      ctx.fillStyle = this.skin.vermilion;
      ctx.beginPath();
      ctx.arc(-4, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // D. Sacred Dharma-Eclipse Core
    this.drawSacredEclipseCore(ctx, g);
  }

  /**
   * BOSS III (Stage 15+): 『虚空の天球座 — OPHANIM ARMILLARY THRONE』
   * Double-Edged 3D Engraved Golden Armillary Rings + 8 Pointed Star-Crystal Prisms + Tracking Seraph Eye!
   */
  private drawBossArmillaryThrone(ctx: CanvasRenderingContext2D, g: GuardianEntity): void {
    // A. 3 Double-Edged Ribbon-Thick 3D Golden Armillary Gimbal Rings!
    const gimbalRadii = [88, 68, 49];
    for (let i = 0; i < gimbalRadii.length; i++) {
      const gr = gimbalRadii[i];
      const tilt = Math.max(0.22, Math.abs(Math.cos(g.breathPhase * (0.65 + i * 0.2) + i * 1.1)));
      ctx.save();
      ctx.rotate(g.rotPrimary * (i % 2 === 0 ? 1 : -1.25) + i * 1.05);
      ctx.strokeStyle = i === 1 ? 'rgba(217, 65, 54, 0.78)' : 'rgba(242, 196, 100, 0.75)';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.ellipse(0, 0, gr, gr * tilt, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(230, 184, 92, 0.32)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, gr - 4, Math.max(2, (gr - 4) * tilt), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // B. 8 Sharp Elongated 4-Pointed Star-Crystal Porcelain Prisms (`星晶プリズム`) — Never overlapping!
    const total = g.segments.length;
    for (let k = 0; k < total; k++) {
      const seg = g.segments[k];
      if (seg.hp <= 0) continue;

      const ang =
        (k % 2 === 1 ? g.rotSecondary + Math.PI / total : g.rotPrimary) +
        (k / total) * Math.PI * 2;
      const mx = Math.cos(ang) * g.armorR;
      const my = Math.sin(ang) * g.armorR;

      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(ang);
      ctx.scale(seg.scalePop, seg.scalePop);

      // Sleek 4-Pointed Sacred Star-Crystal!
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(3, -6.5);
      ctx.lineTo(0, -15);
      ctx.lineTo(-3, -6.5);
      ctx.lineTo(-15, 0);
      ctx.lineTo(-3, 6.5);
      ctx.lineTo(0, 15);
      ctx.lineTo(3, 6.5);
      ctx.closePath();

      ctx.fillStyle = seg.hitFlash > 0.25 ? '#FFFDF9' : '#F6F1E7';
      ctx.fill();
      ctx.strokeStyle = this.skin.gold;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.fillStyle = this.skin.vermilion;
      ctx.beginPath();
      ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // C. Tracking Seraphim Eclipse Core
    this.drawSacredEclipseCore(ctx, g);
  }

  /**
   * Shared Regal Centerpiece: Solar Corona + Obsidian Void + 4-Pointed Starburst + Cradle-Tracking Cinnabar Eye!
   */
  private drawSacredEclipseCore(ctx: CanvasRenderingContext2D, g: GuardianEntity): void {
    // 16-Ray Golden & Vermilion Corona
    ctx.save();
    ctx.rotate(-g.rotPrimary * 1.3);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rOuter = i % 2 === 0 ? g.coreR + 12 + Math.sin(g.breathPhase * 3 + i) * 3 : g.coreR + 6;
      ctx.strokeStyle = i % 2 === 0 ? this.skin.gold : this.skin.vermilion;
      ctx.lineWidth = i % 2 === 0 ? 1.4 : 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * g.coreR, Math.sin(a) * g.coreR);
      ctx.lineTo(Math.cos(a) * rOuter, Math.sin(a) * rOuter);
      ctx.stroke();
    }
    ctx.restore();

    // Obsidian Eclipse Void
    ctx.fillStyle = g.hitFlash > 0.25 ? '#3C221D' : '#06050A';
    ctx.beginPath();
    ctx.arc(0, 0, g.coreR, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Tracking Cinnabar-Gold Iris (silently watches the player's pearl cradle!)
    const lookDx = this.cradleX - g.x;
    const lookDy = CRADLE_Y - g.y;
    const lookDist = Math.max(1, Math.hypot(lookDx, lookDy));
    const eyeX = (lookDx / lookDist) * 3.5;
    const eyeY = (lookDy / lookDist) * 3.5;

    ctx.save();
    ctx.translate(eyeX, eyeY);
    // Faint 4-pointed golden cross-star inside the abyss
    ctx.strokeStyle = 'rgba(230, 184, 92, 0.32)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-g.coreR + 7, 0);
    ctx.lineTo(g.coreR - 7, 0);
    ctx.moveTo(0, -g.coreR + 7);
    ctx.lineTo(0, g.coreR - 7);
    ctx.stroke();

    // Glowing Vermilion Diamond Ring
    ctx.strokeStyle = 'rgba(217, 65, 54, 0.78)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 21);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Outer 24K Gold Diamond-Ring Eclipse Rim
    ctx.strokeStyle = g.hitFlash > 0.2 ? '#FFFDF5' : this.skin.gold;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, g.coreR, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp Ceremonial Core HP Numeral
    ctx.fillStyle = '#FFF7E2';
    ctx.font = this.font('500', 14);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.max(0, g.hp)}`, 0, 1);
  }

  private traceChartStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    points: number
  ): void {
    ctx.beginPath();
    const n = Math.max(4, points);
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      const rad = i % 2 === 0 ? r : r * 0.38;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  private drawStageFigure(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    alpha: number
  ): void {
    const fig = atlasFigure(this.stage);
    if (fig.stars.length === 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx - w * 0.5, cy - h * 0.5);
    ctx.strokeStyle = this.skin.gold;
    ctx.fillStyle = this.skin.ink;
    ctx.lineWidth = 1.15;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const pad = 10;
    const iw = w - pad * 2;
    const ih = h - pad * 2;
    const px = (s: { x: number; y: number }) => pad + s.x * iw;
    const py = (s: { x: number; y: number }) => pad + s.y * ih;
    ctx.beginPath();
    for (const [a, b] of fig.edges) {
      const sa = fig.stars[a];
      const sb = fig.stars[b];
      if (!sa || !sb) continue;
      ctx.moveTo(px(sa), py(sa));
      ctx.lineTo(px(sb), py(sb));
    }
    ctx.stroke();
    for (const s of fig.stars) {
      this.traceChartStar(ctx, px(s), py(s), 4.4, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawComboAstrolabe(ctx: CanvasRenderingContext2D): void {
    if (this.phase !== 'FLIGHT' || this.chainCount < 1) return;
    const mag = magnitudeOf(this.chainCount);
    const flash = this.comboFlash;
    ctx.save();
    ctx.translate(TABLET_W * 0.5, 38);
    ctx.scale(this.chainPopScale, this.chainPopScale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const w = 132;
    const h = 26;
    ctx.globalAlpha = 0.94;
    ctx.fillStyle = 'rgba(247, 241, 227, 0.92)';
    ctx.strokeStyle = flash > 0.2 ? this.skin.gold : 'rgba(44, 36, 22, 0.45)';
    ctx.lineWidth = flash > 0.2 ? 1.6 : 1;
    ctx.beginPath();
    ctx.rect(-w * 0.5, -h * 0.5, w, h);
    ctx.fill();
    ctx.stroke();

    if (flash > 0.04) {
      ctx.globalAlpha = flash * 0.65;
      ctx.strokeStyle = this.skin.gold;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.rect(-w * 0.5 - 4 - flash * 8, -h * 0.5 - 4 - flash * 6, w + 8 + flash * 16, h + 8 + flash * 12);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = flash > 0.25 ? this.skin.gold : this.skin.ink;
    ctx.font = this.font('600', 20, false);
    ctx.fillText(`${this.chainCount}`, -34, 1);
    ctx.fillStyle = this.skin.ink;
    ctx.font = this.font('400', 13, false);
    ctx.fillText(mag.jp, 24, 1);
    ctx.restore();
  }

  private drawPorcelainVessel(ctx: CanvasRenderingContext2D, v: PorcelainVessel): void {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.scalePop, v.scalePop);

    const r = v.radius;
    const damageRatio = 1 - Math.max(0, v.hp / v.maxHp);
    const s = this.skin;
    const hit = v.hitFlash;
    const obstacle = Boolean(v.isObstacle);
    const ink = v.isVermilion ? s.vermilion : v.isArmored ? s.gold : s.ink;
    const fill = hit > 0.22
      ? s.vesselHitHi
      : obstacle
        ? v.isVermilion
          ? '#d9b8a8'
          : v.isArmored
            ? '#b7a888'
            : '#c8bba3'
        : v.isVermilion
          ? '#f3e2d6'
          : v.isArmored
            ? s.vesselArmorHi
            : '#f7f1e3';

    this.traceVesselPath(ctx, v.shape, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = v.isArmored ? 2.35 : obstacle ? 1.55 : 1.85;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2.4;
    ctx.stroke();

    if (obstacle) {
      ctx.save();
      this.traceVesselPath(ctx, v.shape, r);
      ctx.clip();
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 0.9;
      const step = 4.2;
      for (let x = -r; x <= r; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, -r);
        ctx.lineTo(x, r);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      const starPts = v.isVermilion ? 4 : v.isArmored ? 8 : v.shape === 'DIAMOND' ? 4 : v.shape === 'HEXAGON' ? 6 : 5;
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.16;
      this.traceChartStar(ctx, 0, 0, r * 0.7, starPts);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.05;
      this.traceChartStar(ctx, 0, 0, r * 0.7, starPts);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const local = this.vesselLocalVerts(v.shape, r);
    const faces = v.shape === 'DISC' ? 0 : local.length;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.05;
    ctx.globalAlpha = 0.55;
    if (v.shape === 'DISC') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r - 3.2), Math.sin(a) * (r - 3.2));
        ctx.lineTo(Math.cos(a) * (r - 0.4), Math.sin(a) * (r - 0.4));
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < faces; i++) {
        const a = local[i];
        const b = local[(i + 1) % faces];
        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5;
        let nx = b.y - a.y;
        let ny = a.x - b.x;
        const nlen = Math.hypot(nx, ny) || 1;
        nx /= nlen;
        ny /= nlen;
        if (nx * mx + ny * my < 0) {
          nx = -nx;
          ny = -ny;
        }
        ctx.beginPath();
        ctx.moveTo(mx - nx * 1.2, my - ny * 1.2);
        ctx.lineTo(mx - nx * 4.2, my - ny * 4.2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = ink;
    if (v.shape === 'DISC') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        if (obstacle) {
          ctx.beginPath();
          ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          this.traceChartStar(ctx, Math.cos(a) * r, Math.sin(a) * r, 2.15, 4);
          ctx.fill();
        }
      }
    } else {
      for (const p of local) {
        if (obstacle) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-1.5, -1.5, 3, 3);
          ctx.restore();
        } else {
          this.traceChartStar(ctx, p.x, p.y, 2.2, 4);
          ctx.fill();
        }
      }
    }

    if (this.aimContact && this.aimContact.vesselId === v.id) {
      ctx.strokeStyle = s.gold;
      ctx.lineWidth = 3.1;
      ctx.lineCap = 'round';
      const hx = this.aimContact.x - v.x;
      const hy = this.aimContact.y - v.y;
      const tx = -this.aimContact.ny;
      const ty = this.aimContact.nx;
      ctx.beginPath();
      ctx.moveTo(hx - tx * 8, hy - ty * 8);
      ctx.lineTo(hx + tx * 8, hy + ty * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + this.aimContact.nx * 7, hy + this.aimContact.ny * 7);
      ctx.stroke();
    }

    if (damageRatio > 0.08) {
      ctx.save();
      this.traceVesselPath(ctx, v.shape, r);
      ctx.clip();
      ctx.strokeStyle = s.gold;
      ctx.lineWidth = 1.1 + damageRatio * 0.8;
      ctx.globalAlpha = 0.55 + damageRatio * 0.35;
      const branches = Math.ceil(2 + damageRatio * 3);
      for (let i = 0; i < Math.min(branches, v.cracks.length); i++) {
        const br = v.cracks[i];
        ctx.beginPath();
        ctx.moveTo(br.pts[0].x, br.pts[0].y);
        ctx.lineTo(br.pts[1].x, br.pts[1].y);
        if (damageRatio > 0.4) ctx.lineTo(br.pts[2].x, br.pts[2].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, 9.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = this.font('600', 15, false);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${v.hp}`, 0, 0.5);

    ctx.restore();
  }

  private traceVesselPath(
    ctx: CanvasRenderingContext2D,
    shape: VesselShape,
    r: number
  ): void {
    ctx.beginPath();
    if (shape === 'DISC') {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      return;
    }
    const verts = this.vesselLocalVerts(shape, r);
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
    ctx.closePath();
  }

  private computeAimPath(): void {
    let rx = this.cradleX;
    let ry = CRADLE_Y - 4;
    let dx = Math.cos(this.aimAngle);
    let dy = Math.sin(this.aimAngle);

    const pts: Array<{ x: number; y: number }> = [{ x: rx, y: ry }];
    let bounces = 0;
    let postVesselSteps = -1;
    const stepLen = 4.5;
    this.aimContact = null;

    for (let s = 0; s < 220 && bounces < 2; s++) {
      rx += dx * stepLen;
      ry += dy * stepLen;

      if (postVesselSteps >= 0) {
        postVesselSteps++;
        if (postVesselSteps >= 22) break;
      }

      if (rx <= 16) {
        rx = 16;
        dx = Math.abs(dx);
        pts.push({ x: rx, y: ry });
        bounces++;
      } else if (rx >= TABLET_W - 16) {
        rx = TABLET_W - 16;
        dx = -Math.abs(dx);
        pts.push({ x: rx, y: ry });
        bounces++;
      } else if (ry <= 16) {
        ry = 16;
        dy = Math.abs(dy);
        pts.push({ x: rx, y: ry });
        bounces++;
      }

      if (postVesselSteps < 0) {
        if (
          this.guardian &&
          Math.hypot(rx - this.guardian.x, ry - this.guardian.y) <= this.guardian.coreR + 5
        ) {
          const d = Math.max(1, Math.hypot(rx - this.guardian.x, ry - this.guardian.y));
          const nx = (rx - this.guardian.x) / d;
          const ny = (ry - this.guardian.y) / d;
          const dot = dx * nx + dy * ny;
          dx -= 2 * dot * nx;
          dy -= 2 * dot * ny;
          pts.push({ x: rx, y: ry });
          bounces++;
          postVesselSteps = 0;
        } else {
          for (const v of this.vessels) {
            const hit = this.vesselContact(rx, ry, 3.2, v);
            if (!hit) continue;
            if (!this.aimContact) {
              this.aimContact = {
                vesselId: v.id,
                x: hit.qx,
                y: hit.qy,
                nx: hit.nx,
                ny: hit.ny,
              };
            }
            const dot = dx * hit.nx + dy * hit.ny;
            dx -= 2 * dot * hit.nx;
            dy -= 2 * dot * hit.ny;
            rx = hit.qx + hit.nx * 4;
            ry = hit.qy + hit.ny * 4;
            pts.push({ x: rx, y: ry });
            bounces++;
            postVesselSteps = 0;
            break;
          }
        }
      }
    }
    pts.push({ x: rx, y: ry });
    this.aimPts = pts;
  }

  private drawGoldenAimThread(ctx: CanvasRenderingContext2D): void {
    const pts = this.aimPts;
    if (pts.length < 2) this.computeAimPath();
    const path = this.aimPts;
    if (path.length < 2) return;

    ctx.save();
    ctx.strokeStyle = this.isDrawingThread ? this.skin.aim : this.skin.aimIdle;
    ctx.shadowColor = this.skin.gold;
    ctx.shadowBlur = false ? 0 : this.isDrawingThread ? 8 : 3;
    ctx.lineWidth = this.isDrawingThread ? this.skin.aimWidth + 0.4 : this.skin.aimWidth;
    ctx.setLineDash([2, 6]);
    ctx.lineDashOffset = -this.timeSec * 34;

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    ctx.setLineDash([]);
    if (this.aimContact) {
      const c = this.aimContact;
      ctx.strokeStyle = this.skin.gold;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.nx * 10, c.y + c.ny * 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBottomCradle(ctx: CanvasRenderingContext2D): void {
    const cx = this.cradleX;
    const cy = CRADLE_Y;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = this.skin.gold;
    ctx.lineWidth = false ? 1.1 : 1.7;
    ctx.beginPath();
    if (false) {
      ctx.moveTo(-18, 2);
      ctx.lineTo(-12, 10);
      ctx.lineTo(12, 10);
      ctx.lineTo(18, 2);
      ctx.stroke();
    } else {
      ctx.ellipse(0, 6, 16, 9, 0, Math.PI * 0.08, Math.PI * 0.92);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 2, 13, 6, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (this.phase === 'PROLOGUE' || this.phase === 'AIMING') {
      const pulse = 1 + Math.sin(this.timeSec * 3.4) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.drawImage(this.pearlGlowSprite, -15, -19, 30, 30);
      ctx.fillStyle = this.skin.pearlCore;
      ctx.beginPath();
      ctx.arc(0, -4, 6.2, 0, Math.PI * 2);
      ctx.fill();

      if (this.phase === 'AIMING') {
        ctx.fillStyle = this.skin.gold;
        ctx.font = this.font('600', 12, false);
        ctx.textAlign = 'center';
        ctx.fillText(`×${this.getBasePearlCount()}`, 0, 30);
      }
    } else if (this.phase === 'FLIGHT' && this.launchQueue > 0) {
      ctx.fillStyle = this.skin.gold;
      ctx.font = this.font('400', 11, false);
      ctx.textAlign = 'center';
      ctx.fillText(false ? `${this.launchQueue}` : `あと ${this.launchQueue}`, 0, 28);
    }
    ctx.restore();
  }
}
