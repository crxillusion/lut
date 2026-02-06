// Custom hook for managing loading and opening transition state
import { useState, useEffect, useCallback } from 'react';
import { homeLogger } from '../utils/logger';

export function useLoadingAndOpening(loadingProgress: number, videosAreLoading?: boolean) {
  const [showOpening, setShowOpening] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true);
  const [loadingScreenMounted, setLoadingScreenMounted] = useState(true);
  const [heroVisible, setHeroVisible] = useState(false);
  const [aboutStartVisible, setAboutStartVisible] = useState(true);

  useEffect(() => {
    homeLogger.debug(
      `Loading state: progress=${loadingProgress}, videosAreLoading=${videosAreLoading}, loadingScreenVisible=${loadingScreenVisible}, loadingScreenMounted=${loadingScreenMounted}, showOpening=${showOpening}, showHero=${showHero}`
    );
  }, [loadingProgress, videosAreLoading, loadingScreenVisible, loadingScreenMounted, showOpening, showHero]);

  // Start opening transition when loading reaches 100% and video preloading is actually done.
  useEffect(() => {
    const videosDone = videosAreLoading === undefined ? true : !videosAreLoading;

    if (loadingProgress === 100 && videosDone && !showOpening && !showHero) {
      homeLogger.info('Loading at 100% and videos done, starting opening transition and fading out loading screen');
      const timer = setTimeout(() => {
        setShowOpening(true);

        // Fade out loading screen after the opening has had a moment to mount.
        setTimeout(() => {
          homeLogger.debug('Fading out loading screen to reveal opening transition');
          setLoadingScreenVisible(false);

          // Unmount after fade-out completes (matches LoadingScreen duration-300)
          setTimeout(() => {
            homeLogger.debug('Unmounting loading screen');
            setLoadingScreenMounted(false);
          }, 350);
        }, 250);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [loadingProgress, videosAreLoading, showOpening, showHero]);

  const handleOpeningComplete = useCallback(() => {
    homeLogger.info('Opening transition complete, showing hero');
    setShowOpening(false);
    setShowHero(true);
    setHeroVisible(true);
    setAboutStartVisible(true);
  }, []);

  return {
    showOpening,
    showHero,
    loadingScreenVisible,
    loadingScreenMounted,
    heroVisible,
    aboutStartVisible,
    setHeroVisible,
    setAboutStartVisible,
    handleOpeningComplete,
  };
}
