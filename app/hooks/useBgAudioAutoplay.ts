'use client';

import { useEffect } from 'react';
import { createLogger } from '../utils/logger';

const audioLogger = createLogger('Audio');

/**
 * Best-effort background audio bootstrap.
 *
 * We do NOT attempt autoplay on load and we do NOT try on scroll/keydown/etc.
 * Most browsers require an explicit user activation.
 *
 * This hook registers a one-time global click handler (anywhere on the page) to
 * attempt playback after the loading screen is gone.
 */
export function useBgAudioAutoplay({
  enabled,
  selector = 'audio[data-bg-audio="true"]',
}: {
  enabled: boolean;
  selector?: string;
}) {
  useEffect(() => {
    if (!enabled) {
      audioLogger.debug('Global click-to-play hook disabled', { enabled, selector });
      return;
    }

    let cancelled = false;

    const findAudio = () => document.querySelector<HTMLAudioElement>(selector);

    const waitForAudio = async () => {
      const start = performance.now();
      let audio = findAudio();

      while (!cancelled && !audio && performance.now() - start < 3000) {
        await new Promise(r => window.setTimeout(r, 50));
        audio = findAudio();
      }

      return audio;
    };

    const tryPlay = async (reason: string) => {
      const audio = await waitForAudio();
      if (cancelled) return;

      if (!audio) {
        audioLogger.warn('Click-to-play: audio element not found (timeout)', { selector, reason });
        return;
      }

      const snapshot = () => ({
        paused: audio.paused,
        muted: audio.muted,
        volume: audio.volume,
        currentTime: Number.isFinite(audio.currentTime)
          ? Number(audio.currentTime.toFixed(3))
          : audio.currentTime,
        readyState: audio.readyState,
        networkState: audio.networkState,
        src: audio.currentSrc || audio.src,
      });

      // Ensure the click actually results in audible sound.
      // This app keeps the audio volume at 0 when "muted".
      // We intentionally do NOT touch localStorage here; the sound button remains
      // the source of truth for the persisted mute preference.
      if (audio.volume === 0) {
        audioLogger.debug('Click-to-play: raising volume from 0 to make audio audible');
        audio.volume = 0.6;
      }

      audioLogger.debug('Attempting audio.play()', {
        reason,
        hasUserActivation:
          typeof navigator !== 'undefined' && 'userActivation' in navigator
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (navigator as any).userActivation?.hasBeenActive
            : undefined,
        ...snapshot(),
      });

      try {
        await audio.play();
        audioLogger.info('audio.play() resolved', { reason, ...snapshot() });
      } catch (err: any) {
        audioLogger.warn('audio.play() rejected', {
          reason,
          name: err?.name,
          message: err?.message,
          ...snapshot(),
        });
      }
    };

    const onAnyClick = (ev: MouseEvent) => {
      audioLogger.debug('Global click detected; attempting play()', {
        target: (ev.target as HTMLElement | null)?.tagName,
      });
      void tryPlay('global-click');
    };

    // Capture phase so we get the click even if something stops propagation.
    window.addEventListener('click', onAnyClick, { once: true, capture: true });

    audioLogger.debug('Registered one-time global click-to-play handler', { selector });

    return () => {
      cancelled = true;
      window.removeEventListener('click', onAnyClick, true as any);
    };
  }, [enabled, selector]);
}
