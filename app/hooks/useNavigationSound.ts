import { useCallback } from 'react';
import { SOUND_PATHS } from '../constants/config';

export function useNavigationSound() {
  const playSound = useCallback((soundType: 'forward' | 'backward') => {
    try {
      const audio = new Audio(SOUND_PATHS[soundType]);
      audio.volume = 0.5; // Set volume to 50% to avoid being too loud
      audio.play().catch((err) => {
        // Silently fail if audio can't play (e.g., user hasn't interacted with page yet)
        console.debug(`Could not play ${soundType} sound:`, err.message);
      });
    } catch (err) {
      console.debug(`Error creating audio element for ${soundType}:`, err);
    }
  }, []);

  return { playSound };
}
