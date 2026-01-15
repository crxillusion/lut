import { useEffect, useRef } from 'react';
import { BASE_PATH } from '../constants/config';

interface OpeningTransitionProps {
  isPlaying: boolean;
  onComplete: () => void;
}

export function OpeningTransition({ isPlaying, onComplete }: OpeningTransitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      const video = videoRef.current;
      
      console.log('[OpeningTransition] Starting opening animation');
      
      // Reset and play
      video.currentTime = 0;
      video.play().catch(err => {
        console.error('[OpeningTransition] Failed to play:', err);
        onComplete();
      });
      
      const handleEnded = () => {
        console.log('[OpeningTransition] Animation complete');
        onComplete();
      };
      
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [isPlaying, onComplete]);

  if (!isPlaying) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black">
      <video
        ref={videoRef}
        src={`${BASE_PATH}/videos/loading_to_homepage.mp4`}
        className="w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
      />
    </div>
  );
}
