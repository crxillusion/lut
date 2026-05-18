'use client';

import { useEffect, useRef } from 'react';

interface LoadingScreenProps {
  progress?: number;
  isVisible: boolean;
  onLoopEndAfterComplete?: () => void;
}

// Minimum time the loading screen stays visible (ms).
const MIN_DISPLAY_TIME = 2000;

// Vimeo background embed — muted + autoplay + loop, no controls
const VIMEO_EMBED =
  'https://player.vimeo.com/video/1164666738?autoplay=1&muted=1&loop=1&background=1&title=0&byline=0&portrait=0';

export function LoadingScreen({ isVisible, progress = 0, onLoopEndAfterComplete }: LoadingScreenProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const firedRef = useRef(false);
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    mountTimeRef.current = Date.now();
    firedRef.current = false;
  }, []);

  useEffect(() => {
    if (firedRef.current) return;
    if (clamped < 100) return;

    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    const t = window.setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      onLoopEndAfterComplete?.();
    }, remaining);

    return () => window.clearTimeout(t);
  }, [clamped, onLoopEndAfterComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Fullscreen Vimeo showreel — background=1 hides all controls.
          The iframe has a native 16/9 aspect ratio, so to make it cover the
          viewport at any aspect ratio we use the same trick as a cover video:
          size it to at least 100vw AND 100vh, then center it. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <iframe
          src={VIMEO_EMBED}
          style={{
            border: 'none',
            position: 'absolute',
            // Center
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            // Cover: whichever dimension is the constraint, the other overflows
            width: 'calc(max(100vw, 100vh * (16/9)))',
            height: 'calc(max(100vh, 100vw * (9/16)))',
          }}
          allow="autoplay; fullscreen"
          title="Showreel"
        />
      </div>

      {/* Scrim so the progress bar reads cleanly over the video */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" aria-hidden />

      {/* Progress bar — centred near the bottom */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <div className="w-[220px] md:w-[420px] h-[14px] rounded-[999px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.18)_0%,rgba(240,240,240,0.18)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.22)] backdrop-blur-[1.44px] overflow-hidden">
          <div
            className="h-full bg-white/95 transition-[width] duration-300 ease-out rounded-[999px]"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}
