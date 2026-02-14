// Video loop speed-up utility for smooth transitions
import { RefObject } from 'react';

export interface LoopSpeedUpConfig {
  videoRef: RefObject<HTMLVideoElement | null>;
  speedMultiplier?: number;
  onLoopComplete: () => void;
  onProgress?: (current: number, duration: number) => void;

  /**
   * If set, we will trigger completion slightly *before* the loop naturally wraps,
   * and clamp playback on the last visible frame. This avoids a brief black frame
   * that can occur right at the loop boundary on some browsers.
   */
  earlyCompleteSeconds?: number;
}

/**
 * Speeds up a looping video and detects when it completes a loop.
 * Returns a cleanup function to remove event listeners.
 */
export function speedUpVideoLoop({
  videoRef,
  speedMultiplier = 5.0,
  onLoopComplete,
  onProgress,
  earlyCompleteSeconds = 0,
}: LoopSpeedUpConfig): () => void {
  const video = videoRef.current;

  if (!video) {
    console.warn('[speedUpVideoLoop] Video ref not available');
    return () => {};
  }

  // Speed up the video
  video.playbackRate = speedMultiplier;

  let completed = false;
  let previousTime = video.currentTime;

  const cleanup = () => {
    video.removeEventListener('timeupdate', handleTimeUpdate);
    video.removeEventListener('seeked', handleSeeked);
    video.playbackRate = 1.0;
  };

  const completeOnce = () => {
    if (completed) return;
    completed = true;

    // Freeze on the current frame while the caller starts the transition video.
    // (Avoids a flash to black during an internal loop reset.)
    try {
      video.pause();
    } catch {
      // ignore
    }

    cleanup();
    onLoopComplete();
  };

  const maybeEarlyComplete = (current: number) => {
    if (earlyCompleteSeconds <= 0) return;
    const duration = Number.isFinite(video.duration) ? video.duration : null;
    if (!duration) return;

    const threshold = Math.max(0, duration - earlyCompleteSeconds);
    if (current >= threshold) {
      // Clamp close to the end so we show a stable last frame.
      try {
        video.currentTime = Math.max(0, duration - 0.01);
      } catch {
        // ignore
      }
      completeOnce();
    }
  };

  const handleTimeUpdate = () => {
    const current = video.currentTime;

    // Call progress callback if provided
    if (onProgress && Math.floor(current * 2) !== Math.floor(previousTime * 2)) {
      onProgress(current, video.duration);
    }

    // Prefer early completion to avoid boundary black-flash.
    maybeEarlyComplete(current);
    if (completed) return;

    // Detect loop: if current time jumped backwards significantly
    if (current < previousTime - 0.25) {
      completeOnce();
      return;
    }

    previousTime = current;
  };

  const handleSeeked = () => {
    if (completed) return;

    const current = video.currentTime;
    maybeEarlyComplete(current);
    if (completed) return;

    // If we just wrapped back near the beginning while looping fast, treat as loop complete.
    if (current <= 0.15 && previousTime >= Math.max(0.3, (video.duration || 0) - 1.0)) {
      completeOnce();
      return;
    }

    previousTime = current;
  };

  video.addEventListener('timeupdate', handleTimeUpdate);
  video.addEventListener('seeked', handleSeeked);

  return () => {
    if (video) {
      cleanup();
    }
  };
}
