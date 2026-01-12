import { useEffect, useState } from 'react';
import { LOADING_DELAY, LOADING_TIMEOUT } from '../constants/config';

export function useVideoPreloader(videoPaths: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let loadedCount = 0;
    const totalVideos = videoPaths.length;

    const videoElements = videoPaths.map(src => {
      const video = document.createElement('video');
      video.src = src;
      video.preload = 'auto';
      
      const updateProgress = () => {
        loadedCount++;
        const progress = (loadedCount / totalVideos) * 100;
        setLoadingProgress(progress);
        
        if (loadedCount === totalVideos) {
          setTimeout(() => {
            setIsLoading(false);
          }, LOADING_DELAY);
        }
      };

      video.addEventListener('canplaythrough', updateProgress, { once: true });
      video.load();
      
      return video;
    });

    // Fallback timeout
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, LOADING_TIMEOUT);

    return () => {
      clearTimeout(timeout);
      videoElements.forEach(video => video.remove());
    };
  }, [videoPaths]);

  return { isLoading, loadingProgress };
}
