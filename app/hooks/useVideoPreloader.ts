import { useEffect, useState, useMemo } from 'react';
import { LOADING_TIMEOUT } from '../constants/config';
import { videoLogger } from '../utils/logger';

export function useVideoPreloader(videoPaths: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Ensure stable, de-duped ordering.
  const uniqueVideoPaths = useMemo(
    () => Array.from(new Set(videoPaths)).filter(Boolean),
    [videoPaths]
  );

  useEffect(() => {
    let isCancelled = false;

    const startAt = performance.now();

    // Decide what blocks the loading UI vs what can be warmed later.
    // Default: block on a small curated subset (max 12), warm the rest later.
    const ESSENTIAL_MAX = 12;
    const essentialVideos = uniqueVideoPaths.slice(0, ESSENTIAL_MAX);
    const remainingVideos = uniqueVideoPaths.slice(ESSENTIAL_MAX);

    const totalVideos = essentialVideos.length;

    // Dynamically scale concurrency based on network conditions (when available).
    const connection = (navigator as any).connection as
      | { effectiveType?: string; saveData?: boolean }
      | undefined;

    const isSlow =
      connection?.saveData === true ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g';

    const ESSENTIAL_CONCURRENCY = isSlow ? 1 : 3;

    const PER_VIDEO_TIMEOUT_MS = Math.min(15000, LOADING_TIMEOUT);

    const gifDuration = 6400;
    const startTime = Date.now();

    let loadedCount = 0;
    let successfullyLoadedCount = 0;

    videoLogger.info(
      `Preloading ${totalVideos} essential video(s) (of ${uniqueVideoPaths.length} total) with concurrency=${ESSENTIAL_CONCURRENCY}`
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

            const progress = totalVideos
              ? Math.min(99, Math.floor((loadedCount / totalVideos) * 100))
              : 99;
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
      const remainingTime = gifDuration - currentGifPosition;

      videoLogger.debug(
        `Time elapsed: ${wallElapsedMs}ms; waiting ${remainingTime.toFixed(0)}ms for GIF loop alignment.`
      );

      setTimeout(() => {
        if (isCancelled) return;

        videoLogger.info('Loading complete. Starting background preload of remaining videos...');
        setLoadingProgress(100);

        setTimeout(() => {
          videoLogger.info('isLoading=false (loading screen can start hiding)');
          setIsLoading(false);

          // Keep the essential preload elements around just a bit while the UI swaps.
          setTimeout(() => {
            videoElements.forEach(v => v.remove());
          }, 1500);

          // Background warm everything else (non-blocking).
          preloadRemainingVideos(remainingVideos);
        }, 500);
      }, remainingTime);
    });

    const maxTimeout = setTimeout(() => {
      if (!isCancelled) {
        videoLogger.warn('Maximum timeout reached, forcing load complete');
        setIsLoading(false);
        videoElements.forEach(v => v.remove());
        preloadRemainingVideos(remainingVideos);
      }
    }, LOADING_TIMEOUT);

    return () => {
      isCancelled = true;
      clearTimeout(maxTimeout);
      videoElements.forEach(v => v.remove());
    };
    // caller passes constants; uniqueVideoPaths memoizes
  }, [uniqueVideoPaths]);

  return { isLoading, loadingProgress };
}

// Background preloader - loads remaining videos without blocking UI
function preloadRemainingVideos(videoPaths: string[]) {
  const unique = Array.from(new Set(videoPaths)).filter(Boolean);
  videoLogger.debug(`Background preload: ${unique.length} additional video(s)...`);
  if (unique.length === 0) return;

  const connection = (navigator as any).connection as
    | { effectiveType?: string; saveData?: boolean }
    | undefined;
  const isSlow =
    connection?.saveData === true ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g';

  const BG_CONCURRENCY = isSlow ? 1 : 2;
  const BG_STAGGER_MS = 400;

  let cursor = 0;

  const loadNext = () => {
    const idx = cursor++;
    if (idx >= unique.length) return;

    const path = unique[idx];

    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = path;

    let settled = false;
    const cleanup = () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.remove();
    };

    const handleCanPlay = () => {
      if (settled) return;
      settled = true;
      videoLogger.debug(`Background loaded: ${path.split('/').pop()}`);
      cleanup();
      loadNext();
    };

    const handleError = () => {
      if (settled) return;
      settled = true;
      videoLogger.warn(`Background failed: ${path.split('/').pop()}`);
      cleanup();
      loadNext();
    };

    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('error', handleError);

    // Stagger starts slightly to avoid spiking bandwidth.
    setTimeout(() => {
      video.load();
    }, idx * BG_STAGGER_MS);
  };

  for (let i = 0; i < Math.min(BG_CONCURRENCY, unique.length); i += 1) {
    loadNext();
  }
}
