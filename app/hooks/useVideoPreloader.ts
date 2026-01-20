import { useEffect, useState } from 'react';
import { LOADING_TIMEOUT } from '../constants/config';

export function useVideoPreloader(videoPaths: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;
    let successfullyLoadedCount = 0;
    
    // Preload 80% of videos (20 out of 25) for smooth scrolling experience
    // This prevents black flashes during transitions
    const videosToPreload = Math.ceil(videoPaths.length * 0.8); // 80% of total videos
    const essentialVideos = videoPaths.slice(0, videosToPreload); // First 80% of videos
    const totalVideos = essentialVideos.length;
    
    const minLoadTime = 5000; // Minimum 5 seconds to allow videos to load on slow connections
    const startTime = Date.now();

    console.log(`[VideoPreloader] Preloading ${totalVideos} videos (80% of ${videoPaths.length}) for smooth experience, ${videoPaths.length - totalVideos} will load in background...`);

    // Create video elements and preload them
    const videoElements: HTMLVideoElement[] = [];
    const loadPromises: Promise<void>[] = [];

    essentialVideos.forEach((path, index) => {
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
            const progress = Math.floor((loadedCount / totalVideos) * 100);
            setLoadingProgress(progress);
            console.log(`[VideoPreloader] ✅ ${loadedCount}/${totalVideos} videos loaded (${progress}%): ${path.split('/').pop()}`);
          }
          cleanup();
          resolve();
        };

        const handleError = (e: Event) => {
          console.error(`[VideoPreloader] ❌ Failed to load: ${path}`, e);
          if (!isCancelled) {
            loadedCount++;
            const progress = Math.floor((loadedCount / totalVideos) * 100);
            setLoadingProgress(progress);
          }
          cleanup();
          resolve();
        };

        const timeoutId = setTimeout(() => {
          console.warn(`[VideoPreloader] ⏱️ Timeout loading (15s): ${path}`);
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

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);

      console.log(`[VideoPreloader] Videos processed: ${loadedCount}/${totalVideos}, Successfully loaded: ${successfullyLoadedCount}/${totalVideos}`);
      console.log(`[VideoPreloader] Time elapsed: ${elapsed}ms, waiting ${remainingTime}ms for minimum display time`);

      // Ensure minimum loading time for branding
      setTimeout(() => {
        if (!isCancelled) {
          setLoadingProgress(100);
          
          if (successfullyLoadedCount >= 1) {
            // At least 1 video loaded successfully - proceed
            console.log('[VideoPreloader] ✅ Loading complete! Starting background preload of remaining videos...');
          } else {
            // No videos loaded - still proceed but warn user
            console.warn('[VideoPreloader] ⚠️ No videos loaded successfully, but proceeding anyway...');
          }
          
          // Small delay for smooth transition
          setTimeout(() => {
            setIsLoading(false);
            // Clean up video elements
            videoElements.forEach(v => v.remove());
            
            // Start background preloading of remaining videos (the last 20%)
            preloadRemainingVideos(videoPaths.slice(videosToPreload));
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

// Background preloader - loads remaining videos without blocking UI
function preloadRemainingVideos(videoPaths: string[]) {
  console.log(`[BackgroundPreloader] Starting to load ${videoPaths.length} additional videos...`);
  
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
        console.log(`[BackgroundPreloader] ${loadedCount}/${videoPaths.length} loaded: ${path.split('/').pop()}`);
        cleanup();
      };
      
      const handleError = () => {
        console.warn(`[BackgroundPreloader] Failed: ${path.split('/').pop()}`);
        loadedCount++;
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
