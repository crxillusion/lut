'use client';

import { useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { OpeningTransition } from './components/OpeningTransition';
import { HomeSections } from './components/HomeSections';
import { HomeOverlay } from './components/HomeOverlay';
import { HOME_PRELOAD_VIDEO_PATHS } from './constants/homePreloadVideos';
import { useVideoPreloader } from './hooks/useVideoPreloader';
import { useScrollTransition } from './hooks/useScrollTransition';
import { useVideoRefs } from './hooks/useVideoRefs';
import { useLoadingAndOpening } from './hooks/useLoadingAndOpening';
import { useHomeNavigation } from './hooks/useHomeNavigation';
import { useContactVisibility } from './hooks/useContactVisibility';

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

  const {
    showOpening,
    showHero,
    loadingScreenVisible,
    heroVisible,
    aboutStartVisible,
    setHeroVisible,
    setAboutStartVisible,
    handleOpeningComplete,
  } = useLoadingAndOpening(loadingProgress);

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
      {isLoading && <LoadingScreen progress={loadingProgress} isVisible={loadingScreenVisible} />}

      <OpeningTransition isPlaying={showOpening} onComplete={handleOpeningComplete} />

      <HomeSections
        heroVideoRef={heroVideoRef}
        transitionVideoRef={transitionVideoRef}
        showreelVideoRef={showreelVideoRef}
        aboutStartVideoRef={aboutStartVideoRef}
        aboutVideoRef={aboutVideoRef}
        team1VideoRef={team1VideoRef}
        team2VideoRef={team2VideoRef}
        offerVideoRef={offerVideoRef}
        partnerVideoRef={partnerVideoRef}
        casesVideoRef={casesVideoRef}
        contactVideoRef={contactVideoRef}
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
