'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { BASE_PATH } from '../constants/config';

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

    // Ensure baseline config
    a.loop = true;
    a.preload = 'auto';

    try {
      localStorage.setItem(STORAGE_KEY, String(isMuted));
    } catch {
      // ignore
    }

    if (isMuted) {
      // Fade down to 0, then pause
      fadeVolume(0, {
        onDone: () => {
          a.pause();
        },
      });
    } else {
      // Start playback at 0 volume then fade up
      a.volume = 0;
      a.play()
        .then(() => {
          fadeVolume(TARGET_VOLUME);
        })
        .catch(() => {
          // Autoplay blocked; will start on interaction.
        });
    }
  }, [isMuted]);

  const toggle = () => {
    setHasInteracted(true);
    setIsMuted(prev => !prev);
  };

  // On first user interaction with the page, if unmuted, try to start playback
  useEffect(() => {
    if (!hasInteracted) return;
    if (isMuted) return;

    const a = audioRef.current;
    if (!a) return;

    if (a.paused) {
      a.play().then(() => fadeVolume(TARGET_VOLUME)).catch(() => {});
    }
  }, [hasInteracted, isMuted]);

  const ariaLabel = isMuted ? 'Unmute background music' : 'Mute background music';

  return (
    <div className={className} style={{ width: iconSize, height: iconSize }}>
      <audio ref={audioRef} src={audioSrc} data-bg-audio="true" />
      <button
        type="button"
        onClick={toggle}
        className="text-white hover:opacity-70 transition-opacity"
        aria-label={ariaLabel}
      >
        <Image
          src={`${BASE_PATH}/sound.svg`}
          alt="Sound"
          width={iconSize}
          height={iconSize}
          className={isMuted && hasInteracted ? 'opacity-70' : 'opacity-100'}
        />
      </button>
    </div>
  );
}
