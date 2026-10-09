import { useEffect } from 'react';
import { soundEngine } from '@/lib/audio/SoundManager';

export function useSpatialAudio(entityDistance: number, entityPos: [number, number, number]) {
  useEffect(() => {
    soundEngine.updateEntityPosition(entityPos[0], entityPos[1], entityPos[2]);
    soundEngine.setEMFIntensity(entityDistance);
  }, [entityDistance, entityPos]);
}
