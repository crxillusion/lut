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

  useEffect(() => {
    if (isPlaying && !shouldRender) {
      openingLogger.info('OpeningTransition: isPlaying=true -> mounting');
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
    let hasCompleted = false;
    let readyFired = false;

    const fireReadyOnce = () => {
      if (readyFired) return;
      readyFired = true;
      openingLogger.info('OpeningTransition: ready');
      onReady?.();
    };

    openingLogger.debug('OpeningTransition: starting effect', {
      readyState: video.readyState,
      networkState: video.networkState,
      src: video.currentSrc || video.src,
    });

    const completeTransition = () => {
      if (hasCompleted) return;
      hasCompleted = true;
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

    const startPlayback = () => {
      fireReadyOnce();
      openingLogger.info('OpeningTransition: play()');
      video.currentTime = 0;
      video.playbackRate = 1.0;
      video.addEventListener('ended', handleEnded);
      void video.play().catch((err) => {
        openingLogger.warn('OpeningTransition: play() failed, completing immediately', err);
        completeTransition();
      });
    };

    if (video.readyState >= 3) {
      startPlayback();
    } else {
      const handleCanPlay = () => {
        openingLogger.info('OpeningTransition: canplay');
        startPlayback();
      };
      video.addEventListener('canplay', handleCanPlay, { once: true });

      const handleLoadedData = () => {
        // Slightly earlier than canplay on some browsers.
        openingLogger.debug('OpeningTransition: loadeddata');
        fireReadyOnce();
      };
      video.addEventListener('loadeddata', handleLoadedData, { once: true });

      if (video.readyState === 0) {
        openingLogger.debug('OpeningTransition: video.load()');
        video.load();
      }

      return () => {
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
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
