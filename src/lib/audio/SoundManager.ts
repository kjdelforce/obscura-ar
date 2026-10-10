// Procedural horror soundtrack: no missing MP3 dependencies, Safari-compatible Web Audio.
export class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: OscillatorNode[] = [];
  private noise: AudioBufferSourceNode | null = null;
  private emfGain: GainNode | null = null;
  private panner: PannerNode | null = null;
  private lastWhisper = 0;
  private muted = false;
  private timer: number | null = null;

  public async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    this.ctx = ctx;
    await ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0.42;
    master.connect(ctx.destination);
    this.master = master;

    // Sub-bass, detuned layers and slow irregular volume modulation.
    for (const [frequency, level] of [[41.2, 0.075], [42.1, 0.045], [58.3, 0.03], [82.4, 0.018]]) {
      const oscillator = ctx.createOscillator();
      oscillator.type = frequency < 60 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 145;
      const gain = ctx.createGain();
      gain.gain.value = level;
      oscillator.connect(lowpass).connect(gain).connect(master);
      oscillator.start();
      this.ambience.push(oscillator);
    }

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let value = 0;
    for (let i = 0; i < data.length; i++) {
      value = (value + (Math.random() * 2 - 1) * 0.025) / 1.002;
      data[i] = Math.max(-1, Math.min(1, value));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 430;
    filter.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.11;
    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start();
    this.noise = noise;

    const emfFilter = ctx.createBiquadFilter();
    emfFilter.type = 'highpass';
    emfFilter.frequency.value = 1300;
    this.emfGain = ctx.createGain();
    this.emfGain.gain.value = 0;
    noise.connect(emfFilter).connect(this.emfGain).connect(master);

    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 2;
    this.panner.rolloffFactor = 1;
    this.panner.maxDistance = 18;
    this.panner.connect(master);
    this.timer = window.setInterval(() => {
      if (!this.muted && document.visibilityState === 'visible' && Math.random() < 0.65) {
        this.whisper();
      }
    }, 7500);
  }

  public setMuted(value: boolean) {
    this.muted = value;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(value ? 0 : 0.42, this.ctx.currentTime, 0.07);
  }

  public updateEntityPosition(x: number, y: number, z: number): void {
    if (!this.panner || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.panner.positionX.setTargetAtTime(x, t, 0.12);
    this.panner.positionY.setTargetAtTime(y, t, 0.12);
    this.panner.positionZ.setTargetAtTime(z, t, 0.12);
  }

  public setEMFIntensity(distance: number): void {
    if (!this.emfGain || !this.ctx) return;
    const proximity = Math.max(0, 1 - distance / 10);
    this.emfGain.gain.setTargetAtTime(proximity * proximity * 0.65, this.ctx.currentTime, 0.1);
  }

  // Twisted, breathy formant-like voice stabs spatialized to the monster.
  public whisper(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted || ctx.currentTime - this.lastWhisper < 4) return;
    this.lastWhisper = ctx.currentTime;
    const start = ctx.currentTime + 0.03;
    const length = 1.8 + Math.random() * 1.7;
    const base = 68 + Math.random() * 49;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.17, start + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, start + length);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 350 + Math.random() * 420;
    band.Q.value = 2.5;
    band.connect(gain).connect(this.panner ?? this.master ?? ctx.destination);
    for (const ratio of [1, 1.52, 2.07]) {
      const osc = ctx.createOscillator();
      osc.type = ratio === 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(base * ratio, start);
      osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.58, start + length);
      osc.connect(band);
      osc.start(start);
      osc.stop(start + length + 0.05);
    }
  }

  public triggerJumpscare(): void {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx, now = ctx.currentTime;
    for (const freq of [38, 73, 121, 870]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 2.1, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(22, freq * 0.35), now + 0.8);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(freq === 870 ? 0.09 : 0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain).connect(this.master);
      osc.start(now);
      osc.stop(now + 0.9);
    }
  }

  public destroy(): void {
    if (this.timer !== null && typeof window !== 'undefined') window.clearInterval(this.timer);
    this.timer = null;
    this.ambience.forEach((osc) => { try { osc.stop(); } catch {} });
    this.ambience = [];
    try { this.noise?.stop(); } catch {}
    this.noise = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.panner = null;
    this.emfGain = null;
  }
}
export const soundEngine = new SoundManager();
