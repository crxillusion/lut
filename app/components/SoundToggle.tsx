'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { BASE_PATH } from '../constants/config';
import { createLogger } from '../utils/logger';

const audioLogger = createLogger('Audio');

const STORAGE_KEY = 'lut:audioMuted';
const FADE_MS = 450;
const TARGET_VOLUME = 0.6;

interface SoundToggleProps {
  iconSize?: number;
  className?: string;
}

export function SoundToggle({ iconSize = 45, className }: SoundToggleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioSrc = useMemo(
    () => `${BASE_PATH}/Jesse Gillis - Time to Meditate - Soothing Eternal Synth Pads Soft High Bells.wav`,
    []
  );

  const clearFadeTimer = () => {
    if (fadeTimerRef.current != null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const fadeVolume = (to: number, { onDone }: { onDone?: () => void } = {}) => {
    const a = audioRef.current;
    if (!a) return;

    clearFadeTimer();

    const from = a.volume;
    const start = performance.now();

    fadeTimerRef.current = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / FADE_MS);
      const next = from + (to - from) * t;
      a.volume = Math.max(0, Math.min(1, next));

      if (t >= 1) {
        clearFadeTimer();
        onDone?.();
      }
    }, 16);
  };

  const snapshot = () => {
    const a = audioRef.current;
    if (!a) return null;
    return {
      paused: a.paused,
      muted: a.muted,
      volume: a.volume,
      currentTime: Number.isFinite(a.currentTime) ? Number(a.currentTime.toFixed(3)) : a.currentTime,
      readyState: a.readyState,
      networkState: a.networkState,
      src: a.currentSrc || a.src,
    };
  };

  // Initialize persisted mute state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'false') setIsMuted(false);
      else setIsMuted(true);
    } catch {
      setIsMuted(true);
    }

    return () => {
      clearFadeTimer();
    };
  }, []);

  // Apply mute state to audio element (keep muted=false so we can fade volume)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    audioLogger.debug('SoundToggle state changed', { isMuted, hasInteracted, snapshot: snapshot() });

    // Ensure baseline config
    a.loop = true;
    a.preload = 'auto';

    try {
      localStorage.setItem(STORAGE_KEY, String(isMuted));
    } catch {
      // ignore
    }

    if (isMuted) {
      audioLogger.debug('Muting: fade volume to 0 then pause');
      // Fade down to 0, then pause
      fadeVolume(0, {
        onDone: () => {
          audioLogger.debug('Fade-to-0 complete; pausing audio', { snapshot: snapshot() });
          a.pause();
        },
      });
    } else {
      // If audio is already playing (e.g. started by the global click handler),
      // don't restart it or force volume back to 0. Just fade up to the target.
      if (!a.paused) {
        audioLogger.debug('Unmuting: audio already playing; fading to target', { snapshot: snapshot() });
        fadeVolume(TARGET_VOLUME);
        return;
      }

      audioLogger.debug('Unmuting: play at vol=0 then fade up', { snapshot: snapshot() });
      // Start playback at 0 volume then fade up
      a.volume = 0;
      a.play()
        .then(() => {
          audioLogger.info('SoundToggle play() resolved; fading to target', { snapshot: snapshot() });
          fadeVolume(TARGET_VOLUME);
        })
        .catch(err => {
          audioLogger.warn('SoundToggle play() rejected (likely autoplay policy)', {
            name: err?.name,
            message: err?.message,
            snapshot: snapshot(),
          });
          // Autoplay blocked; will start on interaction.
        });
    }
  }, [isMuted]);

  const toggle = () => {
    const a = audioRef.current;

    audioLogger.debug('Sound toggle clicked', { fromMuted: isMuted, snapshot: snapshot() });
    setHasInteracted(true);

    // Decide action based on actual playback/volume, not just local UI state.
    // If music is currently audible/playing, a click should MUTE.
    const isActuallyPlaying = !!a && !a.paused && a.volume > 0;

    if (isActuallyPlaying) {
      audioLogger.debug('Toggle: audio is actually playing; muting');

      // If the state is already muted, the effect won't re-run. Apply the fade
      // directly so the mute is always smooth, then pause once volume hits 0.
      if (a) {
        fadeVolume(0, {
          onDone: () => {
            audioLogger.debug('Toggle fade-to-0 complete; pausing audio', { snapshot: snapshot() });
            a.pause();
          },
        });
      }

      setIsMuted(true);
      return;
    }

    audioLogger.debug('Toggle: audio not playing/audible; unmuting');
    setIsMuted(false);
  };

  // On first user interaction with the page, if unmuted, try to start playback
  useEffect(() => {
    if (!hasInteracted) return;
    if (isMuted) return;

    const a = audioRef.current;
    if (!a) return;

    if (a.paused) {
      audioLogger.debug('User has interacted and audio is paused; retrying play()', { snapshot: snapshot() });
      a.play()
        .then(() => {
          audioLogger.info('Retry play() resolved; fading to target', { snapshot: snapshot() });
          fadeVolume(TARGET_VOLUME);
        })
        .catch(err => {
          audioLogger.warn('Retry play() rejected', { name: err?.name, message: err?.message, snapshot: snapshot() });
        });
    }
  }, [hasInteracted, isMuted]);

  const ariaLabel = isMuted ? 'Unmute background music' : 'Mute background music';

  return (
    <div
      className={className}
    >
      <audio ref={audioRef} src={audioSrc} data-bg-audio="true" />
      <button
        type="button"
        onClick={toggle}
        className="text-white hover:opacity-70 transition-opacity flex items-center justify-center w-full h-full leading-none"
        aria-label={ariaLabel}
      >
        <Image
          src={`${BASE_PATH}/sound.svg`}
          alt="Sound"
          width={iconSize}
          height={iconSize}
          className={`${isMuted && hasInteracted ? 'opacity-70' : 'opacity-100'} block`}
        />
      </button>
    </div>
  );
}
