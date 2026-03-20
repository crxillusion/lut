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
  const mountTimeRef = useRef<number>(Date.now());
  // Minimum time to display the loading screen (in ms) - ensures animation is visible
  const MIN_DISPLAY_TIME = 2500;

  useEffect(() => {
    console.log('[LoadingScreen] Component mounted, isVisible:', isVisible);
    mountTimeRef.current = Date.now();
  }, [isVisible]);

  useEffect(() => {
    if (!dotLottie || firedRef.current) return;
    if (clamped < 100) return;

    // Ensure minimum display time has passed
    const elapsedMs = Date.now() - mountTimeRef.current;
    if (elapsedMs < MIN_DISPLAY_TIME) {
      console.log('[LoadingScreen] Loading complete but MIN_DISPLAY_TIME not reached. Delaying callback:', {
        elapsedMs,
        remaining: MIN_DISPLAY_TIME - elapsedMs,
      });
      const delayMs = MIN_DISPLAY_TIME - elapsedMs;
      const t = window.setTimeout(() => {
        if (firedRef.current) return;
        firedRef.current = true;
        console.log('[LoadingScreen] MIN_DISPLAY_TIME reached, firing onLoopEndAfterComplete');
        onLoopEndAfterComplete?.();
      }, delayMs);
      return () => window.clearTimeout(t);
    }

    // If we can't get a duration, fall back to firing immediately.
    const durationMs = Number(dotLottie.duration);
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      firedRef.current = true;
      console.log('[LoadingScreen] No valid duration, firing onLoopEndAfterComplete immediately');
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
    console.log('[LoadingScreen] Scheduling onLoopEndAfterComplete in', remainingMs, 'ms');
    const t = window.setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      console.log('[LoadingScreen] Loop end reached, firing onLoopEndAfterComplete');
      onLoopEndAfterComplete?.();
    }, remainingMs);

    return () => window.clearTimeout(t);
  }, [dotLottie, clamped, onLoopEndAfterComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1920'%3E%3Crect fill='%23000000' width='1920' height='1920'/%3E%3C/svg%3E")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background picture element with modern format fallbacks */}
      <picture
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <source srcSet={`${BASE_PATH}/loading-bg.avif`} type="image/avif" />
        <source srcSet={`${BASE_PATH}/loading-bg.webp`} type="image/webp" />
        <img
          src={`${BASE_PATH}/loading-bg.jpg`}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          decoding="sync"
          loading="eager"
        />
      </picture>
      <div className="flex flex-col items-center">
        {/* Lottie animation only */}
        <div className="w-96 h-96 md:w-128 md:h-128 relative overflow-hidden">
          <DotLottieReact
            src={`${BASE_PATH}/5Z8KeWup2u.lottie`}
            autoplay
            loop
            speed={1}
            dotLottieRefCallback={(instance) => {
              console.log('[LoadingScreen] DotLottieReact callback fired', {
                instanceExists: !!instance,
                isLoaded: instance?.isLoaded,
                canvas: instance?.canvas ? 'exists' : 'null',
              });
              if (instance?.isLoaded) {
                console.log('[LoadingScreen] Lottie loaded immediately - duration (ms):', instance.duration);
                setDotLottie(instance);
              } else if (instance) {
                console.log('[LoadingScreen] Lottie not loaded yet, waiting for load event');
                instance.addEventListener('load', () => {
                  console.log('[LoadingScreen] Lottie load event fired - duration (ms):', instance.duration);
                  setDotLottie(instance);
                });
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
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
