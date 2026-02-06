'use client';

import { useEffect } from 'react';
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

  // Preload critical images during the loading screen, then warm remaining cases images in background.
  useAssetPreloader({
    enabled: true,
    immediate: HOME_PRELOAD_IMAGE_PATHS,
    background: (() => {
      const urls = new Set<string>();
      // Keep in sync with Cases assets (last ~5% warm-up)
      urls.add(`${BASE_PATH}/cases/5f74027c328b57bc4440ab05dfa0115e909245e3.png`);
      urls.add(`${BASE_PATH}/cases/f7f9a59fb629bc50bd16b0d625b4121f2ced0c0c.png`);
      urls.add(`${BASE_PATH}/cases/f52f8354b0cae68738cfcd2bfd7e2f28c24e56eb.png`);
      urls.add(`${BASE_PATH}/cases/7a43535bda67a565f92d4c59b40208caca25857c.jpg`);
      urls.add(`${BASE_PATH}/cases/9cb8ae990c7485afbbdad3534bbb2fb9f0b95ba0.png`);
      urls.add(`${BASE_PATH}/cases/a947072b922f94c359fe8d47a6f82546cd6251ba.png`);
      urls.add(`${BASE_PATH}/cases/614242dcf847675c792606557d89585df622ca2d.png`);
      urls.add(`${BASE_PATH}/cases/d7546950bcd3ab692d9d95cf48dbf1f4b49d65ca.jpg`);
      urls.add(`${BASE_PATH}/cases/9534b83aa66ccdd7e8f10bcea0eeaea278cf4554.jpg`);
      urls.add(`${BASE_PATH}/cases/d95f75bea90f42feb2c769a38b8c30a17d48bca5.png`);
      return Array.from(urls);
    })(),
    backgroundStaggerMs: 300,
  });

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
