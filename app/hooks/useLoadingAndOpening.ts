// Custom hook for managing loading and opening transition state
import { useState, useEffect, useCallback } from 'react';
import { homeLogger } from '../utils/logger';

export function useLoadingAndOpening(loadingProgress: number) {
  const [showOpening, setShowOpening] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true);
  const [loadingScreenMounted, setLoadingScreenMounted] = useState(true);
  const [heroVisible, setHeroVisible] = useState(false);
  const [aboutStartVisible, setAboutStartVisible] = useState(true);

  // Start opening transition when loading reaches 100%
  useEffect(() => {
    if (loadingProgress === 100 && !showOpening && !showHero) {
      homeLogger.info('Loading at 100%, starting opening transition and fading out loading screen');
      // Use setTimeout to avoid setState during render
      const timer = setTimeout(() => {
        // Start rendering the opening transition immediately (but invisible behind loading screen)
        setShowOpening(true);
        
        // Fade out loading screen after a brief delay to ensure video is ready
        setTimeout(() => {
          homeLogger.debug('Fading out loading screen to reveal opening transition');
          setLoadingScreenVisible(false);

          // Unmount after fade-out completes (matches LoadingScreen duration-300)
          setTimeout(() => {
            setLoadingScreenMounted(false);
          }, 350);
        }, 250);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [loadingProgress, showOpening, showHero]);

  const handleOpeningComplete = useCallback(() => {
    homeLogger.info('Opening transition complete, showing hero');
    setShowOpening(false);
    setShowHero(true);
    setHeroVisible(true); // Set immediately, no delay needed
    setAboutStartVisible(true); // Reset for future transitions
  }, []);

  return {
    // State
    showOpening,
    showHero,
    loadingScreenVisible,
    loadingScreenMounted,
    heroVisible,
    aboutStartVisible,
    
    // Actions
    setHeroVisible,
    setAboutStartVisible,
    handleOpeningComplete,
  };
}
