// Acoustic Worldview Synthesizer for 『星継 — HOSHITSUGI』
// Rate-limited crystalline Sanukite/Porcelain chimes, orb pickup bells, koto lightning snaps,
// ceramic shatter transients, and singing-bowl sub-harmonics with zero audio clipping.

class KintsugiAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private lastChimeAt = 0;
  private lastReleaseAt = 0;
  private lastShatterAt = 0;
  private lastTwinAt = 0;
  private lastLightningAt = 0;

  private readonly scaleHz = [
    293.66,  // D4
    329.63,  // E4
    349.23,  // F4
    440.0,   // A4
    493.88,  // B4
    587.33,  // D5
    659.25,  // E5
    698.46,  // F5
    880.0,   // A5
    987.77,  // B5
    1174.66, // D6
    1318.51, // E6
    1396.91, // F6
    1760.0,  // A6
    1975.53, // B6
    2349.32, // D7
  ];

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensure();
  }

  public playThreadTick(stepIndex: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freq = this.scaleHz[Math.abs(stepIndex) % 7] * 2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.016, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playPearlRelease(index: number): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastReleaseAt < 0.022) return;
    this.lastReleaseAt = now;

    const base = this.scaleHz[index % 8];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.065);

    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playPorcelainChime(chainCount: number, isVermilion = false): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (!isVermilion && now - this.lastChimeAt < 0.022) return;
    this.lastChimeAt = now;

    const rawStep = Math.floor((chainCount - 1) / 3);
    const idx =
      rawStep < this.scaleHz.length
        ? Math.max(0, rawStep)
        : 10 + ((chainCount + rawStep) % 6);
    const detune = 1 + ((chainCount % 5) - 2) * 0.0025;
    const f0 = this.scaleHz[idx] * detune;

    const partials = isVermilion ? [1, 1.5, 2.756] : [1, 2.756];
    partials.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0 * mult, now);

      const peak = i === 0 ? (isVermilion ? 0.075 : 0.052) : 0.018;
      const decay = i === 0 ? 0.22 : 0.11;
      gain.gain.setValueAtTime(peak, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.015);
    });
  }

  /** Crystalline ascending bell when collecting a `+2珠` Golden Orb on the board */
  public playOrbPickup(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1174.66, 1760.0].forEach((hz, i) => {
      const t = now + i * 0.04;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, t);
      g.gain.setValueAtTime(0.065, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /** Crisp golden koto-spark snap when `雷光の鎖` arcs between vessels */
  public playGoldLightning(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastLightningAt < 0.055) return;
    this.lastLightningAt = now;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1760, now);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.09);

    const lp = ctx.createBiquadFilter();
    lp.type = 'bandpass';
    lp.frequency.setValueAtTime(2200, now);
    lp.Q.value = 3.0;

    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

    osc.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playPorcelainShatter(isCore = false): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (!isCore && now - this.lastShatterAt < 0.04) return;
    this.lastShatterAt = now;

    const len = Math.floor(ctx.sampleRate * 0.085);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.2));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(isCore ? 2500 : 3600, now);
    hp.Q.value = 2.2;

    const ng = ctx.createGain();
    ng.gain.setValueAtTime(isCore ? 0.16 : 0.095, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

    src.connect(hp);
    hp.connect(ng);
    ng.connect(ctx.destination);
    src.start(now);

    const chord = isCore ? [293.66, 587.33, 880.0, 1174.66] : [1174.66, 1760.0];
    chord.forEach((hz, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, now + idx * 0.014);
      g.gain.setValueAtTime(isCore ? 0.065 : 0.035, now + idx * 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (isCore ? 0.62 : 0.26));
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + idx * 0.014);
      osc.stop(now + (isCore ? 0.65 : 0.28));
    });
  }

  public playKintsugiConvergence(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    const sub = ctx.createOscillator();
    const subG = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(146.83, now);
    sub.frequency.exponentialRampToValueAtTime(73.42, now + 0.36);
    subG.gain.setValueAtTime(0.18, now);
    subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    sub.connect(subG);
    subG.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.42);

    const notes = [587.33, 659.25, 880.0, 987.77, 1174.66, 1760.0];
    notes.forEach((hz, i) => {
      const t = now + i * 0.018;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(hz, t);
      g.gain.setValueAtTime(0.055, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playAstrolabeTwin(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastTwinAt < 0.035) return;
    this.lastTwinAt = now;

    [880.0, 1318.51].forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, now + i * 0.02);
      g.gain.setValueAtTime(0.04, now + i * 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.02);
      osc.stop(now + 0.22);
    });
  }

  public playActComplete(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [293.66, 440.0, 587.33, 659.25, 880.0, 1174.66].forEach((hz, i) => {
      const t = now + i * 0.065;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, t);
      g.gain.setValueAtTime(0.065, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  }
}

export const sound = new KintsugiAudioEngine();
