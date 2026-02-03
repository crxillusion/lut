'use client';

import { useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { OpeningTransition } from './components/OpeningTransition';
import { HeroSection } from './components/HeroSection';
import { AboutStartSection } from './components/AboutStartSection';
import { StaticSection } from './components/StaticSection';
import { CasesSection } from './components/CasesSection';
import { ContactSection } from './components/ContactSection';
import { TransitionVideo } from './components/TransitionVideo';
import { SocialLinks } from './components/SocialLinks';
import { useVideoPreloader } from './hooks/useVideoPreloader';
import { useScrollTransition } from './hooks/useScrollTransition';
import { VIDEO_PATHS } from './constants/config';
import { useVideoRefs } from './hooks/useVideoRefs';
import { useLoadingAndOpening } from './hooks/useLoadingAndOpening';
import { useHomeNavigation } from './hooks/useHomeNavigation';
import { useContactVisibility } from './hooks/useContactVisibility';

export default function Home() {
  // Consolidated video refs
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

  // Preload essential videos
  const { isLoading, loadingProgress } = useVideoPreloader([
    VIDEO_PATHS.opening,
    VIDEO_PATHS.heroLoop,
    VIDEO_PATHS.heroToShowreel,
    VIDEO_PATHS.showreelToHero,
    VIDEO_PATHS.heroToAboutStart,
    VIDEO_PATHS.aboutStartToHero,
    VIDEO_PATHS.heroToCases,
    VIDEO_PATHS.casesToHero,
    VIDEO_PATHS.heroToContact,
    VIDEO_PATHS.contactToHero,
    VIDEO_PATHS.aboutStartLoop,
    VIDEO_PATHS.aboutStartToAbout,
    VIDEO_PATHS.aboutToAboutStart,
    VIDEO_PATHS.aboutToTeam,
    VIDEO_PATHS.teamToAbout,
    VIDEO_PATHS.team1ToTeam2,
    VIDEO_PATHS.team2ToTeam1,
    VIDEO_PATHS.team2ToOffer,
    VIDEO_PATHS.offerToTeam2,
    VIDEO_PATHS.offerToPartner,
    VIDEO_PATHS.partnerToOffer,
    VIDEO_PATHS.partnerToCases,
    VIDEO_PATHS.casesToPartner,
    VIDEO_PATHS.casesToContact,
    VIDEO_PATHS.contactLoop,
  ]);

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

  // Cleanup videos on unmount
  useEffect(() => {
    return () => {
      Object.values(videoRefs).forEach(ref => {
        ref.current?.pause();
      });
    };
  }, [videoRefs]);

  // Show/hide Contact UI elements based on section state
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

      <main className="fixed inset-0 w-full h-screen overflow-hidden">
        <HeroSection
          videoRef={heroVideoRef}
          videoSrc={VIDEO_PATHS.heroLoop}
          isVisible={nav.currentSection === 'hero' && (showHero || showOpening)}
          showUI={heroVisible}
          currentSection={nav.currentSection}
          onShowreelClick={nav.transitions.toShowreel}
          onAboutClick={() => nav.transitionToAboutStart(false)}
          onCasesClick={nav.transitions.toCases}
          onContactClick={nav.transitions.toContact}
        />

        <TransitionVideo
          videoRef={transitionVideoRef}
          forwardSrc={nav.transitionVideoSrc}
          reverseSrc={nav.transitionVideoSrc}
          direction="forward"
          isVisible={nav.isTransitioning}
        />

        <StaticSection
          videoRef={showreelVideoRef}
          videoSrc={VIDEO_PATHS.heroToShowreel}
          isVisible={nav.currentSection === 'showreel' && showHero}
          onBackClick={nav.transitions.toHero}
        />

        <AboutStartSection
          videoRef={aboutStartVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartLoop}
          isVisible={nav.currentSection === 'aboutStart' && showHero}
          showUI={aboutStartVisible}
          onHeroClick={nav.transitions.toHero}
        />

        <StaticSection
          videoRef={aboutVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartToAbout}
          isVisible={nav.currentSection === 'about' && showHero}
          onBackClick={nav.transitions.toAboutStartFromAbout}
          frameOffsetFromEnd={0.01}
        />

        <StaticSection
          videoRef={team1VideoRef}
          videoSrc={VIDEO_PATHS.aboutToTeam}
          isVisible={nav.currentSection === 'team1' && showHero}
          onBackClick={nav.transitions.toAboutFromTeam1}
        />

        <StaticSection
          videoRef={team2VideoRef}
          videoSrc={VIDEO_PATHS.team1ToTeam2}
          isVisible={nav.currentSection === 'team2' && showHero}
          onBackClick={nav.transitions.toTeam1FromTeam2}
        />

        <StaticSection
          videoRef={offerVideoRef}
          videoSrc={VIDEO_PATHS.team2ToOffer}
          isVisible={nav.currentSection === 'offer' && showHero}
          onBackClick={nav.transitions.toTeam2FromOffer}
        />

        <StaticSection
          videoRef={partnerVideoRef}
          videoSrc={VIDEO_PATHS.offerToPartner}
          isVisible={nav.currentSection === 'partner' && showHero}
          onBackClick={nav.transitions.toOfferFromPartner}
        />

        <CasesSection
          videoRef={casesVideoRef}
          videoSrc={VIDEO_PATHS.partnerToCases}
          isVisible={nav.currentSection === 'cases' && showHero}
          onBackClick={nav.transitions.toPartnerFromCases}
        />

        <ContactSection
          videoRef={contactVideoRef}
          videoSrc={VIDEO_PATHS.contactLoop}
          isVisible={nav.currentSection === 'contact' && showHero}
          isTransitioning={nav.isTransitioning}
          showUI={nav.contactVisible}
        />
      </main>

      {showHero && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <SocialLinks
              showBackButton={nav.currentSection !== 'hero'}
              onBackClick={nav.handleBackClick}
              isVisible={showHero}
              animateOnce={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
