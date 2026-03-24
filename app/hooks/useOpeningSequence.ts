import { useState, useEffect, useCallback, useRef } from 'react';
import type { Section } from '../constants/config';
import { homeLogger, contactLogger } from '../utils/logger';

interface UseOpeningSequenceProps {
  loadingProgress: number;
  videosAreLoading?: boolean;
  openingReady?: boolean;
}

interface UseOpeningSequenceResult {
  showOpening: boolean;
  showHero: boolean;
  loadingScreenVisible: boolean;
  loadingScreenMounted: boolean;
  handleOpeningComplete: () => void;
}

export function useOpeningSequence({
  loadingProgress,
  videosAreLoading = false,
  openingReady = false,
}: UseOpeningSequenceProps): UseOpeningSequenceResult {
  const [showOpening, setShowOpening] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true);
  const [loadingScreenMounted, setLoadingScreenMounted] = useState(true);

  const openingCompletedRef = useRef(false);

  const handleOpeningComplete = useCallback(() => {
    homeLogger.info('Opening transition complete, showing hero');
    openingCompletedRef.current = true;
    setShowOpening(false);
    setShowHero(true);
    setLoadingScreenVisible(false);
    setLoadingScreenMounted(false);
  }, []);

  useEffect(() => {
    const videosDone = videosAreLoading === undefined ? true : !videosAreLoading;

    if (loadingProgress === 100 && videosDone && !showOpening && !showHero) {
      homeLogger.info('Loading at 100% and videos done, starting opening transition');
      setShowOpening(true);
    }
  }, [loadingProgress, videosAreLoading, showOpening, showHero]);

  /**
   * Hide loading screen after opening is marked as ready
   */
  useEffect(() => {
    if (showOpening && openingReady && loadingScreenVisible) {
      homeLogger.info('Opening is ready, hiding loading screen');
      setLoadingScreenVisible(false);
    }
  }, [showOpening, openingReady, loadingScreenVisible]);

  useEffect(() => {
    if (!loadingScreenVisible && showOpening && !showHero) {
      homeLogger.info('Loading screen hidden, opening can start animating');
    }
  }, [loadingScreenVisible, showOpening, showHero]);

  return {
    showOpening,
    showHero,
    loadingScreenVisible,
    loadingScreenMounted,
    handleOpeningComplete,
  };
}

/**
 * Separate hook for managing contact section visibility with section tracking
 */
interface UseContactVisibilityProps {
  currentSection: Section;
  showHero: boolean;
  contactVisible: boolean;
  leavingContact: boolean;
  setContactVisible: (v: boolean) => void;
  setLeavingContact: (v: boolean) => void;
}

export function useContactVisibility({
  currentSection,
  showHero,
  contactVisible,
  leavingContact,
  setContactVisible,
  setLeavingContact,
}: UseContactVisibilityProps) {
  useEffect(() => {
    contactLogger.debug('[useContactVisibility] effect ran', {
      currentSection,
      showHero,
      contactVisible,
      leavingContact,
    });

    // Enter contact: show UI after a short delay (only if not leaving)
    if (currentSection === 'contact' && showHero && !contactVisible && !leavingContact) {
      contactLogger.info('[useContactVisibility] Entering contact → scheduling setContactVisible(true) in 100ms');
      const timer = setTimeout(() => {
        contactLogger.info('[useContactVisibility] ✅ setContactVisible(true)');
        setContactVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }

    // After leaving contact section, reset state
    if (currentSection !== 'contact' && (contactVisible || leavingContact)) {
      if (contactVisible) {
        contactLogger.info('[useContactVisibility] Left contact section → setContactVisible(false)');
        setContactVisible(false);
      }
      if (leavingContact) {
        contactLogger.info('[useContactVisibility] Left contact section → setLeavingContact(false)');
        setLeavingContact(false);
      }
    }
  }, [
    contactVisible,
    currentSection,
    leavingContact,
    setContactVisible,
    setLeavingContact,
    showHero,
  ]);
}
