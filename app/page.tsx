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

function preloadDotLottie(url: string) {
  try {
    // Fetch with high priority; keep alive so the browser can reuse it.
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    return () => link.remove();
  } catch {
    return () => {};
  }
}

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

  // Preload the loader animation early so it doesn't pop in late.
  useEffect(() => {
    const cleanup = preloadDotLottie(`${BASE_PATH}/5Z8KeWup2u.lottie`);
    return cleanup;
  }, []);

  // When loading is complete, wait for the loader lottie to finish its current loop
  // before starting the opening transition.
  const [loaderLoopDone, setLoaderLoopDone] = useState(false);

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
  } = useLoadingAndOpening(loaderLoopDone ? loadingProgress : Math.min(loadingProgress, 99), isLoading, openingReady);

  useEffect(() => {
    if (loadingProgress < 100) setLoaderLoopDone(false);
  }, [loadingProgress]);

  // Background audio: we don't attempt autoplay on load; we attempt once on the
  // first global click after the loading screen is gone (plus the explicit sound button).
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
    contactVisible: nav.contactVisible,
    leavingContact: nav.leavingContact,
    setContactVisible: nav.setContactVisible,
    setLeavingContact: nav.setLeavingContact,
  });

  useScrollTransition({
    currentSection: nav.currentSection,
    isTransitioning: nav.isTransitioning,
    isWaiting: false,
    onScrollDown: nav.handleScrollDown,
    onScrollUp: nav.handleScrollUp,
  });

  return (
    <>
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
        heroVisible={heroVisible}
        aboutStartVisible={aboutStartVisible}
      />

      <HomeOverlay nav={nav} showHero={showHero} />
    </>
  );
}
