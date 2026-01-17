'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { OpeningTransition } from './components/OpeningTransition';
import { HeroSection } from './components/HeroSection';
import { AboutStartSection } from './components/AboutStartSection';
import { StaticSection } from './components/StaticSection';
import { ContactSection } from './components/ContactSection';
import { TransitionVideo } from './components/TransitionVideo';
import { useVideoPreloader } from './hooks/useVideoPreloader';
import { useScrollTransition } from './hooks/useScrollTransition';
import { VIDEO_PATHS } from './constants/config';
import type { Section, TransitionDirection } from './constants/config';

export default function Home() {
  // State management
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoSrc, setTransitionVideoSrc] = useState('');
  const [showOpening, setShowOpening] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const isTransitioningRef = useRef(false);

  // Video refs for each section
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const showreelVideoRef = useRef<HTMLVideoElement>(null);
  const aboutStartVideoRef = useRef<HTMLVideoElement>(null);
  const aboutVideoRef = useRef<HTMLVideoElement>(null);
  const team1VideoRef = useRef<HTMLVideoElement>(null);
  const team2VideoRef = useRef<HTMLVideoElement>(null);
  const offerVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const casesVideoRef = useRef<HTMLVideoElement>(null);
  const contactVideoRef = useRef<HTMLVideoElement>(null);

  // Preload essential videos - including all transition videos to prevent black flashes
  const { isLoading, loadingProgress } = useVideoPreloader([
    VIDEO_PATHS.opening, // Opening video
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

  // Handle opening sequence after loading completes
  useEffect(() => {
    if (!isLoading && !showOpening && !showHero) {
      console.log('[Home] Loading complete, starting opening animation');
      setShowOpening(true);
    }
  }, [isLoading, showOpening, showHero]);

  const handleOpeningComplete = useCallback(() => {
    console.log('[Home] Opening animation complete, showing hero');
    setShowOpening(false);
    setShowHero(true);
  }, []);

  // Cleanup videos on unmount
  useEffect(() => {
    return () => {
      const refs = [
        heroVideoRef, transitionVideoRef, showreelVideoRef, aboutStartVideoRef,
        aboutVideoRef, team1VideoRef, team2VideoRef, offerVideoRef, partnerVideoRef, casesVideoRef, contactVideoRef
      ];
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = '';
          ref.current.load();
        }
      });
    };
  }, []);

  // Generic transition handler
  const handleTransition = useCallback((
    targetSection: Section,
    transitionVideo: string,
    targetVideoRef: React.RefObject<HTMLVideoElement | null>
  ) => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setTransitionVideoSrc(transitionVideo);
    
    setTimeout(() => {
      try {
        if (transitionVideoRef.current) {
          const video = transitionVideoRef.current;
          video.currentTime = 0;
          video.load();
          
          const handleCanPlay = () => {
            video.play().catch(err => {
              console.warn('Transition video play error:', err.name);
              setCurrentSection(targetSection);
              setIsTransitioning(false);
              isTransitioningRef.current = false;
              if (targetVideoRef.current) {
                targetVideoRef.current.play().catch(() => {});
              }
            });
          };
          
          video.onended = () => {
            setCurrentSection(targetSection);
            setIsTransitioning(false);
            isTransitioningRef.current = false;
            
            if (targetVideoRef.current) {
              targetVideoRef.current.currentTime = 0;
              targetVideoRef.current.play().catch(() => {});
            }
          };
          
          if (video.readyState >= 3) {
            handleCanPlay();
          } else {
            video.addEventListener('canplay', handleCanPlay, { once: true });
          }
        }
      } catch (err) {
        console.error('Transition error:', err);
        setCurrentSection(targetSection);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }
    }, 50);
  }, []);

  // Transition functions from Hero
  const transitionToShowreel = useCallback(() => {
    handleTransition('showreel', VIDEO_PATHS.heroToShowreel, showreelVideoRef);
  }, [handleTransition]);

  const transitionToAboutStart = useCallback(() => {
    handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, aboutStartVideoRef);
  }, [handleTransition]);

  const transitionToCases = useCallback(() => {
    handleTransition('cases', VIDEO_PATHS.heroToCases, casesVideoRef);
  }, [handleTransition]);

  const transitionToContact = useCallback(() => {
    handleTransition('contact', VIDEO_PATHS.heroToContact, contactVideoRef);
  }, [handleTransition]);

  // Additional transition functions for the full flow
  const transitionToAbout = useCallback(() => {
    handleTransition('about', VIDEO_PATHS.aboutStartToAbout, aboutVideoRef);
  }, [handleTransition]);

  const transitionToTeam1 = useCallback(() => {
    handleTransition('team1', VIDEO_PATHS.aboutToTeam, team1VideoRef);
  }, [handleTransition]);

  const transitionTeam1ToTeam2 = useCallback(() => {
    handleTransition('team2', VIDEO_PATHS.team1ToTeam2, team2VideoRef);
  }, [handleTransition]);

  const transitionToOffer = useCallback(() => {
    handleTransition('offer', VIDEO_PATHS.team2ToOffer, offerVideoRef);
  }, [handleTransition]);

  const transitionToPartner = useCallback(() => {
    handleTransition('partner', VIDEO_PATHS.offerToPartner, partnerVideoRef);
  }, [handleTransition]);

  const transitionPartnerToCases = useCallback(() => {
    handleTransition('cases', VIDEO_PATHS.partnerToCases, casesVideoRef);
  }, [handleTransition]);

  const transitionCasesToContact = useCallback(() => {
    handleTransition('contact', VIDEO_PATHS.casesToContact, contactVideoRef);
  }, [handleTransition]);

  // Reverse transitions
  const transitionAboutToAboutStart = useCallback(() => {
    handleTransition('aboutStart', VIDEO_PATHS.aboutToAboutStart, aboutStartVideoRef);
  }, [handleTransition]);

  const transitionTeam1ToAbout = useCallback(() => {
    handleTransition('about', VIDEO_PATHS.teamToAbout, aboutVideoRef);
  }, [handleTransition]);

  const transitionTeam2ToTeam1 = useCallback(() => {
    handleTransition('team1', VIDEO_PATHS.team2ToTeam1, team1VideoRef);
  }, [handleTransition]);

  const transitionOfferToTeam2 = useCallback(() => {
    handleTransition('team2', VIDEO_PATHS.offerToTeam2, team2VideoRef);
  }, [handleTransition]);

  const transitionPartnerToOffer = useCallback(() => {
    handleTransition('offer', VIDEO_PATHS.partnerToOffer, offerVideoRef);
  }, [handleTransition]);

  const transitionCasesToPartner = useCallback(() => {
    handleTransition('partner', VIDEO_PATHS.casesToPartner, partnerVideoRef);
  }, [handleTransition]);

  // Transition back to Hero
  const transitionToHero = useCallback(() => {
    let reverseVideo = '';
    switch (currentSection) {
      case 'showreel':
        reverseVideo = VIDEO_PATHS.showreelToHero;
        break;
      case 'aboutStart':
        reverseVideo = VIDEO_PATHS.aboutStartToHero;
        break;
      case 'cases':
        reverseVideo = VIDEO_PATHS.casesToHero;
        break;
      case 'contact':
        reverseVideo = VIDEO_PATHS.contactToHero;
        break;
      default:
        return;
    }
    handleTransition('hero', reverseVideo, heroVideoRef);
  }, [currentSection, handleTransition]);

  // Scroll handling - Full navigation flow
  // Hero -> AboutStart -> About -> Team1 -> Team2 -> Offer -> Partner -> Cases -> Contact -> Hero
  const handleScrollDown = useCallback(() => {
    switch(currentSection) {
      case 'hero': 
        transitionToAboutStart();
        break;
      case 'aboutStart': 
        transitionToAbout();
        break;
      case 'about': 
        transitionToTeam1();
        break;
      case 'team1': 
        transitionTeam1ToTeam2();
        break;
      case 'team2': 
        transitionToOffer();
        break;
      case 'offer': 
        transitionToPartner();
        break;
      case 'partner': 
        transitionPartnerToCases();
        break;
      case 'cases': 
        transitionCasesToContact();
        break;
      case 'contact': 
        transitionToHero();
        break;
      default: 
        break;
    }
  }, [
    currentSection, 
    transitionToAboutStart, 
    transitionToAbout,
    transitionToTeam1,
    transitionTeam1ToTeam2,
    transitionToOffer,
    transitionToPartner,
    transitionPartnerToCases,
    transitionCasesToContact,
    transitionToHero
  ]);

  const handleScrollUp = useCallback(() => {
    switch(currentSection) {
      case 'aboutStart': 
        transitionToHero();
        break;
      case 'about': 
        transitionAboutToAboutStart();
        break;
      case 'team1': 
        transitionTeam1ToAbout();
        break;
      case 'team2': 
        transitionTeam2ToTeam1();
        break;
      case 'offer': 
        transitionOfferToTeam2();
        break;
      case 'partner': 
        transitionPartnerToOffer();
        break;
      case 'cases': 
        transitionCasesToPartner();
        break;
      case 'contact': 
        transitionToCases();
        break;
      default: 
        break;
    }
  }, [
    currentSection, 
    transitionToHero, 
    transitionAboutToAboutStart,
    transitionTeam1ToAbout,
    transitionTeam2ToTeam1,
    transitionOfferToTeam2,
    transitionPartnerToOffer,
    transitionCasesToPartner,
    transitionToCases
  ]);

  useScrollTransition({
    currentSection,
    isTransitioning,
    onScrollDown: handleScrollDown,
    onScrollUp: handleScrollUp,
  });

  return (
    <>
      {/* Loading Screen */}
      {isLoading && <LoadingScreen progress={loadingProgress} />}

      {/* Opening Transition */}
      <OpeningTransition 
        isPlaying={showOpening} 
        onComplete={handleOpeningComplete} 
      />

      {/* Main Content */}
      <main className="fixed inset-0 w-full h-screen overflow-hidden">
        {/* Hero Section */}
        <HeroSection
          videoRef={heroVideoRef}
          videoSrc={VIDEO_PATHS.heroLoop}
          isVisible={currentSection === 'hero' && !isTransitioning && showHero}
          currentSection={currentSection}
          onShowreelClick={transitionToShowreel}
          onAboutClick={transitionToAboutStart}
          onCasesClick={transitionToCases}
          onContactClick={transitionToContact}
        />

        {/* Transition Video */}
        <TransitionVideo
          videoRef={transitionVideoRef}
          forwardSrc={transitionVideoSrc}
          reverseSrc={transitionVideoSrc}
          direction="forward"
          isVisible={isTransitioning && showHero}
        />

        {/* Showreel Section */}
        <StaticSection
          videoRef={showreelVideoRef}
          videoSrc={VIDEO_PATHS.heroToShowreel}
          isVisible={currentSection === 'showreel' && showHero}
          onBackClick={transitionToHero}
        />

        {/* About Start Section */}
        <AboutStartSection
          videoRef={aboutStartVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartLoop}
          isVisible={currentSection === 'aboutStart' && showHero}
          onHeroClick={transitionToHero}
        />

        {/* About Section */}
        <StaticSection
          videoRef={aboutVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartToAbout}
          isVisible={currentSection === 'about' && showHero}
          title="About Us"
          content="We transform brands through creative excellence."
          onBackClick={transitionAboutToAboutStart}
          frameOffsetFromEnd={0.01}
        />

        {/* Team 1 Section */}
        <StaticSection
          videoRef={team1VideoRef}
          videoSrc={VIDEO_PATHS.aboutToTeam}
          isVisible={currentSection === 'team1' && showHero}
          title="Our Team"
          content="Meet the talented people behind our work."
          onBackClick={transitionTeam1ToAbout}
        />

        {/* Team 2 Section */}
        <StaticSection
          videoRef={team2VideoRef}
          videoSrc={VIDEO_PATHS.team1ToTeam2}
          isVisible={currentSection === 'team2' && showHero}
          title="Our Team"
          content="Continued..."
          onBackClick={transitionTeam2ToTeam1}
        />

        {/* Offer Section */}
        <StaticSection
          videoRef={offerVideoRef}
          videoSrc={VIDEO_PATHS.team2ToOffer}
          isVisible={currentSection === 'offer' && showHero}
          title="What We Offer"
          content="Comprehensive creative solutions for your brand."
          onBackClick={transitionOfferToTeam2}
        />

        {/* Partner Section */}
        <StaticSection
          videoRef={partnerVideoRef}
          videoSrc={VIDEO_PATHS.offerToPartner}
          isVisible={currentSection === 'partner' && showHero}
          title="Our Partners"
          content="Collaborating with industry leaders."
          onBackClick={transitionPartnerToOffer}
        />

        {/* Cases Section */}
        <StaticSection
          videoRef={casesVideoRef}
          videoSrc={VIDEO_PATHS.partnerToCases}
          isVisible={currentSection === 'cases' && showHero}
          title="Cases"
          content="Our portfolio of exceptional work."
          onBackClick={transitionCasesToPartner}
        />

        {/* Contact Section */}
        <ContactSection
          videoRef={contactVideoRef}
          videoSrc={VIDEO_PATHS.contactLoop}
          isVisible={currentSection === 'contact' && showHero}
        />
      </main>
    </>
  );
}
