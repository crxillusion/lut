import { useEffect, useState } from 'react';
import { LOADING_TIMEOUT } from '../constants/config';

export function useVideoPreloader(videoPaths: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;
    const totalVideos = videoPaths.length;
    const minLoadTime = 2000; // Minimum 2 seconds for branding
    const startTime = Date.now();

    console.log(`[VideoPreloader] Starting to preload ${totalVideos} videos...`);

    // Create video elements and preload them
    const videoElements: HTMLVideoElement[] = [];
    const loadPromises: Promise<void>[] = [];

    videoPaths.forEach((path, index) => {
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
            const progress = Math.floor((loadedCount / totalVideos) * 100);
            setLoadingProgress(progress);
            console.log(`[VideoPreloader] ${loadedCount}/${totalVideos} videos loaded (${progress}%): ${path.split('/').pop()}`);
          }
          cleanup();
          resolve();
        };

        const handleError = (e: Event) => {
          console.error(`[VideoPreloader] Failed to load: ${path}`, e);
          if (!isCancelled) {
            loadedCount++;
            const progress = Math.floor((loadedCount / totalVideos) * 100);
            setLoadingProgress(progress);
          }
          cleanup();
          resolve();
        };

        const timeoutId = setTimeout(() => {
          console.warn(`[VideoPreloader] Timeout loading: ${path}`);
          handleError(new Event('timeout'));
        }, LOADING_TIMEOUT / 2);

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

    // Wait for all videos to load or timeout
    Promise.all(loadPromises).then(() => {
      if (isCancelled) return;

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);

      console.log(`[VideoPreloader] All videos loaded in ${elapsed}ms, waiting ${remainingTime}ms for minimum display time`);

      // Ensure minimum loading time for branding
      setTimeout(() => {
        if (!isCancelled) {
          setLoadingProgress(100);
          console.log('[VideoPreloader] ✅ Loading complete!');
          
          // Small delay for smooth transition
          setTimeout(() => {
            setIsLoading(false);
            // Clean up video elements
            videoElements.forEach(v => v.remove());
          }, 300);
        }
      }, remainingTime);
    });

    // Maximum timeout fallback
    const maxTimeout = setTimeout(() => {
      if (!isCancelled) {
        console.warn('[VideoPreloader] Maximum timeout reached, forcing load complete');
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
