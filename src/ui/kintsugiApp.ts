import { sound } from '../audio/kintsugiAudio';
import { KintsugiCanvasEngine, KintsugiHudState } from '../game/kintsugiCanvas';
import {
  ABILITIES,
  AbilityDef,
  KintsugiRecord,
  formatStageLabel,
  isBossStage,
  loadRecord,
  saveRecord,
} from '../game/kintsugiData';

const RANK_MARKS = ['', '1', '2', '3', '4', '5'];

export class KintsugiApp {
  private root: HTMLElement;
  private frame!: HTMLElement;
  private engine!: KintsugiCanvasEngine;
  private record: KintsugiRecord;
  private choices: AbilityDef[] = [];
  private lastClearedStage = 1;

  constructor(root: HTMLElement) {
    this.root = root;
    this.record = loadRecord();
    sound.enabled = this.record.soundOn;

    this.mountShell();
    this.mountEngine();
    this.renderPrologueVeil(true);

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
            <span class="act-kanji" id="hud-act-kanji" data-testid="hud-act">夜1</span>
            <span class="act-sub" id="hud-act-sub">門前</span>
            <span class="awakening-dots" id="hud-awake-dots" title="三つ溜まると技が増える"></span>
          </div>

          <div class="integrity-vessels" id="hud-vessels" data-testid="hud-vessels" title="店の器">
            <span class="vessel-pip"></span>
            <span class="vessel-pip"></span>
            <span class="vessel-pip"></span>
          </div>

          <div class="utility-glyphs">
            <button class="glyph-btn" id="btn-sound" title="音の入切">${this.record.soundOn ? '音' : '静'}</button>
            <button class="glyph-btn" id="btn-prologue" data-testid="btn-prologue" title="店先へ戻る">店</button>
          </div>
        </header>

        <div class="ability-crest-strip" id="ability-crest-strip" data-testid="ability-crests"></div>

        <div class="guardian-strip" id="guardian-strip">
          <div class="guardian-strip-row">
            <span id="guardian-name">欠け月</span>
            <span id="guardian-sub" style="color:var(--cinnabar);font-size:11px;">ひびの入った月</span>
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
            <span id="hud-guidance">糸を引いて、放す</span>
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
      this.clearCeremonyModal();
      this.engine.preparePrologue();
      this.renderPrologueVeil(true);
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
        this.renderPrologueVeil(false);
        this.fitStage();
      },
      onAwakeningReady: (stageCleared, maxChain) => {
        this.lastClearedStage = stageCleared;
        if (stageCleared + 1 > this.record.highestStage) {
          this.record.highestStage = stageCleared + 1;
        }
        if (maxChain > this.record.longestResonance) {
          this.record.longestResonance = maxChain;
        }
        saveRecord(this.record);

        this.rollThreeAbilities(stageCleared);
        this.renderAwakeningModal(stageCleared);
      },
      onVesselBroken: (stageReached, longestChain) => {
        if (stageReached > this.record.highestStage) this.record.highestStage = stageReached;
        if (longestChain > this.record.longestResonance) this.record.longestResonance = longestChain;
        saveRecord(this.record);

        this.renderBrokenModal(stageReached, longestChain);
      },
    });

    this.fitStage();
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
    topMargin?.classList.toggle('prologue-dim', hud.phase === 'PROLOGUE');

    const actKanji = this.frame.querySelector('#hud-act-kanji');
    const actSub = this.frame.querySelector('#hud-act-sub');
    const awakeDots = this.frame.querySelector('#hud-awake-dots') as HTMLElement | null;
    if (actKanji) actKanji.textContent = hud.stageLabel;
    if (actSub) actSub.textContent = hud.stageTitle;

    if (awakeDots) {
      if (hud.phase === 'PROLOGUE' || hud.guardianTitle) {
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
      if (hud.acquiredBadges.length > 0 && hud.phase !== 'PROLOGUE') {
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
      if (hud.guardianTitle && hud.phase !== 'PROLOGUE') {
        gStrip.style.display = 'block';
        gName.textContent = hud.guardianTitle;
        if (gSub) {
          const turns = hud.guardianTurnsLeft;
          if (turns !== null) {
            gSub.textContent =
                turns <= 2
                ? `敷居まで あと${turns}手`
                : `${hud.guardianSubtitle ?? ''}  ·  あと${turns}手`;
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
      if (!hud.hasSlashAbility || hud.phase === 'PROLOGUE') {
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
      if (hud.phase === 'PROLOGUE') {
        seal.classList.remove('ready');
        guideEl.textContent = '下の金の糸を引く';
      } else if (hud.phase === 'AIMING' || hud.phase === 'TRANSITION') {
        seal.classList.remove('ready');
        guideEl.textContent = '糸を引いて、放す';
      } else if (hud.phase === 'FLIGHT') {
        if (!hud.hasSlashAbility) {
          seal.classList.remove('ready');
          guideEl.textContent = '珠が跳ねて、器を継ぐ';
        } else if (hud.slashesLeft > 0) {
          seal.classList.add('ready');
          guideEl.textContent = '画面を叩いて「一閃」';
        } else {
          seal.classList.remove('ready');
          guideEl.textContent = '一閃は使い切った';
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
        if (hud.activePearlCount > 1) parts.push(`${hud.activePearlCount}珠`);
        if (hud.chainCount > 0) parts.push(`${hud.chainCount}手`);
        chainEl.textContent = parts.join('  ');
      } else if (hud.phase === 'AIMING' || hud.phase === 'TRANSITION') {
        chainEl.textContent = `珠 ×${hud.basePearlCount}`;
      } else {
        chainEl.textContent = '';
      }
    }
  }

  private renderPrologueVeil(visible: boolean): void {
    const host = this.frame.querySelector('#prologue-host') as HTMLElement;
    if (!visible) {
      host.innerHTML = '';
      return;
    }

    const recLine =
      this.record.longestResonance > 0
        ? `いちばん奥 ${formatStageLabel(this.record.highestStage)}　上手 ${this.record.longestResonance}`
        : '今夜も、落ちた星を継ぐ';

    host.innerHTML = `
      <div class="prologue-veil" data-testid="prologue-veil">
        <div class="prologue-centerpiece">
          <div class="shop-label">よるの きんつぎや</div>
          <div class="noren" aria-label="星継">
            <div class="noren-panel">星</div>
            <div class="noren-panel">継</div>
          </div>
          <div class="prologue-poem">
            落ちた星を、<br/>金で縫う。
          </div>
          <div class="prologue-record">${recLine}</div>
        </div>

        <div class="prologue-actions">
          <div class="pull-hint">下の金の糸を、引いて放す</div>
          <button class="prologue-trigger-btn" id="btn-open-curtain" data-testid="btn-open-curtain">
            継ぐ
          </button>
        </div>
      </div>
    `;

    host.querySelector('#btn-open-curtain')?.addEventListener('click', () => {
      sound.unlock();
      sound.playKintsugiConvergence();
      this.engine.beginExpeditionAndOptionallyFire(false);
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
    const kicker = bossBonus
      ? `${formatStageLabel(stageCleared)} の核を割った`
      : `${formatStageLabel(stageCleared)} を継いだ`;
    const host = this.frame.querySelector('#ceremony-host') as HTMLElement;
    host.innerHTML = `
      <div class="ceremony-modal" data-testid="interlude-modal">
        <div class="ceremony-heading">
          <div class="ceremony-kicker">${kicker}</div>
          <div class="ceremony-title">どの技を継ぐ</div>
          <div class="ceremony-sub">店の腕が、ひとつ上がる</div>
        </div>

        <div class="talisman-list">
          ${this.choices
            .map((ab, idx) => {
              const curRank = this.engine.ranks[ab.id] ?? 0;
              const isNew = curRank === 0;
              const badgeText = isNew
                ? '新しい技'
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
          <div class="epilogue-stamp">床に落ちた</div>
          <div class="ceremony-title">今夜は、ここまで</div>

          <div class="epilogue-metrics">
            <div>届いた夜<strong>${formatStageLabel(stageReached)}</strong></div>
            <div>いちばん上手<strong>${longestChain}</strong></div>
          </div>

          <button class="prologue-trigger-btn" id="btn-mend-again" data-testid="btn-mend-again">
            もう一度、灯りをつける
          </button>
        </div>
      </div>
    `;

    host.querySelector('#btn-mend-again')?.addEventListener('click', () => {
      sound.playKintsugiConvergence();
      this.clearCeremonyModal();
      this.engine.beginExpeditionAndOptionallyFire(false);
    });
  }

  private clearCeremonyModal(): void {
    const host = this.frame.querySelector('#ceremony-host') as HTMLElement;
    if (host) host.innerHTML = '';
  }
}
