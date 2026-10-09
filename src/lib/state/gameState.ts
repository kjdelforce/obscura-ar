export interface EntityData {
  id: string;
  type: 'WATCHER' | 'PHOTOPHOBE' | 'SOUND_DEMON';
  position: [number, number, number];
  distance: number;
  state: 'STALKING' | 'FROZEN' | 'ATTACK';
}

export interface SigilData {
  id: string;
  position: [number, number, number];
  chargeProgress: number; // 0.0 to 1.0
  isExorcised: boolean;
}

export interface GameState {
  batteryLevel: number;
  isTorchOn: boolean;
  sanity: number;
  interference: number;
  exorcisedCount: number;
  totalSigils: number;
  jumpscareActive: boolean;
}
