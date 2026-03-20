import { useEffect, useState, useMemo } from 'react';
import { LOADING_TIMEOUT } from '../constants/config';
import { videoLogger } from '../utils/logger';
import { VIDEO_PATHS } from '../constants/config';
import { videoPlaybackManager } from '../utils/VideoPlaybackManager';

export function useVideoPreloader(videoPaths: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const uniqueVideoPaths = useMemo(
    () => Array.from(new Set(videoPaths)).filter(Boolean),
    [videoPaths]
  );

  useEffect(() => {
    let isCancelled = false;
    let essentialSettled = false;

    const startAt = performance.now();
    const startTime = Date.now();

    const essentialVideos = uniqueVideoPaths;
    const allKnownVideos = Array.from(
      new Set(Object.values(VIDEO_PATHS).filter((v): v is string => typeof v === 'string'))
    );
    const remainingVideos = allKnownVideos.filter((p) => !essentialVideos.includes(p));

    const totalVideos = essentialVideos.length;

    // Dynamically scale concurrency based on network conditions
    const connection = (navigator as any).connection as
      | { effectiveType?: string; saveData?: boolean }
      | undefined;

    const isSlow =
      connection?.saveData === true ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g';

    const ESSENTIAL_CONCURRENCY = isSlow ? 1 : 3;
    // For production (GitHub Pages), use much longer timeouts due to slow CDN
    // For development (local R2 CDN), use shorter timeouts
    const isProd = process.env.NODE_ENV === 'production';
    const PER_VIDEO_TIMEOUT_MS = isProd 
      ? 50000  // 50s per video in production (GitHub Pages is very slow)
      : Math.min(18000, LOADING_TIMEOUT - 2000); // 18s per video in development
    const gifDuration = 6400;

    let loadedCount = 0;
    let successfullyLoadedCount = 0;

    videoLogger.info(
      `Preloading ${totalVideos} essential video(s) with concurrency=${ESSENTIAL_CONCURRENCY}`
    );

    const loadOneVideo = async (path: string) => {
      const result = await videoPlaybackManager.preloadVideo(path, {
        timeout: PER_VIDEO_TIMEOUT_MS,
      });

      if (!isCancelled) {
        loadedCount += 1;
        if (result.success) successfullyLoadedCount += 1;

        const progress = totalVideos ? Math.min(99, Math.floor((loadedCount / totalVideos) * 100)) : 99;
        setLoadingProgress(progress);

        if (result.success) {
          videoLogger.debug(`✅ ${loadedCount}/${totalVideos} loaded (${progress}%): ${path.split('/').pop()}`);
        } else {
          videoLogger.warn(
            `❌ ${loadedCount}/${totalVideos} failed (${progress}%): ${path.split('/').pop()} (${result.reason})`
          );
        }
      }
    };

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
      essentialSettled = true;
      if (maxTimeoutId) window.clearTimeout(maxTimeoutId);

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

          // Background warm everything else (non-blocking).
          preloadRemainingVideos(remainingVideos);
        }, 500);
      }, remainingTime);
    });

    // Safety watchdog: only relevant while essential preload is still running.
    let maxTimeoutId: number | null = window.setTimeout(() => {
      if (isCancelled || essentialSettled) return;
      videoLogger.warn('Maximum timeout reached, forcing load complete');
      setIsLoading(false);
      preloadRemainingVideos(remainingVideos);
    }, LOADING_TIMEOUT);

    return () => {
      isCancelled = true;
      if (maxTimeoutId) window.clearTimeout(maxTimeoutId);
    };
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

  // Fire and forget - don't wait for background preload
  videoPlaybackManager.preloadVideos(unique, {
    concurrency: BG_CONCURRENCY,
    stagger: BG_STAGGER_MS,
  });
}
