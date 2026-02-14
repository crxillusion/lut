import { RefObject } from 'react';

interface VideoBackgroundProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  className?: string;
}

export function VideoBackground({
  videoRef,
  src,
  autoPlay = false,
  loop = false,
  muted = true,
  preload = 'auto',
  className = '',
}: VideoBackgroundProps) {
  return (
    <video
      ref={videoRef}
      src={src || undefined}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline
      preload={preload}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
    />
  );
}
