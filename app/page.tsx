'use client';

import { useEffect, useState } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { OpeningTransition } from './components/OpeningTransition';
import { HomeSections } from './components/HomeSections';
import { HomeOverlay } from './components/HomeOverlay';
import { HOME_PRELOAD_VIDEO_PATHS } from './constants/homePreloadVideos';
import { HOME_PRELOAD_IMAGE_PATHS } from './constants/homePreloadImages';
import { useVideoPreloader } from './hooks/useVideoPreloader';
import { useAssetPreloader } from './hooks/useAssetPreloader';
import { useScrollTransition } from './hooks/useScrollTransition';
import { useVideoRefs } from './hooks/useVideoRefs';
import { useLoadingAndOpening } from './hooks/useLoadingAndOpening';
import { useHomeNavigation } from './hooks/useHomeNavigation';
import { useContactVisibility } from './hooks/useContactVisibility';
import { BASE_PATH } from './constants/config';
import { useBgAudioAutoplay } from './hooks/useBgAudioAutoplay';

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

  const { isLoading, loadingProgress } = useVideoPreloader(HOME_PRELOAD_VIDEO_PATHS);

  // Preload critical images during the loading screen.
  // (Cases card images are included in HOME_PRELOAD_IMAGE_PATHS so they render instantly.)
  useAssetPreloader({
    enabled: true,
    immediate: HOME_PRELOAD_IMAGE_PATHS,
    background: [],
    backgroundStaggerMs: 300,
  });

  const [openingReady, setOpeningReady] = useState(false);

  const {
    showOpening,
    showHero,
    loadingScreenVisible,
    loadingScreenMounted,
    heroVisible,
    aboutStartVisible,
    setHeroVisible,
    setAboutStartVisible,
    handleOpeningComplete,
  } = useLoadingAndOpening(loadingProgress, isLoading, openingReady);

  // Autoplay music once the loading screen is gone (best effort; may require gesture).
  useBgAudioAutoplay({ enabled: !loadingScreenMounted });

  // Reset readiness when starting opening
  useEffect(() => {
    if (showOpening) setOpeningReady(false);
  }, [showOpening]);

  const nav = useHomeNavigation(
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
    {
      setHeroVisible,
      setAboutStartVisible,
    }
  );

  useEffect(() => {
    return () => {
      Object.values(videoRefs).forEach(ref => {
        ref.current?.pause();
      });
    };
  }, [videoRefs]);

  useContactVisibility({
    currentSection: nav.currentSection,
    showHero,
    waitingForContactLoop: nav.waitingForContactLoop,
    contactVisible: nav.contactVisible,
    leavingContact: nav.leavingContact,
    setContactVisible: nav.setContactVisible,
    setLeavingContact: nav.setLeavingContact,
  });

  useScrollTransition({
    currentSection: nav.currentSection,
    isTransitioning: nav.isTransitioning,
    isWaiting: nav.waitingForHeroLoop || nav.waitingForAboutStartLoop || nav.waitingForContactLoop,
    onScrollDown: nav.handleScrollDown,
    onScrollUp: nav.handleScrollUp,
  });

  return (
    <>
      {loadingScreenMounted && (
        <LoadingScreen progress={loadingProgress} isVisible={loadingScreenVisible} />
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
        heroVisible={heroVisible}
        aboutStartVisible={aboutStartVisible}
      />

      <HomeOverlay nav={nav} showHero={showHero} />
    </>
  );
}
