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
  if (!isVisible) return null;

  return (
    <section className="fixed inset-0 z-50 w-full h-screen overflow-hidden">
      <VideoBackground 
        videoRef={videoRef}
        src={direction === 'forward' ? forwardSrc : reverseSrc}
      />
    </section>
  );
}
