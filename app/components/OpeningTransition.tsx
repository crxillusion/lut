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

  useEffect(() => {
    if (isPlaying && !shouldRender) {
      openingLogger.info('OpeningTransition: isPlaying=true -> mounting');
      // Reset guards for this run.
      playbackStartedRef.current = false;
      completedRef.current = false;
      readyFiredRef.current = false;

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

    const completeTransition = () => {
      if (completedRef.current) return;
      completedRef.current = true;

      openingLogger.info('OpeningTransition: complete');
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
        onComplete();
      }, 150);
    };

    const handleEnded = () => {
      openingLogger.info('OpeningTransition: video ended');
      completeTransition();
    };

    const begin = (reason: string) => {
      if (playbackStartedRef.current) {
        openingLogger.debug(`OpeningTransition: begin skipped (already started) reason=${reason}`);
        return;
      }
      playbackStartedRef.current = true;

      fireReadyOnce();
      openingLogger.info(`OpeningTransition: play() (reason=${reason})`);

      try {
        video.currentTime = 0;
      } catch {
        // ignore
      }
      video.playbackRate = 1.0;
      video.addEventListener('ended', handleEnded);

      void video.play().catch((err) => {
        openingLogger.warn('OpeningTransition: play() failed, completing immediately', err);
        completeTransition();
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

    return () => {
      video.removeEventListener('ended', handleEnded);
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
      />
    </div>
  );
}
