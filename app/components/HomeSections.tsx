'use client';

import { useState, useCallback, useEffect } from 'react';
import { VIDEO_PATHS } from '../constants/config';
import type { VideoRefs } from '../hooks/useVideoRefs';
import { HeroSection } from './HeroSection';
import { AboutStartSection } from './AboutStartSection';
import { StaticSection } from './StaticSection';
import { CasesSection } from './CasesSection';
import { ContactSection } from './ContactSection';
import { TransitionVideo } from './TransitionVideo';
import { ShowreelSection } from './ShowreelSection';
import type { UseHomeNavigationResult } from '../hooks/useHomeNavigation';
import { homeLogger } from '../utils/logger';

interface HomeSectionsProps {
  videoRefs: VideoRefs;
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
    aboutStart: aboutStartVideoRef,
    about: aboutVideoRef,
    team1: team1VideoRef,
    team2: team2VideoRef,
    offer: offerVideoRef,
    partner: partnerVideoRef,
    cases: casesVideoRef,
    contact: contactVideoRef,
  } = videoRefs;

  // True only once the TransitionVideo overlay has its first frame painted for the
  // current transition. Sections use this so they only go invisible once they are
  // actually covered — eliminating the black flash between section hide and overlay show.
  const [transitionVideoReady, setTransitionVideoReady] = useState(false);
  // Tracks the src pre-loaded into transitionVideoRef while idle. Must be state
  // (not a ref) so the new value is passed to VideoBackground via a re-render,
  // preventing React from clearing the src attribute and wiping the buffer.
  const [preWarmSrc, setPreWarmSrc] = useState<string>('');

  const handleTransitionVideoReady = useCallback(() => {
    homeLogger.debug('[HomeSections] TransitionVideo ready — safeIsTransitioning=true');
    setTransitionVideoReady(true);
  }, []);

  // Reset the ready flag when a new transition starts, so the next transition
  // begins with sections still visible until the overlay paints.
  useEffect(() => {
    if (!nav.isTransitioning) {
      setTransitionVideoReady(false);
    }
  }, [nav.isTransitioning]);

  // Pre-load the most likely next transition video directly into transitionVideoRef
  // while idle, so the element already has readyState >= 3 when the user clicks.
  // This is the only reliable way to avoid a CDN round-trip: the same physical
  // element must hold the buffered bytes (browser media caches are per-element,
  // not shared across different <video> instances loading the same URL).
  useEffect(() => {
    if (nav.isTransitioning) return;

    const el = transitionVideoRef.current;
    if (!el) return;

    // Map each section to the video most likely to be triggered next.
    const nextVideo: Partial<Record<typeof nav.currentSection, string>> = {
      hero:      VIDEO_PATHS.heroToContact,   // contact button is most prominent
      contact:   VIDEO_PATHS.contactToHero,
      cases:     VIDEO_PATHS.casesToHero,
      showreel:  VIDEO_PATHS.showreelToHero,
      aboutStart: VIDEO_PATHS.heroToAboutStart,
      about:     VIDEO_PATHS.aboutToAboutStart,
      team1:     VIDEO_PATHS.teamToAbout,
      team2:     VIDEO_PATHS.team2ToTeam1,
      offer:     VIDEO_PATHS.offerToTeam2,
      partner:   VIDEO_PATHS.partnerToOffer,
    };

    const targetSrc = nextVideo[nav.currentSection];
    if (!targetSrc) return;

    // Already loaded with this video — nothing to do.
    if (el.src === targetSrc && el.readyState >= 3) return;

    homeLogger.debug('[HomeSections] Pre-loading likely next transition into transitionVideoRef', {
      section: nav.currentSection,
      video: targetSrc.split('/').pop(),
    });

    setPreWarmSrc(targetSrc);
    el.preload = 'auto';
    el.src = targetSrc;
    el.load();
  }, [nav.currentSection, nav.isTransitioning, transitionVideoRef]);

  // Sections only go into their "transitioning-away" state once the overlay is painted.
  // This prevents the black gap between a section becoming opacity-0 and the overlay appearing.
  const safeIsTransitioning = nav.isTransitioning && transitionVideoReady;

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
        forwardSrc={nav.transitionVideoSrc || preWarmSrc}
        reverseSrc={nav.transitionVideoSrc || preWarmSrc}
        direction="forward"
        isVisible={nav.isTransitioning}
        onReady={handleTransitionVideoReady}
      />

      <ShowreelSection
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
        isTransitioning={safeIsTransitioning}
        transitionVideoRef={transitionVideoRef}
        onBackClick={nav.transitions.toAboutStartFromAbout}
        frameOffsetFromEnd={0.01}
      />

      <StaticSection
        videoRef={team1VideoRef}
        videoSrc={VIDEO_PATHS.aboutToTeam}
        isVisible={nav.currentSection === 'team1' && showHero}
        isTransitioning={safeIsTransitioning}
        transitionVideoRef={transitionVideoRef}
        onBackClick={nav.transitions.toAboutFromTeam1}
      />

      <StaticSection
        videoRef={team2VideoRef}
        videoSrc={VIDEO_PATHS.team1ToTeam2}
        isVisible={nav.currentSection === 'team2' && showHero}
        isTransitioning={safeIsTransitioning}
        transitionVideoRef={transitionVideoRef}
        onBackClick={nav.transitions.toTeam1FromTeam2}
      />

      <StaticSection
        videoRef={offerVideoRef}
        videoSrc={VIDEO_PATHS.team2ToOffer}
        isVisible={nav.currentSection === 'offer' && showHero}
        isTransitioning={safeIsTransitioning}
        transitionVideoRef={transitionVideoRef}
        onBackClick={nav.transitions.toTeam2FromOffer}
      />

      <StaticSection
        videoRef={partnerVideoRef}
        videoSrc={VIDEO_PATHS.offerToPartner}
        isVisible={nav.currentSection === 'partner' && showHero}
        isTransitioning={safeIsTransitioning}
        transitionVideoRef={transitionVideoRef}
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
        isTransitioning={safeIsTransitioning}
        showUI={nav.contactVisible}
      />
    </main>
  );
}
