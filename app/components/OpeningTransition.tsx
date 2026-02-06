import { useEffect, useRef, useState } from 'react';
import { VIDEO_PATHS } from '../constants/config';
import { createLogger } from '../utils/logger';

const openingLogger = createLogger('Opening');

interface OpeningTransitionProps {
  isPlaying: boolean;
  onComplete: () => void;
  onReady?: () => void;
}

export function OpeningTransition({ isPlaying, onComplete, onReady }: OpeningTransitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Guards to ensure we don't start playback multiple times due to re-renders.
  const playbackStartedRef = useRef(false);
  const completedRef = useRef(false);
  const readyFiredRef = useRef(false);

  // Debug state
  const startedAtMsRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying && !shouldRender) {
      openingLogger.info('OpeningTransition: isPlaying=true -> mounting');
      // Reset guards for this run.
      playbackStartedRef.current = false;
      completedRef.current = false;
      readyFiredRef.current = false;
      startedAtMsRef.current = null;

      const timer = setTimeout(() => {
        setShouldRender(true);
        setIsVisible(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    if (!isPlaying && shouldRender) {
      openingLogger.debug('OpeningTransition: isPlaying=false while mounted');
    }
  }, [isPlaying, shouldRender]);

  useEffect(() => {
    if (!isPlaying || !shouldRender || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    const fireReadyOnce = () => {
      if (readyFiredRef.current) return;
      readyFiredRef.current = true;
      openingLogger.info('OpeningTransition: ready');
      onReady?.();
    };

    const completeTransition = (reason: string) => {
      if (completedRef.current) return;
      completedRef.current = true;

      openingLogger.info('OpeningTransition: complete', {
        reason,
        currentTime: Number.isFinite(video.currentTime) ? video.currentTime : null,
        duration: Number.isFinite(video.duration) ? video.duration : null,
        paused: video.paused,
        ended: video.ended,
        readyState: video.readyState,
        networkState: video.networkState,
      });

      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
        onComplete();
      }, 150);
    };

    const handleEnded = () => {
      openingLogger.info('OpeningTransition: video ended');
      completeTransition('ended');
    };

    const handleError = () => {
      openingLogger.warn('OpeningTransition: video error');
      completeTransition('error');
    };

    const handlePlay = () => {
      openingLogger.debug('OpeningTransition: play event');
    };

    const handlePause = () => {
      openingLogger.debug('OpeningTransition: pause event');
    };

    const handleTimeUpdate = () => {
      const t0 = startedAtMsRef.current;
      const dt = t0 ? Math.round(performance.now() - t0) : null;
      // Throttle via modulo to avoid spamming logs.
      if (Math.floor(video.currentTime * 10) % 10 === 0) {
        openingLogger.debug('OpeningTransition: timeupdate', {
          dtMs: dt,
          currentTime: Number.isFinite(video.currentTime) ? Number(video.currentTime.toFixed(3)) : null,
          duration: Number.isFinite(video.duration) ? Number(video.duration.toFixed(3)) : null,
          paused: video.paused,
          readyState: video.readyState,
          networkState: video.networkState,
        });
      }
    };

    const begin = (reason: string) => {
      if (playbackStartedRef.current) {
        openingLogger.debug(`OpeningTransition: begin skipped (already started) reason=${reason}`);
        return;
      }
      playbackStartedRef.current = true;
      startedAtMsRef.current = performance.now();

      fireReadyOnce();
      openingLogger.info(`OpeningTransition: play() (reason=${reason})`);

      try {
        video.currentTime = 0;
      } catch {
        // ignore
      }
      video.playbackRate = 1.0;

      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('timeupdate', handleTimeUpdate);

      void video.play().catch((err) => {
        openingLogger.warn('OpeningTransition: play() failed, completing immediately', err);
        completeTransition('play_failed');
      });
    };

    // Diagnostics
    openingLogger.debug('OpeningTransition: starting effect', {
      readyState: video.readyState,
      networkState: video.networkState,
      src: video.currentSrc || video.src,
    });

    const handleCanPlay = () => {
      openingLogger.info('OpeningTransition: canplay');
      begin('canplay');
    };

    const handleLoadedData = () => {
      openingLogger.debug('OpeningTransition: loadeddata');
      fireReadyOnce();
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    // If already ready enough, start immediately.
    if (video.readyState >= 3) {
      begin('readyState>=3');
    } else {
      if (video.readyState === 0) {
        openingLogger.debug('OpeningTransition: video.load()');
        video.load();
      }
    }

    // Watchdog: force completion if ended never fires (e.g. autoplay quirks).
    // Use metadata duration once known; fall back to a safe cap.
    const MAX_FALLBACK_MS = 10000;
    const watchdogId = window.setInterval(() => {
      if (completedRef.current) {
        window.clearInterval(watchdogId);
        return;
      }

      const t0 = startedAtMsRef.current;
      if (!t0) return;

      const dt = performance.now() - t0;
      const duration = Number.isFinite(video.duration) ? video.duration : null;

      // If we know duration and we're at/near the end, complete.
      if (duration && Number.isFinite(video.currentTime) && video.currentTime >= duration - 0.05) {
        openingLogger.warn('OpeningTransition: watchdog completing near end');
        completeTransition('watchdog_near_end');
        window.clearInterval(watchdogId);
        return;
      }

      if (dt >= MAX_FALLBACK_MS) {
        openingLogger.warn('OpeningTransition: watchdog timeout, forcing complete');
        completeTransition('watchdog_timeout');
        window.clearInterval(watchdogId);
      }
    }, 250);

    return () => {
      window.clearInterval(watchdogId);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [isPlaying, shouldRender, onComplete, onReady]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[90] bg-black transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <video
        ref={videoRef}
        src={VIDEO_PATHS.opening}
        className="w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
        // Ensure iOS/macOS Safari doesn't attempt fullscreen UI
        controls={false}
      />
    </div>
  );
}
