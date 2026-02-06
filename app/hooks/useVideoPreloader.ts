import { useEffect, useState } from 'react';
import { LOADING_TIMEOUT } from '../constants/config';
import { videoLogger } from '../utils/logger';

export function useVideoPreloader(videoPaths: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const startAt = performance.now();

    // Preload 80% of videos for smooth transitions, but do it with limited concurrency.
    const videosToPreload = Math.ceil(videoPaths.length * 0.8);
    const essentialVideos = videoPaths.slice(0, videosToPreload);
    const totalVideos = essentialVideos.length;

    // On GH Pages, large parallel downloads often stall/timeout.
    // Keep this intentionally small.
    const ESSENTIAL_CONCURRENCY = 3;

    // Use a per-video timeout lower than the global LOADING_TIMEOUT; we don't want one file
    // to block the whole queue for too long.
    const PER_VIDEO_TIMEOUT_MS = Math.min(15000, LOADING_TIMEOUT);

    const gifDuration = 7000;
    const startTime = Date.now();

    let loadedCount = 0;
    let successfullyLoadedCount = 0;

    videoLogger.info(
      `Preloading ${totalVideos} videos (80% of ${videoPaths.length}) with concurrency=${ESSENTIAL_CONCURRENCY}, ${videoPaths.length - totalVideos} will load in background...`
    );

    const videoElements: HTMLVideoElement[] = [];

    const loadOneVideo = (path: string) =>
      new Promise<void>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.src = path;
        videoElements.push(video);

        let settled = false;

        const settle = (ok: boolean, reason?: string) => {
          if (settled) return;
          settled = true;

          if (!isCancelled) {
            loadedCount += 1;
            if (ok) successfullyLoadedCount += 1;

            const progress = Math.min(99, Math.floor((loadedCount / totalVideos) * 100));
            setLoadingProgress(progress);

            if (ok) {
              videoLogger.debug(
                `✅ ${loadedCount}/${totalVideos} loaded (${progress}%): ${path.split('/').pop()}`
              );
            } else {
              videoLogger.warn(
                `❌ ${loadedCount}/${totalVideos} errored (${progress}%): ${path.split('/').pop()}${reason ? ` (${reason})` : ''}`
              );
            }
          }

          cleanup();
          resolve();
        };

        const handleCanPlay = () => settle(true);
        const handleError = (e: Event) => {
          videoLogger.error(`❌ Failed to load: ${path}`, e);
          settle(false, 'error');
        };

        const timeoutId = window.setTimeout(() => {
          videoLogger.warn(`⏱️ Timeout loading (${PER_VIDEO_TIMEOUT_MS}ms): ${path}`);
          settle(false, 'timeout');
        }, PER_VIDEO_TIMEOUT_MS);

        const cleanup = () => {
          window.clearTimeout(timeoutId);
          video.removeEventListener('canplaythrough', handleCanPlay);
          video.removeEventListener('error', handleError);
        };

        video.addEventListener('canplaythrough', handleCanPlay);
        video.addEventListener('error', handleError);

        video.load();
      });

    const runWithConcurrency = async () => {
      let cursor = 0;

      const worker = async () => {
        while (!isCancelled) {
          const idx = cursor;
          cursor += 1;
          if (idx >= essentialVideos.length) return;
          await loadOneVideo(essentialVideos[idx]);
        }
      };

      const workers = Array.from(
        { length: Math.min(ESSENTIAL_CONCURRENCY, essentialVideos.length) },
        () => worker()
      );

      await Promise.all(workers);
    };

    runWithConcurrency().then(() => {
      if (isCancelled) return;

      const perfElapsedMs = Math.round(performance.now() - startAt);
      const wallElapsedMs = Date.now() - startTime;

      videoLogger.info(
        `Essential video preload settled in ~${perfElapsedMs}ms (wall=${wallElapsedMs}ms). loaded=${loadedCount}/${totalVideos}, ok=${successfullyLoadedCount}/${totalVideos}`
      );

      const currentGifPosition = wallElapsedMs % gifDuration;
      const timeToNextGifLoop = gifDuration - currentGifPosition;
      const remainingTime = timeToNextGifLoop;

      videoLogger.info(
        `Videos processed: ${loadedCount}/${totalVideos}. Successfully loaded: ${successfullyLoadedCount}/${totalVideos}.`
      );
      videoLogger.debug(
        `Time elapsed: ${wallElapsedMs}ms; waiting ${remainingTime.toFixed(0)}ms for GIF loop alignment.`
      );

      setTimeout(() => {
        if (isCancelled) return;

        videoLogger.info('Loading complete. Starting background preload of remaining videos...');
        setLoadingProgress(100);

        if (successfullyLoadedCount >= 1) {
          videoLogger.info('✅ Loading complete! Starting background preload of remaining videos...');
        } else {
          videoLogger.warn('No videos loaded successfully, but proceeding anyway...');
        }

        setTimeout(() => {
          videoLogger.info('isLoading=false (loading screen can start hiding)');
          setIsLoading(false);
          videoElements.forEach(v => v.remove());

          videoLogger.info(
            `Background preload start: ${videoPaths.length - videosToPreload} remaining video(s)`
          );
          preloadRemainingVideos(videoPaths.slice(videosToPreload));
        }, 500);
      }, remainingTime);
    });

    // Maximum timeout fallback (still keep it, but concurrency should make it less likely).
    const maxTimeout = setTimeout(() => {
      if (!isCancelled) {
        videoLogger.warn('Maximum timeout reached, forcing load complete');
        setIsLoading(false);
        videoElements.forEach(v => v.remove());
      }
    }, LOADING_TIMEOUT);

    return () => {
      isCancelled = true;
      clearTimeout(maxTimeout);
      videoElements.forEach(v => v.remove());
    };
    // videoPaths is stable - passed from parent as constant array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading, loadingProgress };
}

// Background preloader - loads remaining videos without blocking UI
function preloadRemainingVideos(videoPaths: string[]) {
  videoLogger.debug(`Background preload: ${videoPaths.length} additional videos...`);
  
  let loadedCount = 0;
  
  videoPaths.forEach((path, index) => {
    // Stagger the loading to avoid overwhelming the connection
    setTimeout(() => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.src = path;
      
      const handleCanPlay = () => {
        loadedCount++;
        videoLogger.debug(
          `Background: ${loadedCount}/${videoPaths.length} loaded: ${path.split('/').pop()}`
        );
        cleanup();
      };
      
      const handleError = () => {
        loadedCount++;
        videoLogger.warn(`Background failed: ${path.split('/').pop()}`);
        cleanup();
      };
      
      const cleanup = () => {
        video.removeEventListener('canplaythrough', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.remove();
      };
      
      video.addEventListener('canplaythrough', handleCanPlay);
      video.addEventListener('error', handleError);
      video.load();
    }, index * 500); // Stagger by 500ms each
  });
}
