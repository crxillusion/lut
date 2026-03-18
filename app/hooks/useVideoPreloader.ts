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

    // Dynamically scale concurrency and timeout based on network conditions
    const connection = (navigator as any).connection as
      | { effectiveType?: string; saveData?: boolean; downlink?: number }
      | undefined;

    const isSlow =
      connection?.saveData === true ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g';

    const isModerate = connection?.effectiveType === '3g';

    // More aggressive timeout scaling based on actual network
    let ESSENTIAL_CONCURRENCY = isSlow ? 1 : isModerate ? 2 : 3;
    let PER_VIDEO_TIMEOUT_MS = isSlow ? 15000 : isModerate ? 12000 : 10000;

    // Dynamic adjustment: if network is detected as fast, use tighter timeouts
    const downlink = connection?.downlink || 0;
    if (downlink > 2) {
      ESSENTIAL_CONCURRENCY = 4;
      PER_VIDEO_TIMEOUT_MS = 8000;
    }

    const gifDuration = 6400;

    let loadedCount = 0;
    let successfullyLoadedCount = 0;
    let failureCount = 0;

    videoLogger.info(
      `Preloading ${totalVideos} essential video(s) with concurrency=${ESSENTIAL_CONCURRENCY}, timeout=${PER_VIDEO_TIMEOUT_MS}ms (${connection?.effectiveType || 'unknown'} network)`
    );

    // Early abort if failure rate exceeds threshold
    let shouldAbortRemaining = false;

    const loadOneVideo = async (path: string, attempt = 1) => {
      const maxAttempts = 2; // Allow one retry for transient failures
      
      const result = await videoPlaybackManager.preloadVideo(path, {
        timeout: PER_VIDEO_TIMEOUT_MS,
      });

      if (!isCancelled) {
        if (result.success) {
          successfullyLoadedCount += 1;
          videoLogger.debug(`✅ ${path.split('/').pop()}`);
        } else if (attempt < maxAttempts && result.reason === 'timeout') {
          // Retry once on timeout with longer timeout
          videoLogger.debug(`⏱️ Retry ${path.split('/').pop()} (attempt ${attempt}/${maxAttempts})`);
          await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
          return loadOneVideo(path, attempt + 1);
        } else {
          failureCount += 1;
          videoLogger.warn(`❌ ${path.split('/').pop()} (${result.reason})`);

          // Early abort if too many failures
          const failureRate = failureCount / (loadedCount + 1);
          if (failureRate > 0.5 && loadedCount > 2) {
            shouldAbortRemaining = true;
            videoLogger.warn(
              `High failure rate (${(failureRate * 100).toFixed(0)}%). Cancelling remaining videos.`
            );
          }
        }

        loadedCount += 1;

        const progress = totalVideos ? Math.min(99, Math.floor((successfullyLoadedCount / totalVideos) * 100)) : 99;
        setLoadingProgress(progress);
      }
    };

    const runWithConcurrency = async () => {
      let cursor = 0;

      const worker = async () => {
        while (!isCancelled && !shouldAbortRemaining) {
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
      const successRate = totalVideos > 0 ? ((successfullyLoadedCount / totalVideos) * 100).toFixed(0) : 'N/A';

      videoLogger.info(
        `Essential video preload settled in ~${perfElapsedMs}ms (wall=${wallElapsedMs}ms). success=${successfullyLoadedCount}/${totalVideos} (${successRate}%), failed=${failureCount}`
      );

      if (successfullyLoadedCount < totalVideos * 0.5) {
        videoLogger.warn(
          `⚠️ Less than 50% of videos loaded successfully. User may experience delays.`
        );
      }

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
      videoLogger.warn(`Maximum timeout (${LOADING_TIMEOUT}ms) reached, forcing load complete`);
      setIsLoading(false);
      shouldAbortRemaining = true;
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
  if (unique.length === 0) return;

  const connection = (navigator as any).connection as
    | { effectiveType?: string; saveData?: boolean }
    | undefined;

  const isSlow =
    connection?.saveData === true ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g';

  const isModerate = connection?.effectiveType === '3g';

  // Very conservative on slow connections, normal on faster
  const BG_CONCURRENCY = isSlow ? 1 : isModerate ? 2 : 3;
  const BG_STAGGER_MS = isSlow ? 400 : isModerate ? 300 : 200;
  const BG_TIMEOUT_MS = isSlow ? 20000 : isModerate ? 15000 : 12000;

  videoLogger.debug(
    `Background preload: ${unique.length} video(s) (concurrency=${BG_CONCURRENCY}, timeout=${BG_TIMEOUT_MS}ms)`
  );

  // Fire and forget - don't wait for background preload
  videoPlaybackManager.preloadVideos(unique, {
    concurrency: BG_CONCURRENCY,
    stagger: BG_STAGGER_MS,
    timeout: BG_TIMEOUT_MS,
  });
}
