import { RefObject } from 'react';
import { VideoBackground } from './VideoBackground';
import type { TransitionDirection } from '../constants/config';

interface TransitionVideoProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  forwardSrc: string;
  reverseSrc: string;
  direction: TransitionDirection;
  isVisible: boolean;
}

export function TransitionVideo({ 
  videoRef, 
  forwardSrc, 
  reverseSrc, 
  direction,
  isVisible 
}: TransitionVideoProps) {
  // Always render to keep ref available, but hide when not visible
  return (
    <section className={`fixed inset-0 z-50 w-full h-screen overflow-hidden transition-opacity duration-100 ${
      isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}>
      <VideoBackground 
        videoRef={videoRef}
        src={direction === 'forward' ? forwardSrc : reverseSrc}
      />
    </section>
  );
}
