// Video loop speed-up utility for smooth transitions
import { RefObject } from 'react';

export interface LoopSpeedUpConfig {
  videoRef: RefObject<HTMLVideoElement | null>;
  speedMultiplier?: number;
  onLoopComplete: () => void;
  onProgress?: (current: number, duration: number) => void;
}

/**
 * Speeds up a looping video and detects when it completes a loop
 * Returns a cleanup function to remove event listeners
 */
export function speedUpVideoLoop({
  videoRef,
  speedMultiplier = 5.0,
  onLoopComplete,
  onProgress,
}: LoopSpeedUpConfig): () => void {
  const video = videoRef.current;
  
  if (!video) {
    console.warn('[speedUpVideoLoop] Video ref not available');
    return () => {};
  }

  // Speed up the video
  video.playbackRate = speedMultiplier;
  
  let previousTime = video.currentTime;

  const handleTimeUpdate = () => {
    if (!video) return;

    const current = video.currentTime;

    // Call progress callback if provided
    if (onProgress && Math.floor(current * 2) !== Math.floor(previousTime * 2)) {
      onProgress(current, video.duration);
    }

    // Detect loop: if current time jumped backwards significantly
    if (current < previousTime - 1) {
      // Reset playback rate to normal
      video.playbackRate = 1.0;
      
      // Call completion callback
      onLoopComplete();
      
      // Remove listener
      video.removeEventListener('timeupdate', handleTimeUpdate);
      return;
    }

    previousTime = current;
  };

  video.addEventListener('timeupdate', handleTimeUpdate);

  // Return cleanup function
  return () => {
    if (video) {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.playbackRate = 1.0;
    }
  };
}
