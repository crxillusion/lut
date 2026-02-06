// Custom hook for managing loading and opening transition state
import { useState, useEffect, useCallback } from 'react';
import { homeLogger } from '../utils/logger';

export function useLoadingAndOpening(
  loadingProgress: number,
  videosAreLoading?: boolean,
  openingReady?: boolean
) {
  const [showOpening, setShowOpening] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true);
  const [loadingScreenMounted, setLoadingScreenMounted] = useState(true);
  const [heroVisible, setHeroVisible] = useState(false);
  const [aboutStartVisible, setAboutStartVisible] = useState(true);

  useEffect(() => {
    homeLogger.debug(
      `Loading state: progress=${loadingProgress}, videosAreLoading=${videosAreLoading}, openingReady=${openingReady}, loadingScreenVisible=${loadingScreenVisible}, loadingScreenMounted=${loadingScreenMounted}, showOpening=${showOpening}, showHero=${showHero}`
    );
  }, [
    loadingProgress,
    videosAreLoading,
    openingReady,
    loadingScreenVisible,
    loadingScreenMounted,
    showOpening,
    showHero,
  ]);

  // Start opening transition when loading reaches 100% and video preloading is done.
  useEffect(() => {
    const videosDone = videosAreLoading === undefined ? true : !videosAreLoading;

    if (loadingProgress === 100 && videosDone && !showOpening && !showHero) {
      homeLogger.info('Loading at 100% and videos done, starting opening transition');
      const timer = setTimeout(() => {
        setShowOpening(true);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [loadingProgress, videosAreLoading, showOpening, showHero]);

  // Fade out loading screen ONLY when opening is actually ready to show.
  useEffect(() => {
    if (!showOpening) return;

    // If not provided, assume ready (keeps old behavior in dev)
    const isOpeningReady = openingReady ?? true;
    if (!isOpeningReady) {
      homeLogger.debug('Holding loading screen: opening not ready yet');
      return;
    }

    homeLogger.info('Opening ready; fading out loading screen');
    setLoadingScreenVisible(false);

    const t = setTimeout(() => {
      homeLogger.debug('Unmounting loading screen');
      setLoadingScreenMounted(false);
    }, 350);

    return () => clearTimeout(t);
  }, [showOpening, openingReady]);

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
