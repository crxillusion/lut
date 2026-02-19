'use client';

import { useEffect, useRef, useState } from 'react';
import { BASE_PATH } from '../constants/config';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-web';

interface LoadingScreenProps {
  progress?: number;
  isVisible: boolean;
  /**
   * Fired once when `progress` reaches 100 and the animation reaches the end of its current loop.
   * Use this to begin fading out/unmounting the loading screen.
   */
  onLoopEndAfterComplete?: () => void;
}

export function LoadingScreen({ isVisible, progress = 0, onLoopEndAfterComplete }: LoadingScreenProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!dotLottie || firedRef.current) return;
    if (clamped < 100) return;

    // If we can't get a duration, fall back to firing immediately.
    const durationMs = Number(dotLottie.duration);
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      firedRef.current = true;
      onLoopEndAfterComplete?.();
      return;
    }

    // Wait until the end of the *current* loop.
    // dotLottie.currentFrame is in frames; totalFrames is frame count.
    const totalFrames = Number(dotLottie.totalFrames);
    const currentFrame = Number(dotLottie.currentFrame);
    const progressInLoop =
      Number.isFinite(totalFrames) && totalFrames > 0 && Number.isFinite(currentFrame)
        ? Math.max(0, Math.min(1, currentFrame / totalFrames))
        : 0;

    const remainingMs = Math.max(0, Math.round(durationMs * (1 - progressInLoop)));
    const t = window.setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      onLoopEndAfterComplete?.();
    }, remainingMs);

    return () => window.clearTimeout(t);
  }, [dotLottie, clamped, onLoopEndAfterComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-cover bg-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundImage: `url(${BASE_PATH}/loading-bg.jpg)`,
      }}
    >
      <div className="flex flex-col items-center">
        <div className="w-96 h-96 md:w-128 md:h-128">
          <DotLottieReact
            src={`${BASE_PATH}/5Z8KeWup2u.lottie`}
            autoplay
            loop
            dotLottieRefCallback={(instance) => {
              setDotLottie(instance);
              // `duration` is provided by @lottiefiles/dotlottie-web (milliseconds).
              if (instance?.isLoaded) {
                // eslint-disable-next-line no-console
                console.log('LoadingScreen lottie duration (ms):', instance.duration);
              } else if (instance) {
                instance.addEventListener('load', () => {
                  // eslint-disable-next-line no-console
                  console.log('LoadingScreen lottie duration (ms):', instance.duration);
                });
              }
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-[220px] md:w-[420px] h-[14px] rounded-[999px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.18)_0%,rgba(240,240,240,0.18)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.22)] backdrop-blur-[1.44px] overflow-hidden">
          <div
            className="h-full bg-white/95 transition-[width] duration-300 ease-out rounded-[999px]"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}
