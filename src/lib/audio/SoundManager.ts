export class SoundManager {
  private ctx: AudioContext | null = null;
  private panner: PannerNode | null = null;
  private emfGain: GainNode | null = null;
  private whiteNoiseNode: AudioBufferSourceNode | null = null;
  private stingerBuffer: AudioBuffer | null = null;

  public async init(): Promise<void> {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.setValueAtTime(0, this.ctx.currentTime);
      listener.positionY.setValueAtTime(0, this.ctx.currentTime);
      listener.positionZ.setValueAtTime(0, this.ctx.currentTime);
    } else {
      listener.setPosition(0, 0, 0);
    }

    this.panner = this.ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 20;
    this.panner.rolloffFactor = 1.8;
    this.panner.connect(this.ctx.destination);

    this.setupEMFStatic();
    this.stingerBuffer = await this.loadBuffer('/assets/audio/jumpscare_stinger.mp3');
  }

  private setupEMFStatic(): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.whiteNoiseNode = this.ctx.createBufferSource();
    this.whiteNoiseNode.buffer = noiseBuffer;
    this.whiteNoiseNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 4.0;

    this.emfGain = this.ctx.createGain();
    this.emfGain.gain.value = 0.0;

    this.whiteNoiseNode.connect(filter);
    filter.connect(this.emfGain);
    this.emfGain.connect(this.ctx.destination);
    this.whiteNoiseNode.start();
  }

  public updateEntityPosition(x: number, y: number, z: number): void {
    if (!this.panner || !this.ctx) return;
    const time = this.ctx.currentTime;
    if (this.panner.positionX) {
      this.panner.positionX.setTargetAtTime(x, time, 0.1);
      this.panner.positionY.setTargetAtTime(y, time, 0.1);
      this.panner.positionZ.setTargetAtTime(z, time, 0.1);
    } else {
      this.panner.setPosition(x, y, z);
    }
  }

  public setEMFIntensity(distance: number): void {
    if (!this.emfGain || !this.ctx) return;
    const clampedDist = Math.max(0.5, Math.min(10, distance));
    const intensity = Math.pow(1 - (clampedDist - 0.5) / 9.5, 2) * 0.8;
    this.emfGain.gain.setTargetAtTime(intensity, this.ctx.currentTime, 0.05);
  }

  public triggerJumpscare(): void {
    if (!this.ctx) return;
    if (this.stingerBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.stingerBuffer;
      const gain = this.ctx.createGain();
      gain.gain.value = 1.0;
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    }
  }

  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.ctx.decodeAudioData(arrayBuffer);
    } catch {
      return null;
    }
  }
}

export const soundEngine = new SoundManager();
