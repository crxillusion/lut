'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import { VideoBackground } from './VideoBackground';
import type { TransitionDirection } from '../constants/config';
import { homeLogger } from '../utils/logger';

interface TransitionVideoProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  forwardSrc: string;
  reverseSrc: string;
  direction: TransitionDirection;
  isVisible: boolean;
  /** Called once the transition video has its first decodable frame and the overlay is showing. */
  onReady?: () => void;
}

export function TransitionVideo({
  videoRef,
  forwardSrc,
  reverseSrc,
  direction,
  isVisible,
  onReady,
}: TransitionVideoProps) {
  const [videoReady, setVideoReady] = useState(false);
  const lastSrcRef = useRef<string>('');
  const onReadyFiredRef = useRef(false);

  const activeSrc = direction === 'forward' ? forwardSrc : reverseSrc;

  useEffect(() => {
    if (!isVisible) {
      setVideoReady(false);
      lastSrcRef.current = '';
      onReadyFiredRef.current = false;
      homeLogger.debug('[TransitionVideo] hidden → reset videoReady');
      return;
    }

    const el = videoRef.current;
    if (!el) return;

    if (lastSrcRef.current === activeSrc && videoReady) return;

    setVideoReady(false);
    onReadyFiredRef.current = false;
    homeLogger.debug('[TransitionVideo] new src detected, waiting for canplay', {
      src: activeSrc.split('/').pop(),
      readyState: el.readyState,
    });

    const markReady = () => {
      homeLogger.info('[TransitionVideo] ✅ canplay → showing overlay', {
        src: activeSrc.split('/').pop(),
        readyState: el.readyState,
      });
      lastSrcRef.current = activeSrc;
      setVideoReady(true);
    };

    if (el.readyState >= 3) {
      homeLogger.debug('[TransitionVideo] already HAVE_FUTURE_DATA → showing immediately');
      lastSrcRef.current = activeSrc;
      setVideoReady(true);
      return;
    }

    el.addEventListener('canplay', markReady, { once: true });
    return () => {
      el.removeEventListener('canplay', markReady);
    };
  }, [isVisible, activeSrc, videoRef, videoReady]);

  // Fire onReady once per transition when the overlay first becomes visible
  useEffect(() => {
    if (videoReady && !onReadyFiredRef.current && onReady) {
      onReadyFiredRef.current = true;
      homeLogger.debug('[TransitionVideo] firing onReady callback');
      onReady();
    }
  }, [videoReady, onReady]);

  const shouldShow = isVisible && videoReady;

  return (
    <section
      className={`fixed inset-0 z-50 w-full h-screen overflow-hidden ${
        shouldShow
          ? 'opacity-100 pointer-events-auto visible'
          : 'opacity-0 pointer-events-none invisible'
      }`}
      style={{ transition: 'opacity 0s' }}
    >
      <VideoBackground videoRef={videoRef} src={activeSrc} />
    </section>
  );
}
