import { sound } from '../audio/kintsugiAudio';
import { KintsugiCanvasEngine, KintsugiHudState } from '../game/kintsugiCanvas';
import {
  ABILITIES,
  AbilityDef,
  KintsugiRecord,
  RunSnapshot,
  StageClearInfo,
  clearRun,
  constellationForStage,
  getStageBlueprint,
  isBossStage,
  isGrandBossStage,
  isMidBossStage,
  isNightUnlocked,
  loadRecord,
  loadRun,
  nightSelectCount,
  noteClear,
  saveRecord,
  saveRun,
  SEASON_PLATE,
} from '../game/kintsugiData';
import { atlasFigure, magnitudeOf } from '../game/constellations';
import { stageCaption } from '../game/visualTheme';

const RANK_MARKS = ['', '1', '2', '3', '4', '5'];

type MenuView = 'home' | 'nights' | 'records';

export class KintsugiApp {
  private root: HTMLElement;
  private frame!: HTMLElement;
  private engine!: KintsugiCanvasEngine;
  private record: KintsugiRecord;
  private run: RunSnapshot | null;
  private choices: AbilityDef[] = [];
  private lastClearedStage = 1;
  private menu: MenuView = 'home';
  private playing = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.record = loadRecord();
    this.run = loadRun();
    sound.enabled = this.record.soundOn;

    this.mountShell();
    this.mountEngine();
    this.applyTheme();
    this.renderMenu('home');

    (window as unknown as Record<string, unknown>).__KINTSUGI__ = {
      app: this,
      engine: this.engine,
      getRecord: () => this.record,
    };

    window.addEventListener('resize', () => this.fitStage());
  }

  private mountShell(): void {
    this.root.innerHTML = `
      <div class="lacquer-frame" id="lacquer-frame">
        <header class="top-margin prologue-dim" id="top-margin">
          <div class="act-inscription">
            <span class="act-kanji" id="hud-act-kanji" data-testid="hud-act">星継</span>
            <span class="act-sub" id="hud-act-sub">星図</span>
            <span class="awakening-dots" id="hud-awake-dots" title="次の星座まで"></span>
          </div>

          <div class="integrity-vessels" id="hud-vessels" data-testid="hud-vessels" title="灯">
            <span class="vessel-pip"></span>
            <span class="vessel-pip"></span>
            <span class="vessel-pip"></span>
          </div>

          <div class="utility-glyphs">
            <button class="glyph-btn" id="btn-sound" title="音の入切">${this.record.soundOn ? '音' : '静'}</button>
            <button class="glyph-btn" id="btn-prologue" data-testid="btn-prologue" title="図へ戻る">図</button>
          </div>
        </header>

        <div class="ability-crest-strip" id="ability-crest-strip" data-testid="ability-crests"></div>

        <div class="guardian-strip" id="guardian-strip">
          <div class="guardian-strip-row">
            <span id="guardian-name">オリオン</span>
            <span id="guardian-sub" style="color:var(--cinnabar);font-size:11px;"></span>
          </div>
          <div class="guardian-hairline">
            <div class="guardian-hairline-fill" id="guardian-fill" style="width:100%;"></div>
          </div>
        </div>

        <main class="tablet-stage" id="tablet-stage">
          <canvas id="kintsugi-canvas" data-testid="kintsugi-canvas"></canvas>
          <div id="prologue-host"></div>
        </main>

        <footer class="bottom-margin">
          <div class="slash-seal" id="hud-slash-seal" data-testid="hud-slash">
            <span class="slash-pips" id="hud-slash-pips"></span>
            <span id="hud-guidance"></span>
          </div>
          <div class="bottom-right-group">
            <span class="resonance-note" id="hud-chain"></span>
            <button class="ff-btn" id="btn-ff" data-testid="btn-ff">急</button>
          </div>
        </footer>

        <div id="ceremony-host"></div>
      </div>
    `;

    this.frame = this.root.querySelector('#lacquer-frame') as HTMLElement;

    this.frame.querySelector('#btn-sound')?.addEventListener('click', () => {
      this.record.soundOn = !this.record.soundOn;
      sound.enabled = this.record.soundOn;
      if (this.record.soundOn) sound.playPorcelainChime(4, false);
      saveRecord(this.record);
      const btn = this.frame.querySelector('#btn-sound');
      if (btn) btn.textContent = this.record.soundOn ? '音' : '静';
    });

    this.frame.querySelector('#btn-prologue')?.addEventListener('click', () => {
      sound.unlock();
      sound.playThreadTick(2);
      this.goHome(true);
    });

    this.frame.querySelector('#btn-ff')?.addEventListener('click', () => {
      this.engine.toggleFastForward();
    });
  }

  private mountEngine(): void {
    const canvas = this.frame.querySelector('#kintsugi-canvas') as HTMLCanvasElement;
    this.engine = new KintsugiCanvasEngine(canvas, {
      onStateChange: (hud) => this.syncHud(hud),
      onPrologueDismissed: () => {
        this.playing = true;
        this.renderMenuHost('');
        this.fitStage();
      },
      onStageCleared: (info) => this.handleStageCleared(info),
      onRunPersist: (snap) => {
        this.run = snap;
        saveRun(snap);
      },
      onAwakeningReady: (stageCleared, maxChain) => {
        this.lastClearedStage = stageCleared;
        this.noteProgress(stageCleared + 1, maxChain);
        this.rollThreeAbilities(stageCleared);
        this.renderAwakeningModal(stageCleared);
      },
      onVesselBroken: (stageReached, longestChain) => {
        this.noteProgress(stageReached, longestChain);
        this.run = null;
        clearRun();
        this.playing = false;
        this.renderBrokenModal(stageReached, longestChain);
      },
    });

    this.fitStage();
  }

  private applyTheme(): void {
    this.record.theme = 'atlas';
    saveRecord(this.record);
    this.frame.dataset.theme = 'atlas';
    this.engine.setTheme('atlas');
  }

  private cap(stage: number): string {
    return stageCaption(stage);
  }

  private starPoly(x: number, y: number, r: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.38;
      pts.push(`${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  private figureSvg(stage: number, w: number, h: number, cls = 'night-glyph', animate = false): string {
    const fig = atlasFigure(stage);
    const pad = 10;
    const iw = w - pad * 2;
    const ih = h - pad * 2;
    const x = (s: { x: number; y: number }) => pad + s.x * iw;
    const y = (s: { x: number; y: number }) => pad + s.y * ih;
    const lines = fig.edges
      .map(([a, b], i) => {
        const p = fig.stars[a];
        const q = fig.stars[b];
        if (!p || !q) return '';
        const anim = animate
          ? `stroke-dasharray="160" stroke-dashoffset="160" style="animation:stitch-draw 0.9s ease ${0.12 + i * 0.08}s forwards"`
          : '';
        return `<line x1="${x(p).toFixed(1)}" y1="${y(p).toFixed(1)}" x2="${x(q).toFixed(1)}" y2="${y(q).toFixed(1)}" stroke="#8a6a2e" stroke-width="1.45" stroke-linecap="round" fill="none" ${anim}/>`;
      })
      .join('');
    const dots = fig.stars
      .map((s, i) => {
        const pop = animate ? `style="animation:star-pop 0.35s ease ${0.35 + i * 0.05}s both"` : '';
        return `<polygon points="${this.starPoly(x(s), y(s), cls === 'night-glyph' ? 3.4 : 4.6)}" fill="#2c2416" ${pop}/>`;
      })
      .join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="#f4eee0" stroke="#8a6a2e" stroke-width="0.7"/>${lines}${dots}</svg>`;
  }

  private goHome(saveIfPlaying: boolean): void {
    this.clearCeremonyModal();
    if (saveIfPlaying && this.playing && this.engine.phase !== 'SHATTERED' && this.engine.phase !== 'PROLOGUE') {
      const snap = this.engine.exportRun();
      this.run = snap;
      saveRun(snap);
    }
    this.playing = false;
    this.engine.preparePrologue();
    this.renderMenu('home');
  }

  private startNewNight(startStage: number): void {
    sound.unlock();
    sound.playKintsugiConvergence();
    this.record.runsPlayed += 1;
    saveRecord(this.record);
    this.playing = true;
    this.engine.beginRun(startStage, false);
  }

  private continueRun(): void {
    const snap = this.run ?? loadRun();
    if (!snap) {
      this.startNewNight(1);
      return;
    }
    sound.unlock();
    sound.playKintsugiConvergence();
    this.playing = true;
    this.engine.restoreRun(snap);
  }

  private noteProgress(stageReached: number, chain: number): void {
    if (stageReached > this.record.highestStage) this.record.highestStage = stageReached;
    if (chain > this.record.longestResonance) this.record.longestResonance = chain;
    saveRecord(this.record);
  }

  private handleStageCleared(info: StageClearInfo): void {
    const result = noteClear(this.record, info);
    saveRecord(this.record);
    if (result.newNight || result.newChain || result.newFigure) sound.playRecordBreak();
    this.renderClearToast(info, result);
  }

  private fitStage(): void {
    if (!this.engine) return;
    const stage = this.frame.querySelector('#tablet-stage') as HTMLElement;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    this.engine.resizeToStage(Math.max(260, rect.width), Math.max(360, rect.height));
  }

  private syncHud(hud: KintsugiHudState): void {
    const topMargin = this.frame.querySelector('#top-margin');
    const atShop = hud.phase === 'PROLOGUE' || !this.playing;
    topMargin?.classList.toggle('prologue-dim', atShop);

    const actKanji = this.frame.querySelector('#hud-act-kanji');
    const actSub = this.frame.querySelector('#hud-act-sub');
    const awakeDots = this.frame.querySelector('#hud-awake-dots') as HTMLElement | null;
    if (actKanji) actKanji.textContent = atShop ? '星継' : hud.stageTitle;
    if (actSub) actSub.textContent = atShop ? '星図' : hud.stageLabel;

    if (awakeDots) {
      if (atShop || hud.guardianTitle) {
        awakeDots.style.display = 'none';
      } else {
        awakeDots.style.display = 'inline-flex';
        let dHtml = '';
        for (let i = 0; i < hud.sealsNeeded; i++) {
          dHtml += `<span class="awake-dot ${i < hud.awakeningSeals ? 'filled' : ''}"></span>`;
        }
        awakeDots.innerHTML = dHtml;
      }
    }

    const vesselsEl = this.frame.querySelector('#hud-vessels');
    if (vesselsEl) {
      let html = '';
      for (let i = 0; i < hud.maxIntegrity; i++) {
        html += `<span class="vessel-pip ${i >= hud.vesselsIntegrity ? 'broken' : ''}"></span>`;
      }
      vesselsEl.innerHTML = html;
    }

    const crestStrip = this.frame.querySelector('#ability-crest-strip') as HTMLElement | null;
    if (crestStrip) {
      const wasVisible = crestStrip.style.display === 'flex';
      if (hud.acquiredBadges.length > 0 && !atShop) {
        crestStrip.style.display = 'flex';
        crestStrip.innerHTML = hud.acquiredBadges
          .map(
            (b) =>
              `<span class="crest-chip">${b.shortCrest}<em>${RANK_MARKS[b.rank] ?? b.rank}</em></span>`
          )
          .join('');
      } else {
        crestStrip.style.display = 'none';
      }
      if ((crestStrip.style.display === 'flex') !== wasVisible) {
        requestAnimationFrame(() => this.fitStage());
      }
    }

    const gStrip = this.frame.querySelector('#guardian-strip') as HTMLElement | null;
    const gName = this.frame.querySelector('#guardian-name');
    const gSub = this.frame.querySelector('#guardian-sub') as HTMLElement | null;
    const gFill = this.frame.querySelector('#guardian-fill') as HTMLElement | null;
    if (gStrip && gName && gFill) {
      const wasVisible = gStrip.style.display === 'block';
      if (hud.guardianTitle && !atShop) {
        gStrip.style.display = 'block';
        gName.textContent = hud.guardianTitle;
        if (gSub) {
          const turns = hud.guardianTurnsLeft;
          if (turns !== null) {
            gSub.textContent = turns <= 2 ? `地平まで あと${turns}手` : `あと${turns}手`;
            gSub.style.color = turns <= 2 ? '#ff8a7a' : 'var(--lamp)';
          } else if (hud.guardianSubtitle) {
            gSub.textContent = hud.guardianSubtitle;
          }
        }
        gFill.style.width = `${Math.round(hud.guardianRatio * 100)}%`;
      } else {
        gStrip.style.display = 'none';
      }
      if ((gStrip.style.display === 'block') !== wasVisible) {
        requestAnimationFrame(() => this.fitStage());
      }
    }

    const seal = this.frame.querySelector('#hud-slash-seal');
    const pipsEl = this.frame.querySelector('#hud-slash-pips');
    const guideEl = this.frame.querySelector('#hud-guidance');
    const chainEl = this.frame.querySelector('#hud-chain');
    const ffBtn = this.frame.querySelector('#btn-ff') as HTMLElement | null;

    if (pipsEl) {
      if (!hud.hasSlashAbility || atShop) {
        pipsEl.innerHTML = '';
      } else {
        const total = Math.max(hud.maxSlashes, hud.slashesLeft);
        let pHtml = '';
        for (let i = 0; i < total; i++) {
          pHtml += `<span class="slash-pip ${i >= hud.slashesLeft ? 'empty' : ''}"></span>`;
        }
        pipsEl.innerHTML = pHtml;
      }
    }

    if (seal && guideEl) {
      if (atShop) {
        seal.classList.remove('ready');
        guideEl.textContent = '';
      } else if (hud.phase === 'CLEARED') {
        seal.classList.remove('ready');
        guideEl.textContent = '縫った';
      } else if (hud.phase === 'AIMING' || hud.phase === 'TRANSITION') {
        seal.classList.remove('ready');
        guideEl.textContent = '星へ線を引き、放つ';
      } else if (hud.phase === 'FLIGHT') {
        if (!hud.hasSlashAbility) {
          seal.classList.remove('ready');
          guideEl.textContent = '星を縫う';
        } else if (hud.slashesLeft > 0) {
          seal.classList.add('ready');
          guideEl.textContent = '図を叩いて金線';
        } else {
          seal.classList.remove('ready');
          guideEl.textContent = '金線は使い切った';
        }
      }
    }

    if (ffBtn) {
      ffBtn.style.display = hud.phase === 'FLIGHT' ? 'inline-block' : 'none';
      ffBtn.classList.toggle('active', hud.fastForward);
      ffBtn.textContent = hud.fastForward ? '急!' : '急';
    }

    if (chainEl) {
      if (hud.phase === 'FLIGHT') {
        const parts: string[] = [];
        if (hud.activePearlCount > 1) parts.push(`${hud.activePearlCount}星`);
        if (hud.chainCount > 0)
          parts.push(`${hud.chainCount} · ${magnitudeOf(hud.chainCount, hud.basePearlCount).jp}`);
        chainEl.textContent = parts.join('  ');
      } else if (hud.phase === 'AIMING' || hud.phase === 'TRANSITION') {
        chainEl.textContent =
          hud.pearlDamage > 1 ? `×${hud.basePearlCount}　${hud.pearlDamage}` : `×${hud.basePearlCount}`;
      } else {
        chainEl.textContent = '';
      }
    }

    if (hud.phase !== 'CLEARED' && hud.phase !== 'INTERLUDE' && hud.phase !== 'SHATTERED') {
      this.clearCeremonyModal();
    }
  }

  private renderMenuHost(html: string): void {
    const host = this.frame.querySelector('#prologue-host') as HTMLElement;
    if (host) host.innerHTML = html;
  }

  private renderMenu(view: MenuView): void {
    this.menu = view;
    this.run = loadRun();
    if (view === 'nights') this.renderNightSelect();
    else if (view === 'records') this.renderRecords();
    else this.renderHome();
    requestAnimationFrame(() => this.fitStage());
  }

  private renderHome(): void {
    const recLine =
      this.record.highestCleared > 0
        ? `${this.cap(this.record.highestCleared)}まで  ·  最長 ${this.record.longestResonance}`
        : 'まだ図がない';
    const last = this.record.highestCleared > 0 ? getStageBlueprint(this.record.highestCleared) : null;
    const cont = this.run
      ? `<button class="home-link dim" id="btn-continue" data-testid="btn-continue">つづき　${getStageBlueprint(this.run.stage).title}</button>`
      : '';

    this.renderMenuHost(`
      <div class="prologue-veil" data-testid="prologue-veil">
        <div class="home-main">
          <div class="atlas-title">星継</div>
          <div class="atlas-rule"></div>
          <div class="atlas-blurb">落ちた星を金で縫い、<br>図に還す。</div>
          <div class="atlas-record">${recLine}${last ? `　${last.title}` : ''}</div>
        </div>
        <div class="home-actions">
          <button class="prologue-trigger-btn" id="btn-open-curtain" data-testid="btn-open-curtain">はじめる</button>
          ${cont}
          <button class="home-link dim" id="btn-nights" data-testid="btn-nights">図譜</button>
          <button class="home-link dim" id="btn-records">記録</button>
        </div>
      </div>
    `);

    this.frame.querySelector('#btn-open-curtain')?.addEventListener('click', () => {
      this.startNewNight(1);
    });
    this.frame.querySelector('#btn-continue')?.addEventListener('click', () => this.continueRun());
    this.frame.querySelector('#btn-nights')?.addEventListener('click', () => {
      sound.unlock();
      sound.playThreadTick(3);
      this.renderMenu('nights');
    });
    this.frame.querySelector('#btn-records')?.addEventListener('click', () => {
      sound.unlock();
      sound.playThreadTick(4);
      this.renderMenu('records');
    });
  }

  private renderNightSelect(): void {
    const count = nightSelectCount(this.record);
    const blocks: string[] = [];
    let lastPlate = -1;
    for (let n = 1; n <= count; n++) {
      const bp = getStageBlueprint(n);
      const plate = Math.floor((n - 1) / 12);
      if (plate !== lastPlate) {
        lastPlate = plate;
        const season = SEASON_PLATE[bp.season];
        blocks.push(`<div class="atlas-season">${season.jp}</div>`);
      }
      const open = isNightUnlocked(n, this.record);
      const grand = isGrandBossStage(n);
      const mid = isMidBossStage(n);
      const cleared = n <= this.record.highestCleared;
      const best = this.record.bestChainByStage[String(n)];
      const cls = [
        'night-cell',
        open ? '' : 'locked',
        grand ? 'boss' : '',
        mid ? 'mid' : '',
        cleared ? 'cleared' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const kicker = grand ? '大ボス' : mid ? '中ボス' : bp.archetype === 'CONSTELLATION' ? '星座' : '';
      blocks.push(`
        <button class="${cls}" data-night="${n}" ${open ? '' : 'disabled'} data-testid="night-${n}">
          ${cleared ? this.figureSvg(n, 156, 92) : '<span class="night-glyph-empty"></span>'}
          <em>${this.cap(n)}</em>
          <strong>${open ? bp.title : '—'}</strong>
          <span>${kicker}</span>
          ${best ? `<b>${best}</b>` : ''}
        </button>
      `);
    }

    const latest = this.record.highestCleared;
    const latestBp = latest > 0 ? getStageBlueprint(latest) : null;
    const hero = latestBp
      ? `<div class="atlas-hero">${this.figureSvg(latest, 280, 150, 'hero-glyph')}<div class="atlas-hero-cap">${this.cap(latest)}　${latestBp.title}</div></div>`
      : '';

    this.renderMenuHost(`
      <div class="menu-sheet" data-testid="night-select">
        <div class="menu-head">
          <button class="text-back" id="btn-back-home">図</button>
          <div class="menu-title">図譜</div>
          <div class="menu-spacer"></div>
        </div>
        <p class="menu-lead">縫い終わった図だけ、星の形が残る。</p>
        ${hero}
        <div class="night-grid atlas-index">${blocks.join('')}</div>
      </div>
    `);

    this.frame.querySelector('#btn-back-home')?.addEventListener('click', () => this.renderMenu('home'));
    this.frame.querySelectorAll('[data-night]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = Number((btn as HTMLElement).dataset.night);
        if (!n || !isNightUnlocked(n, this.record)) return;
        this.startNewNight(n);
      });
    });
  }

  private renderRecords(): void {
    const ranked = [...this.record.ledger].sort((a, b) => b.chain - a.chain).slice(0, 8);
    const rows = ranked
      .map(
        (e, i) => `
        <div class="rank-row">
          <span class="rank-i">${String(i + 1).padStart(2, '0')}</span>
          <span class="rank-name">${e.title}</span>
          <strong>${e.chain}</strong>
        </div>`
      )
      .join('');

    this.renderMenuHost(`
      <div class="menu-sheet">
        <div class="menu-head">
          <button class="text-back" id="btn-back-home">図</button>
          <div class="menu-title">記録</div>
          <div class="menu-spacer"></div>
        </div>
        <div class="record-list">
          <div><span>いちばん奥の図</span><strong>${this.record.highestCleared > 0 ? this.cap(this.record.highestCleared) : '—'}</strong></div>
          <div><span>最長の結星</span><strong>${this.record.longestResonance}</strong></div>
          <div><span>縫った図</span><strong>${this.record.totalClears}</strong></div>
          <div><span>開いた夜</span><strong>${this.record.runsPlayed}</strong></div>
        </div>
        <div class="rank-head">結星 順位</div>
        <div class="rank-list">${rows || '<p class="menu-lead">まだ図がない。</p>'}</div>
      </div>
    `);
    this.frame.querySelector('#btn-back-home')?.addEventListener('click', () => this.renderMenu('home'));
  }

  private renderClearToast(
    info: StageClearInfo,
    result: { newNight: boolean; newChain: boolean; newFigure: boolean; rank: number; total: number; figureBest: number }
  ): void {
    const host = this.frame.querySelector('#ceremony-host') as HTMLElement;
    const mag = magnitudeOf(info.chain, info.pearlCount);
    const plate = SEASON_PLATE[info.season as keyof typeof SEASON_PLATE];
    const stamps = [
      result.newNight ? '<span class="new-stamp">新図</span>' : '',
      result.newChain ? '<span class="new-stamp chain">最長 更新</span>' : '',
      result.newFigure ? '<span class="new-stamp">この星座 更新</span>' : '',
    ]
      .filter(Boolean)
      .join('');

    const ranked = [...this.record.ledger].sort((a, b) => b.chain - a.chain).slice(0, 5);
    const board = ranked
      .map((e, i) => {
        const here = i === result.rank - 1 && e.stage === info.stage && e.chain === info.chain;
        return `<div class="rank-row ${here ? 'here' : ''}"><span class="rank-i">${String(i + 1).padStart(2, '0')}</span><span>${e.title}</span><strong>${e.chain}</strong></div>`;
      })
      .join('');

    host.innerHTML = `
      <div class="clear-toast" id="clear-toast" data-testid="clear-toast">
        <div class="clear-card atlas-clear">
          <div class="clear-kicker">${this.cap(info.stage)}${plate ? `　${plate.jp}` : ''}</div>
          <div class="clear-seal">${info.isBoss ? '核を割った' : '縫い上がった'}</div>
          <div class="clear-title">${info.title}</div>
          ${this.figureSvg(info.stage, 248, 148, 'clear-glyph', true)}
          <div class="clear-stamps">${stamps}</div>
          <div class="clear-metrics">
            <div><span>等級</span><strong>${mag.jp}</strong></div>
            <div class="chain-pop"><span>結星</span><strong>${info.chain}</strong></div>
            <div><span>星</span><strong>×${info.pearlCount}</strong></div>
          </div>
          ${
            info.nextPearlDamage > info.pearlDamage
              ? `<div class="clear-wound">傷 ${info.pearlDamage} → ${info.nextPearlDamage}</div>`
              : ''
          }
          <div class="clear-metrics slim">
            <div>この図の最高<strong>${result.figureBest}</strong></div>
            <div>通算最高<strong>${this.record.longestResonance}</strong></div>
            <div>順位<strong>${result.rank}<em>/${result.total}</em></strong></div>
          </div>
          <div class="rank-list mini">${board}</div>
          <div class="clear-hint">記録を見てから、タップで次の図へ</div>
        </div>
      </div>
    `;

    host.querySelector('#clear-toast')?.addEventListener('click', () => {
      this.clearCeremonyModal();
      this.engine.skipClearHold();
    });
  }

  private rollThreeAbilities(stageCleared: number): void {
    const eligible = ABILITIES.filter(
      (ab) =>
        ab.minStageToAppear <= stageCleared &&
        (this.engine.ranks[ab.id] ?? 0) < ab.maxRank
    );

    const shuffle = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const mixed = shuffle(eligible);
    if (mixed.length === 0) {
      mixed.push(ABILITIES[0]);
    }
    this.choices = mixed.slice(0, 3);
  }

  private renderAwakeningModal(stageCleared: number): void {
    const bossBonus = isBossStage(stageCleared);
    const fig = constellationForStage(stageCleared);
    const kicker = bossBonus
      ? `${fig.title}の核を割った`
      : `${fig.title}を縫った`;
    const host = this.frame.querySelector('#ceremony-host') as HTMLElement;
    host.innerHTML = `
      <div class="ceremony-modal" data-testid="interlude-modal">
        <div class="ceremony-heading">
          <div class="ceremony-kicker">${kicker}</div>
          <div class="ceremony-title">どの線を継ぐ</div>
          <div class="ceremony-sub">星図に、一本足す</div>
        </div>

        <div class="talisman-list">
          ${this.choices
            .map((ab, idx) => {
              const curRank = this.engine.ranks[ab.id] ?? 0;
              const isNew = curRank === 0;
              const badgeText = isNew
                  ? '新しい線'
                : `${curRank} → ${curRank + 1}`;
              const desc =
                ab.rankDescriptions[Math.min(ab.rankDescriptions.length - 1, curRank)] ??
                ab.rankDescriptions[0];

              return `
                <button class="talisman-plate" data-ins-idx="${idx}" data-testid="talisman-${idx}">
                  <div class="talisman-sigil">${ab.sigilSvg}</div>
                  <div class="talisman-body">
                    <div class="talisman-name-row">
                      <span class="talisman-name">${ab.kanjiTitle}</span>
                      <span class="talisman-badge ${isNew ? 'is-new' : ''}">${badgeText}</span>
                    </div>
                    <div class="talisman-effect">${desc}</div>
                  </div>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    host.querySelectorAll('[data-ins-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number((btn as HTMLElement).dataset.insIdx);
        const picked = this.choices[idx];
        if (picked) {
          sound.playKintsugiConvergence();
          this.engine.inscribeAbility(picked.id);
          this.clearCeremonyModal();
          this.engine.proceedAfterAwakening();
        }
      });
    });
  }

  private renderBrokenModal(stageReached: number, longestChain: number): void {
    const host = this.frame.querySelector('#ceremony-host') as HTMLElement;
    host.innerHTML = `
      <div class="ceremony-modal" data-testid="broken-modal">
        <div class="epilogue-box">
          <div class="epilogue-stamp">星が落ちた</div>
          <div class="ceremony-title">今夜の図は、ここまで</div>

          <div class="epilogue-metrics">
            <div>届いた図<strong>${this.cap(stageReached)}</strong></div>
            <div>最長の結星<strong>${longestChain}</strong></div>
          </div>

          <button class="prologue-trigger-btn" id="btn-mend-again" data-testid="btn-mend-again">
            もう一度、縫う
          </button>
          <button class="home-link dim" id="btn-broken-home">図へ戻る</button>
        </div>
      </div>
    `;

    host.querySelector('#btn-mend-again')?.addEventListener('click', () => {
      sound.playKintsugiConvergence();
      this.clearCeremonyModal();
      this.record.runsPlayed += 1;
      saveRecord(this.record);
      this.playing = true;
      this.engine.beginRun(1, false);
    });
    host.querySelector('#btn-broken-home')?.addEventListener('click', () => {
      this.clearCeremonyModal();
      this.goHome(false);
    });
  }

  private clearCeremonyModal(): void {
    const host = this.frame.querySelector('#ceremony-host') as HTMLElement;
    if (host) host.innerHTML = '';
  }
}
