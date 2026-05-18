'use client';

import { useEffect, useRef } from 'react';
import { VIDEO_PATHS } from '../constants/config';

interface LoadingScreenProps {
  progress?: number;
  isVisible: boolean;
  onLoopEndAfterComplete?: () => void;
}

// Minimum time the loading screen stays visible (ms).
const MIN_DISPLAY_TIME = 2000;

const LOADING_VIDEO_SRC = VIDEO_PATHS.loading;

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
      {/* Fullscreen background video — cover-fills the viewport like object-fit:cover */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <video
          src={LOADING_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'calc(max(100vw, 100vh * (16/9)))',
            height: 'calc(max(100vh, 100vw * (9/16)))',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Scrim so the progress bar reads cleanly over the video */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" aria-hidden />

      {/* Progress bar with LOADING label inside — centred, raised from bottom */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2">
        <div
            className="relative w-[761px] h-[31px] rounded-[999px] overflow-hidden"
            style={{
              border: '0.5px solid #FFFFFF',
              boxShadow: '7px 9px 14.4px 0px #00000047',
              background: 'radial-gradient(66.79% 318.35% at 34.13% -210.76%, rgba(185, 176, 155, 0.2) 0%, rgba(240, 240, 240, 0.2) 100%)',
            }}
          >
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out rounded-[999px]"
            style={{
              width: `${clamped}%`,
              border: '0.5px solid #FFFFFF',
              boxShadow: '7px 9px 14.4px 0px #00000047',
              background: 'radial-gradient(66.79% 318.35% at 34.13% -210.76%, rgba(185, 176, 155, 0.62) 0%, rgba(240, 240, 240, 0.62) 100%)',
            }}
          />
          {/* Label */}
          <span
            className="absolute inset-0 flex items-center justify-center text-white select-none"
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: 18,
              lineHeight: '100%',
              letterSpacing: '0.28em',
            }}
          >
            LOADING
          </span>
        </div>
      </div>
    </div>
  );
}
