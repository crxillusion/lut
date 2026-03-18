'use client';

import { useEffect, useState } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { OpeningTransition } from './components/OpeningTransition';
import { HomeSections } from './components/HomeSections';
import { HomeOverlay } from './components/HomeOverlay';
import { HOME_PRELOAD_VIDEO_PATHS } from './constants/homePreloadVideos';
import { HOME_PRELOAD_IMAGE_PATHS } from './constants/homePreloadImages';
import { useVideoPreloader } from './hooks/useVideoPreloader';
import { useAudioPreloader } from './hooks/useAudioPreloader';
import { useAssetPreloader } from './hooks/useAssetPreloader';
import { useVideoRefs } from './hooks/useVideoRefs';
import { useNavigationState } from './hooks/useNavigationState';
import { useNavigationTransitions } from './hooks/useNavigationTransitions';
import { useInputHandling } from './hooks/useInputHandling';
import { useOpeningSequence, useContactVisibility } from './hooks/useOpeningSequence';
import { BASE_PATH, SOUND_PATHS } from './constants/config';
import { useBgAudioAutoplay } from './hooks/useBgAudioAutoplay';
import type { UseHomeNavigationResult } from './hooks/useHomeNavigation';

export default function Home() {
  const videoRefs = useVideoRefs();
  const {
    hero: heroVideoRef,
    transition: transitionVideoRef,
    showreel: showreelVideoRef,
    aboutStart: aboutStartVideoRef,
    about: aboutVideoRef,
    team1: team1VideoRef,
    team2: team2VideoRef,
    offer: offerVideoRef,
    partner: partnerVideoRef,
    cases: casesVideoRef,
    contact: contactVideoRef,
  } = videoRefs;

  // Video preloading
  const { isLoading, loadingProgress } = useVideoPreloader(HOME_PRELOAD_VIDEO_PATHS);

  // Audio preloading
  const audioPathsArray = Object.values(SOUND_PATHS).filter((p): p is string => typeof p === 'string');
  useAudioPreloader(audioPathsArray);

  // Lottie preloading
  useEffect(() => {
    const lottieUrl = `${BASE_PATH}/5Z8KeWup2u.lottie`;
    fetch(lottieUrl, { method: 'GET', cache: 'no-cache' })
      .then(r => r.blob())
      .catch(err => console.warn('[Home] Lottie cache-warm failed:', err.message));
  }, []);

  // Image preloading
  useAssetPreloader({
    enabled: true,
    immediate: HOME_PRELOAD_IMAGE_PATHS,
    background: [],
    backgroundStaggerMs: 300,
  });

  // Opening sequence state
  const [loaderLoopDone, setLoaderLoopDone] = useState(false);
  const [openingReady, setOpeningReady] = useState(false);

  const {
    showOpening,
    showHero,
    loadingScreenVisible,
    loadingScreenMounted,
    handleOpeningComplete: handleOpeningCompleteRaw,
  } = useOpeningSequence({
    loadingProgress: loaderLoopDone ? loadingProgress : Math.min(loadingProgress, 99),
    videosAreLoading: isLoading,
    openingReady,
  });

  // Handle opening complete - show hero UI
  const handleOpeningComplete = () => {
    handleOpeningCompleteRaw();
    navActions.setHeroVisible(true);
  };

  useEffect(() => {
    if (loadingProgress < 100) setLoaderLoopDone(false);
  }, [loadingProgress]);

  useEffect(() => {
    if (showOpening) setOpeningReady(false);
  }, [showOpening]);

  // Navigation state management
  const { state: navState, actions: navActions, refs: navRefs } = useNavigationState();

  // Navigation transitions
  const navTransitions = useNavigationTransitions(
    {
      heroVideoRef,
      transitionVideoRef,
      showreelVideoRef,
      aboutStartVideoRef,
      aboutVideoRef,
      team1VideoRef,
      team2VideoRef,
      offerVideoRef,
      partnerVideoRef,
      casesVideoRef,
      contactVideoRef,
    },
    navState,
    navActions,
    navRefs
  );

  // Contact section visibility management
  useContactVisibility({
    currentSection: navState.currentSection,
    showHero,
    contactVisible: navState.contactVisible,
    leavingContact: navState.leavingContact,
    setContactVisible: navActions.setContactVisible,
    setLeavingContact: navActions.setLeavingContact,
  });

  // Input handling (scroll, touch, etc)
  useInputHandling({
    currentSection: navState.currentSection,
    isTransitioning: navState.isTransitioning,
    isWaiting: false,
    onScrollDown: navTransitions.handleScrollDown,
    onScrollUp: navTransitions.handleScrollUp,
  });

  // Background audio
  useBgAudioAutoplay({ enabled: !loadingScreenMounted });

  // Cleanup video on unmount
  useEffect(() => {
    return () => {
      Object.values(videoRefs).forEach(ref => {
        ref.current?.pause();
      });
    };
  }, [videoRefs]);

  // Prepare navigation result interface for components
  const nav: UseHomeNavigationResult = {
    currentSection: navState.currentSection,
    isTransitioning: navState.isTransitioning,
    transitionVideoSrc: navState.transitionVideoSrc,
    contactVisible: navState.contactVisible,
    leavingContact: navState.leavingContact,
    transitions: navTransitions.transitions,
    transitionToAboutStart: navTransitions.transitionToAboutStart,
    transitionToAbout: navTransitions.transitionToAbout,
    transitionBackToHeroFromAboutStart: navTransitions.transitionBackToHeroFromAboutStart,
    transitionBackFromContact: navTransitions.transitionBackFromContact,
    handleScrollDown: navTransitions.handleScrollDown,
    handleScrollUp: navTransitions.handleScrollUp,
    handleBackClick: navTransitions.handleBackClick,
    setContactVisible: navActions.setContactVisible,
    setLeavingContact: navActions.setLeavingContact,
    previousSectionRef: navRefs.previousSectionRef,
    showHero,
  };

  return (
    <div suppressHydrationWarning className="contents">
      {loadingScreenMounted && (
        <LoadingScreen
          progress={loadingProgress}
          isVisible={loadingScreenVisible}
          onLoopEndAfterComplete={() => setLoaderLoopDone(true)}
        />
      )}

      <OpeningTransition
        isPlaying={showOpening}
        onReady={() => setOpeningReady(true)}
        onComplete={handleOpeningComplete}
      />

      <HomeSections
        videoRefs={videoRefs}
        nav={nav}
        showHero={showHero}
        showOpening={showOpening}
        heroVisible={navState.heroVisible}
        aboutStartVisible={navState.aboutStartVisible}
      />

      <HomeOverlay nav={nav} showHero={showHero} />
    </div>
  );
}
