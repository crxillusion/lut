import { useEffect, useState } from 'react';
import { LOADING_TIMEOUT } from '../constants/config';

export function useVideoPreloader(videoPaths: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress for better UX
    let progress = 0;
    const increment = 100 / 20; // 20 steps
    
    const progressInterval = setInterval(() => {
      progress += increment;
      if (progress >= 95) {
        progress = 95; // Stop at 95%
        clearInterval(progressInterval);
      }
      setLoadingProgress(progress);
    }, 150);

    // Minimum loading time for brand visibility
    const minLoadTime = setTimeout(() => {
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }, 2000);

    // Maximum timeout fallback
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_TIMEOUT);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(minLoadTime);
      clearTimeout(timeout);
    };
  }, []);

  return { isLoading, loadingProgress };
}
