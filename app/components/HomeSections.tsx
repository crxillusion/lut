'use client';

import { RefObject } from 'react';
import { VIDEO_PATHS } from '../constants/config';
import { HeroSection } from './HeroSection';
import { AboutStartSection } from './AboutStartSection';
import { StaticSection } from './StaticSection';
import { CasesSection } from './CasesSection';
import { ContactSection } from './ContactSection';
import { TransitionVideo } from './TransitionVideo';
import type { UseHomeNavigationResult } from '../hooks/useHomeNavigation';

interface HomeSectionsProps {
  // refs
  heroVideoRef: RefObject<HTMLVideoElement | null>;
  transitionVideoRef: RefObject<HTMLVideoElement | null>;
  showreelVideoRef: RefObject<HTMLVideoElement | null>;
  aboutStartVideoRef: RefObject<HTMLVideoElement | null>;
  aboutVideoRef: RefObject<HTMLVideoElement | null>;
  team1VideoRef: RefObject<HTMLVideoElement | null>;
  team2VideoRef: RefObject<HTMLVideoElement | null>;
  offerVideoRef: RefObject<HTMLVideoElement | null>;
  partnerVideoRef: RefObject<HTMLVideoElement | null>;
  casesVideoRef: RefObject<HTMLVideoElement | null>;
  contactVideoRef: RefObject<HTMLVideoElement | null>;

  // state
  nav: UseHomeNavigationResult;
  showHero: boolean;
  showOpening: boolean;
  heroVisible: boolean;
  aboutStartVisible: boolean;
}

export function HomeSections({
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
  nav,
  showHero,
  showOpening,
  heroVisible,
  aboutStartVisible,
}: HomeSectionsProps) {
  return (
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
  );
}
