import { RefObject } from 'react';

interface VideoBackgroundProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
}

export function VideoBackground({
  videoRef,
  src,
  autoPlay = false,
  loop = false,
  className = '',
}: VideoBackgroundProps) {
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
