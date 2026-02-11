'use client';

import { useEffect } from 'react';

/**
 * Tries to start background audio once the loading screen ends.
 *
 * Note: most browsers require a user gesture to start audio. This hook will try,
 * and if blocked, it registers a one-time pointer/keyboard listener to retry.
 */
export function useBgAudioAutoplay({
  enabled,
  selector = 'audio[data-bg-audio="true"]',
}: {
  enabled: boolean;
  selector?: string;
}) {
  useEffect(() => {
    if (!enabled) return;

    const audio = document.querySelector<HTMLAudioElement>(selector);
    if (!audio) return;

    const tryPlay = () => {
      // attempt play; ignore errors (autoplay policies)
      audio.play().catch(() => {
        // blocked
      });
    };

    tryPlay();

    const onFirstInteraction = () => {
      tryPlay();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, [enabled, selector]);
}
