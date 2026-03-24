import { useCallback } from 'react';
import { SOUND_PATHS } from '../constants/config';
import { audioPool } from '../utils/audioPool';
import { soundLogger } from '../utils/logger';

export function useNavigationSound() {
  const playSound = useCallback((soundType: 'forward' | 'backward') => {
    const src = SOUND_PATHS[soundType];
    soundLogger.info(`🔊 playSound("${soundType}") → src: ${src}`);
    // audioPool reuses the pre-loaded HTMLAudioElement, avoiding a CDN round-trip
    audioPool.play(src, 0.5);
  }, []);

  return { playSound };
}
