import { useEffect, useState } from 'react';
import { LOADING_TIMEOUT } from '../constants/config';
import { videoLogger } from '../utils/logger';

export function useVideoPreloader(videoPaths: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;
    let successfullyLoadedCount = 0;

    const startAt = performance.now();
    
    // Preload 80% of videos (20 out of 25) for smooth scrolling experience
    // This prevents black flashes during transitions
    const videosToPreload = Math.ceil(videoPaths.length * 0.8); // 80% of total videos
    const essentialVideos = videoPaths.slice(0, videosToPreload); // First 80% of videos
    const totalVideos = essentialVideos.length;
    
    const gifDuration = 7000; // Target display time in ms (7 seconds) - shorter than full GIF loop
    const startTime = Date.now();

    videoLogger.info(
      `Preloading ${totalVideos} videos (80% of ${videoPaths.length}) for smooth experience, ${videoPaths.length - totalVideos} will load in background...`
    );

    // Create video elements and preload them
    const videoElements: HTMLVideoElement[] = [];
    const loadPromises: Promise<void>[] = [];

    essentialVideos.forEach((path) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.src = path;
      videoElements.push(video);

      const loadPromise = new Promise<void>((resolve) => {
        const handleCanPlay = () => {
          if (!isCancelled) {
            loadedCount++;
            successfullyLoadedCount++;
            // Cap progress at 99% until minimum wait time completes
            const progress = Math.min(99, Math.floor((loadedCount / totalVideos) * 100));
            setLoadingProgress(progress);
            videoLogger.debug(
              `✅ ${loadedCount}/${totalVideos} loaded (${progress}%): ${path.split('/').pop()}`
            );
          }
          cleanup();
          resolve();
        };

        const handleError = (e: Event) => {
          videoLogger.error(`❌ Failed to load: ${path}`, e);
          if (!isCancelled) {
            loadedCount++;
            const progress = Math.floor((loadedCount / totalVideos) * 100);
            setLoadingProgress(progress);
            videoLogger.debug(
              `❌ ${loadedCount}/${totalVideos} errored (${progress}%): ${path.split('/').pop()}`
            );
          }
          cleanup();
          resolve();
        };

        const timeoutId = setTimeout(() => {
          videoLogger.warn(`⏱️ Timeout loading (${LOADING_TIMEOUT}ms): ${path}`);
          handleError(new Event('timeout'));
        }, LOADING_TIMEOUT); // Use full timeout for essential videos on slow connections

        const cleanup = () => {
          clearTimeout(timeoutId);
          video.removeEventListener('canplaythrough', handleCanPlay);
          video.removeEventListener('error', handleError);
        };

        video.addEventListener('canplaythrough', handleCanPlay);
        video.addEventListener('error', handleError);
      });

      loadPromises.push(loadPromise);
      
      // Start loading
      video.load();
    });

    // Wait for essential videos to load
    Promise.all(loadPromises).then(() => {
      if (isCancelled) return;

      const perfElapsedMs = Math.round(performance.now() - startAt);
      const wallElapsedMs = Date.now() - startTime;

      videoLogger.info(
        `Essential video preload settled in ~${perfElapsedMs}ms (wall=${wallElapsedMs}ms). loaded=${loadedCount}/${totalVideos}, ok=${successfullyLoadedCount}/${totalVideos}`
      );

      // Calculate how long to wait to align with GIF loop completion
      // We want to transition right when the GIF completes a full loop
      const currentGifPosition = wallElapsedMs % gifDuration; // Where we are in the current GIF loop
      const timeToNextGifLoop = gifDuration - currentGifPosition; // Time until GIF completes current loop

      // Ensure we wait at least until the next GIF loop completes
      const remainingTime = timeToNextGifLoop;

      videoLogger.info(
        `Videos processed: ${loadedCount}/${totalVideos}. Successfully loaded: ${successfullyLoadedCount}/${totalVideos}.`
      );
      videoLogger.debug(
        `Time elapsed: ${wallElapsedMs}ms; waiting ${remainingTime.toFixed(0)}ms for GIF loop alignment.`
      );

      // Ensure minimum loading time for branding
      setTimeout(() => {
        if (!isCancelled) {
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
        }
      }, remainingTime);
    });

    // Maximum timeout fallback
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
