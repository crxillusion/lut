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
  // Always render to keep ref available, but hide when not visible.
  // Use `visibility` in addition to opacity so we don't momentarily show a black frame
  // during rapid hide/show toggles.
  return (
    <section
      className={`fixed inset-0 z-50 w-full h-screen overflow-hidden ${
        isVisible ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
      }`}
      style={{
        transition: 'opacity 0s', // No fade, instant swap
      }}
    >
      <VideoBackground 
        videoRef={videoRef}
        src={direction === 'forward' ? forwardSrc : reverseSrc}
      />
    </section>
  );
}
