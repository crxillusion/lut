'use client';

import { useEffect, useMemo } from 'react';
import { SOUND_PATHS } from '../constants/config';

export function useAudioPreloader(audioPaths: string[]) {
  // Ensure stable, de-duped ordering
  const uniqueAudioPaths = useMemo(
    () => Array.from(new Set(audioPaths)).filter(Boolean),
    [audioPaths]
  );

  useEffect(() => {
    let isCancelled = false;

    // Audio files are typically much smaller than videos, so we can preload all of them
    // We'll use a simple fetch strategy to warm the browser cache with CORS mode
    const preloadAudio = async () => {
      const audioUrls = uniqueAudioPaths;

      try {
        await Promise.all(
          audioUrls.map((url) =>
            fetch(url, { 
              cache: 'default',
              mode: 'cors',
              credentials: 'omit'
            })
              .then((response) => {
                if (!response.ok) {
                  console.warn(`Failed to preload audio: ${url} (status ${response.status})`);
                }
              })
              .catch((err) => {
                console.warn(`Error preloading audio ${url}:`, err.message);
              })
          )
        );

        if (!isCancelled) {
          console.debug(`✅ All audio files preloaded (${audioUrls.length} files)`);
        }
      } catch (err) {
        console.warn('Error during audio preload batch:', err);
      }
    };

    preloadAudio();

    return () => {
      isCancelled = true;
    };
  }, [uniqueAudioPaths]);
}

// Preload all known audio paths
export function useAllAudioPreloader() {
  const allAudioPaths = useMemo(
    () => Object.values(SOUND_PATHS).filter((p): p is string => typeof p === 'string'),
    []
  );

  useAudioPreloader(allAudioPaths);
}
