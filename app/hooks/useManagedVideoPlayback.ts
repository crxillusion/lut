import { RefObject, useEffect } from 'react';
import { videoLogger } from '../utils/logger';
import { videoPlaybackManager } from '../utils/VideoPlaybackManager';

export interface UseManagedVideoPlaybackOptions {
  enabled: boolean;
  name: string;
  /**
   * Minimum readyState required to call play().
   * 2 = HAVE_CURRENT_DATA.
   */
  minReadyState?: 2 | 3 | 4;
  /** When true, attempt to ensure the first frame is available while hidden. */
  preloadFirstFrame?: boolean;
}

/**
 * Hook wrapper for managed video playback using VideoPlaybackManager.
 */
export function useManagedVideoPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  { enabled, name, minReadyState = 2, preloadFirstFrame = false }: UseManagedVideoPlaybackOptions
) {
  // Warm first frame when hidden.
  useEffect(() => {
    if (!preloadFirstFrame) return;
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      if (!enabled && video.paused) {
        if (video.readyState < 2) {
          videoPlaybackManager.load(videoRef);
        }
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
      videoPlaybackManager
        .play(videoRef, { minReadyState })
        .catch((err) => {
          videoLogger.debug(`Playback blocked for ${name}:`, (err as Error).message);
        });
    } else {
      videoPlaybackManager.pause(videoRef);
    }
  }, [enabled, minReadyState, name, videoRef]);
}
