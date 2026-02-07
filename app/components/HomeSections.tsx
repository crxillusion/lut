'use client';

import { VIDEO_PATHS } from '../constants/config';
import type { VideoRefs } from '../hooks/useVideoRefs';
import { HeroSection } from './HeroSection';
import { AboutStartSection } from './AboutStartSection';
import { StaticSection } from './StaticSection';
import { CasesSection } from './CasesSection';
import { ContactSection } from './ContactSection';
import { TransitionVideo } from './TransitionVideo';
import type { UseHomeNavigationResult } from '../hooks/useHomeNavigation';

interface HomeSectionsProps {
  videoRefs: VideoRefs;

  // state
  nav: UseHomeNavigationResult;
  showHero: boolean;
  showOpening: boolean;
  heroVisible: boolean;
  aboutStartVisible: boolean;
}

export function HomeSections({
  videoRefs,
  nav,
  showHero,
  showOpening,
  heroVisible,
  aboutStartVisible,
}: HomeSectionsProps) {
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

  return (
    <main className="fixed inset-0 w-full h-screen overflow-hidden">
      <HeroSection
        videoRef={heroVideoRef}
        videoSrc={VIDEO_PATHS.heroLoop}
        // Hero background can be visible during the opening, but UI animation is controlled separately via `heroVisible`.
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
        onScrollDownOutside={nav.transitions.toContactFromCases}
        onScrollUpOutside={nav.transitions.toPartnerFromCases}
      />

      <ContactSection
        videoRef={contactVideoRef}
        videoSrc={VIDEO_PATHS.contactLoop}
        isVisible={nav.currentSection === 'contact' && showHero}
        isTransitioning={nav.isTransitioning}
        showUI={nav.contactVisible}
      />
    </main>
  );
}
