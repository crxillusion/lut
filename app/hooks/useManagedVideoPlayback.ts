import { RefObject, useEffect } from 'react';
import { videoLogger } from '../utils/logger';

export interface UseManagedVideoPlaybackOptions {
  enabled: boolean;
  name: string;
  /**
   * Minimum readyState required to call play().
   * 2 = HAVE_CURRENT_DATA.
   */
  minReadyState?: 2 | 3 | 4;
  /** When true, seek to 0 while hidden to preload first frame. */
  preloadFirstFrame?: boolean;
}

/**
 * Shared, production-safe video playback manager.
 *
 * - When `enabled` becomes true, attempts to play once the element has data.
 * - When `enabled` becomes false, pauses.
 * - Optionally preloads the first frame while hidden.
 */
export function useManagedVideoPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  { enabled, name, minReadyState = 2, preloadFirstFrame = false }: UseManagedVideoPlaybackOptions
) {
  // Preload first frame when hidden (prevents black flash when toggling visibility)
  useEffect(() => {
    if (!preloadFirstFrame) return;
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      if (!enabled && video.paused) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);

    if (video.readyState >= 2) {
      handleLoadedData();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [enabled, preloadFirstFrame, videoRef]);

  // Play/pause based on enabled
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (enabled) {
      const attemptPlay = () => {
        if (video.readyState >= minReadyState) {
          void video.play().catch(err => {
            // Autoplay can fail for various reasons; only log in dev.
            videoLogger.debug(`Playback blocked for ${name}:`, err);
          });
        } else {
          video.addEventListener('loadeddata', attemptPlay, { once: true });
        }
      };

      attemptPlay();
      return () => {
        video.removeEventListener('loadeddata', attemptPlay);
      };
    }

    video.pause();
  }, [enabled, minReadyState, name, videoRef]);
}
