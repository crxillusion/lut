import { useCallback } from 'react';
import { SOUND_PATHS } from '../constants/config';
import { soundLogger } from '../utils/logger';

export function useNavigationSound() {
  const playSound = useCallback((soundType: 'forward' | 'backward') => {
    const src = SOUND_PATHS[soundType];
    soundLogger.info(`🔊 playSound("${soundType}") → src: ${src}`);
    try {
      const audio = new Audio(src);
      audio.volume = 0.5;
      const playPromise = audio.play();
      playPromise
        .then(() => {
          soundLogger.debug(`✅ Sound "${soundType}" playing`);
        })
        .catch((err) => {
          soundLogger.warn(`⚠️ Could not play "${soundType}" sound:`, (err as Error).message);
        });
    } catch (err) {
      soundLogger.error(`❌ Error creating Audio for "${soundType}":`, err);
    }
  }, []);

  return { playSound };
}
