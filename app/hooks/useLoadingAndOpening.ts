// Custom hook for managing loading and opening transition state
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [heroVisible, _setHeroVisible] = useState(false);
  const [aboutStartVisible, _setAboutStartVisible] = useState(true);

  const openingCompletedRef = useRef(false);

  const setHeroVisible = useCallback((v: boolean) => {
    homeLogger.debug(`setHeroVisible(${v})`, {
      showHero,
      showOpening,
      openingCompleted: openingCompletedRef.current,
    });
    _setHeroVisible(v);
  }, [showHero, showOpening]);

  const setAboutStartVisible = useCallback((v: boolean) => {
    homeLogger.debug(`setAboutStartVisible(${v})`, {
      showHero,
      showOpening,
      openingCompleted: openingCompletedRef.current,
    });
    _setAboutStartVisible(v);
  }, [showHero, showOpening]);

  useEffect(() => {
    homeLogger.debug(
      `Loading state: progress=${loadingProgress}, videosAreLoading=${videosAreLoading}, openingReady=${openingReady}, loadingScreenVisible=${loadingScreenVisible}, loadingScreenMounted=${loadingScreenMounted}, showOpening=${showOpening}, showHero=${showHero}, heroVisible=${heroVisible}`
    );
  }, [
    loadingProgress,
    videosAreLoading,
    openingReady,
    loadingScreenVisible,
    loadingScreenMounted,
    showOpening,
    showHero,
    heroVisible,
  ]);

  // Start opening transition when loading reaches 100% and video preloading is done.
  useEffect(() => {
    const videosDone = videosAreLoading === undefined ? true : !videosAreLoading;

    if (loadingProgress === 100 && videosDone && !showOpening && !showHero) {
      homeLogger.info('Loading at 100% and videos done, starting opening transition');

      // Ensure hero UI starts hidden so it can fade in after opening completes.
      setHeroVisible(false);

      const timer = setTimeout(() => {
        homeLogger.debug('Setting showOpening=true');
        setShowOpening(true);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [loadingProgress, videosAreLoading, showOpening, showHero, setHeroVisible]);

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

  // As soon as we start the opening video, mount the hero (background) behind it.
  // This lets the hero loop decode and present its first frame before the opening
  // overlay fades out, reducing perceived "gap"/jump on the cut.
  useEffect(() => {
    if (showOpening && !showHero) {
      homeLogger.debug('[Opening->Hero] Pre-mount hero behind opening overlay');
      setShowHero(true);
    }
  }, [showOpening, showHero]);

  const handleOpeningComplete = useCallback(() => {
    homeLogger.info('Opening transition complete, showing hero');
    openingCompletedRef.current = true;

    // Hero should already be mounted (we pre-mount it when opening starts). Keep it on.
    setShowHero(true);

    homeLogger.debug('Opening complete: setShowOpening(false)');
    setShowOpening(false);

    // Defer visibility toggles to the next frame so motion components have a clean
    // initial render before animate=true.
    requestAnimationFrame(() => {
      const shouldShowHeroUI = true;
      homeLogger.debug('Opening complete: RAF -> setHeroVisible(true), setAboutStartVisible(true)', {
        shouldShowHeroUI,
      });

      if (shouldShowHeroUI) {
        setHeroVisible(true);
      }
      setAboutStartVisible(true);
    });
  }, [setHeroVisible, setAboutStartVisible]);

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
