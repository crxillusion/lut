import { videoLogger } from './logger';

export interface VideoLoadOptions {
  timeout?: number;
  minReadyState?: 2 | 3 | 4;
}

export interface VideoPlayOptions {
  startTime?: number;
  minReadyState?: 2 | 3 | 4;
}

export interface PreloadOptions {
  timeout?: number;
  concurrency?: number;
  stagger?: number;
}

/**
 * Centralized video playback and preloading manager.
 * Single source of truth for all video operations.
 */
export class VideoPlaybackManager {
  private static instance: VideoPlaybackManager;

  private constructor() {}

  static getInstance(): VideoPlaybackManager {
    if (!VideoPlaybackManager.instance) {
      VideoPlaybackManager.instance = new VideoPlaybackManager();
    }
    return VideoPlaybackManager.instance;
  }

  /**
   * Play a video with proper error handling and readyState checking
   */
  async play(
    videoRef: React.RefObject<HTMLVideoElement | null>,
    options: VideoPlayOptions = {}
  ): Promise<void> {
    const { startTime = 0, minReadyState = 2 } = options;
    const video = videoRef.current;

    if (!video) {
      videoLogger.warn('Cannot play: video element is null');
      return;
    }

    try {
      // Set start time if needed
      if (startTime !== 0 && !isNaN(startTime)) {
        video.currentTime = startTime;
      }

      // Ensure video data is loaded
      if (video.readyState < minReadyState) {
        await this.waitForReadyState(video, minReadyState);
      }

      // Attempt playback
      await video.play();
    } catch (err) {
      videoLogger.debug('Video play error:', (err as Error).message);
      throw err;
    }
  }

  /**
   * Pause a video
   */
  pause(videoRef: React.RefObject<HTMLVideoElement | null>): void {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
    }
  }

  /**
   * Stop a video (pause and reset time)
   */
  stop(videoRef: React.RefObject<HTMLVideoElement | null>, resetTime = true): void {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    if (resetTime) {
      video.currentTime = 0;
    }
  }

  /**
   * Set video volume
   */
  setVolume(videoRef: React.RefObject<HTMLVideoElement | null>, volume: number): void {
    const video = videoRef.current;
    if (video) {
      video.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Load video (trigger data loading)
   */
  load(videoRef: React.RefObject<HTMLVideoElement | null>): void {
    const video = videoRef.current;
    if (video && video.readyState < 2) {
      try {
        video.load();
      } catch {
        videoLogger.warn('Failed to load video');
      }
    }
  }

  /**
   * Wait for video to reach a specific readyState
   */
  private waitForReadyState(
    video: HTMLVideoElement,
    targetReadyState: number,
    timeout = 15000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Already at target state
      if (video.readyState >= targetReadyState) {
        resolve();
        return;
      }

      let timeoutId: number | null = null;
      let settled = false;

      const cleanup = () => {
        if (settled) return;
        settled = true;
        if (timeoutId) window.clearTimeout(timeoutId);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('error', onError);
      };

      const onLoadedData = () => {
        if (video.readyState >= targetReadyState) {
          cleanup();
          resolve();
        }
      };

      const onCanPlay = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('Video load error'));
      };

      timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('Video load timeout'));
      }, timeout);

      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);
    });
  }

  /**
   * Preload a single video - waits for loadeddata (first frame + metadata)
   * This is faster than canplaythrough which requires full buffering
   */
  async preloadVideo(
    path: string,
    options: PreloadOptions = {}
  ): Promise<{ success: boolean; reason?: string }> {
    const { timeout = 22000 } = options;

    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = path;

    return new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        video.remove();
      };

      const onLoadedData = () => {
        if (settled) return;
        settled = true;
        videoLogger.debug(`Preloaded: ${path.split('/').pop()}`);
        cleanup();
        resolve({ success: true });
      };

      const onError = () => {
        if (settled) return;
        settled = true;
        videoLogger.warn(`Failed to preload: ${path.split('/').pop()}`);
        cleanup();
        resolve({ success: false, reason: 'load_error' });
      };

      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        videoLogger.warn(`Timeout preloading: ${path.split('/').pop()}`);
        cleanup();
        resolve({ success: false, reason: 'timeout' });
      }, timeout);

      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('error', onError);

      video.load();
    });
  }

  /**
   * Preload multiple videos with concurrency control
   */
  async preloadVideos(
    paths: string[],
    options: PreloadOptions = {}
  ): Promise<{ succeeded: string[]; failed: string[] }> {
    const { concurrency = 3, stagger = 0, timeout = 15000 } = options;
    const unique = Array.from(new Set(paths)).filter(Boolean);

    if (unique.length === 0) {
      return { succeeded: [], failed: [] };
    }

    const succeeded: string[] = [];
    const failed: string[] = [];
    let cursor = 0;

    const loadOne = async () => {
      while (cursor < unique.length) {
        const idx = cursor;
        const path = unique[idx];
        cursor += 1;

        // Stagger starts to avoid bandwidth spikes
        if (stagger > 0) {
          await new Promise((resolve) => setTimeout(resolve, idx * stagger));
        }

        const result = await this.preloadVideo(path, { timeout });
        if (result.success) {
          succeeded.push(path);
        } else {
          failed.push(path);
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, unique.length) },
      () => loadOne()
    );

    await Promise.all(workers);

    return { succeeded, failed };
  }

  /**
   * Check if video is ready to play
   */
  isReady(videoRef: React.RefObject<HTMLVideoElement | null>, minReadyState = 2): boolean {
    const video = videoRef.current;
    return !!video && video.readyState >= minReadyState;
  }

  /**
   * Get video duration
   */
  getDuration(videoRef: React.RefObject<HTMLVideoElement | null>): number {
    const video = videoRef.current;
    return video?.duration || 0;
  }

  /**
   * Set video src
   */
  setSrc(videoRef: React.RefObject<HTMLVideoElement | null>, src: string): void {
    const video = videoRef.current;
    if (video) {
      video.src = src;
    }
  }

  /**
   * Reset video to initial state
   */
  reset(videoRef: React.RefObject<HTMLVideoElement | null>): void {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    video.src = '';
  }
}

export const videoPlaybackManager = VideoPlaybackManager.getInstance();
