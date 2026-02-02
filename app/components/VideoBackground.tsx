import { RefObject } from 'react';

interface VideoBackgroundProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
  isVisible?: boolean; // kept for API compatibility, not used
}

export function VideoBackground({
  videoRef,
  src,
  autoPlay = false,
  loop = false,
  className = '',
}: VideoBackgroundProps) {
  // ...no effects, no manual src mutation...
  // Just render a <video> with src bound directly so video.src is always correct.

  return (
    <video
      ref={videoRef}
      src={src || undefined}
      autoPlay={autoPlay}
      loop={loop}
      muted
      playsInline
      preload="auto"
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
    />
  );
}
