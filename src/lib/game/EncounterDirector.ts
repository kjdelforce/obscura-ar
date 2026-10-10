/**
 * Deterministic, frame-rate-independent threat director.
 * Drives pacing without calling React setters every animation frame.
 */
export type ThreatPhase = 'dormant' | 'stalking' | 'manifesting' | 'hunting' | 'recovering';
export interface ThreatFrame {
  phase: ThreatPhase;
  speed: number;
  presence: number;
  mournerVisible: boolean;
  teleport: boolean;
  cue: 'none' | 'whisper' | 'laugh' | 'sting';
}
export class EncounterDirector {
  private elapsed = 0;
  private phaseTime = 0;
  private phase: ThreatPhase = 'dormant';
  private cooldown = 0;
  private voiceCooldown = 8;
  private manifestations = 0;

  update(dt: number, distance: number, observed: boolean, torch: boolean): ThreatFrame {
    dt = Math.max(0, Math.min(0.1, dt));
    this.elapsed += dt;
    this.phaseTime += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.voiceCooldown -= dt;
    let cue: ThreatFrame['cue'] = 'none';
    let teleport = false;
    const change = (next: ThreatPhase) => { this.phase = next; this.phaseTime = 0; };
    switch (this.phase) {
      case 'dormant':
        if (this.phaseTime > 7) { change('stalking'); cue = 'whisper'; }
        break;
      case 'stalking':
        if (this.phaseTime > 10 || distance < 4.7) { change('manifesting'); cue = 'laugh'; this.manifestations++; }
        break;
      case 'manifesting':
        if (this.phaseTime > 3.1) { change('hunting'); cue = 'sting'; }
        break;
      case 'hunting':
        if (distance < 1.35 && this.cooldown === 0) {
          teleport = true;
          this.cooldown = 9;
          change('recovering');
          cue = 'sting';
        } else if (this.phaseTime > 20) { change('recovering'); teleport = true; }
        break;
      case 'recovering':
        if (this.phaseTime > 8) change('stalking');
        break;
    }
    if (this.voiceCooldown <= 0 && cue === 'none' && this.phase !== 'dormant') {
      cue = observed && torch ? 'laugh' : 'whisper';
      this.voiceCooldown = 12 + Math.random() * 9;
    }
    const presence = this.phase === 'manifesting' ? Math.min(1, this.phaseTime / 2) : this.phase === 'hunting' ? 1 : this.phase === 'stalking' ? 0.5 : 0.16;
    const speed = this.phase === 'hunting' ? (torch && observed ? 0.14 : 2.4 + Math.min(this.manifestations, 4) * 0.16) : this.phase === 'stalking' ? 0.43 : 0;
    const mournerVisible = this.phase !== 'dormant' && this.phase !== 'recovering' && !(torch && observed && this.phase === 'manifesting');
    return { phase: this.phase, speed, presence, mournerVisible, teleport, cue };
  }
}