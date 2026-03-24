'use client';

import { useEffect, useMemo } from 'react';
import { SOUND_PATHS } from '../constants/config';
import { audioPool } from '../utils/audioPool';

export function useAudioPreloader(audioPaths: string[]) {
  // Stable, de-duped list — keyed by joined string so a new array with the
  // same URLs doesn't re-fire the effect.
  const uniqueAudioPaths = useMemo(
    () => Array.from(new Set(audioPaths)).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [audioPaths.join('|')]
  );

  useEffect(() => {
    if (uniqueAudioPaths.length === 0) return;

    // Create real HTMLAudioElement instances and call .load() so the browser
    // buffers the audio bytes into each element's own media pipeline cache.
    // fetch() only warms the HTTP cache which is NOT reused by Audio elements.
    audioPool.prime(uniqueAudioPaths);
    console.debug(`✅ Audio pool primed (${uniqueAudioPaths.length} files)`);
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
