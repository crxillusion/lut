'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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
import type { Section } from './constants/config';
import { homeLogger } from './utils/logger';
import { speedUpVideoLoop } from './utils/videoLoop';
import { useVideoRefs } from './hooks/useVideoRefs';
import { useLoadingAndOpening } from './hooks/useLoadingAndOpening';

export default function Home() {
  // State management
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoSrc, setTransitionVideoSrc] = useState('');
  const [showOpening, setShowOpening] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true); // Controls loading screen fade
  const [heroVisible, setHeroVisible] = useState(false); // Controls hero animations - starts false, then animates to true
  const [aboutStartVisible, setAboutStartVisible] = useState(true); // Controls aboutStart text visibility
  const [contactVisible, setContactVisible] = useState(false); // Controls contact elements visibility - starts false
  const [leavingContact, setLeavingContact] = useState(false); // Prevent re-triggering fade-in when leaving contact
  const [waitingForHeroLoop, setWaitingForHeroLoop] = useState(false); // Waiting for hero video to finish loop
  const [waitingForAboutStartLoop, setWaitingForAboutStartLoop] = useState(false); // Waiting for aboutStart video to finish loop
  const [waitingForContactLoop, setWaitingForContactLoop] = useState(false); // Waiting for contact video to finish loop
  const [pendingTransition, setPendingTransition] = useState<{
    section: Section;
    video: string;
    ref: React.RefObject<HTMLVideoElement | null>;
  } | null>(null);
  const isTransitioningRef = useRef(false);
  const previousSectionRef = useRef<Section>('hero'); // Track where user came from

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

  // Start opening transition when loading reaches 100% (before isLoading becomes false)
  // First fade out loading screen, then start the opening transition video
  useEffect(() => {
    if (loadingProgress === 100 && !showOpening && !showHero) {
      homeLogger.info('Loading at 100%, starting opening transition and fading out loading screen');
      // Start rendering the opening transition immediately (but invisible behind loading screen)
      setShowOpening(true);
      
      // Fade out loading screen after a brief delay to ensure video is ready
      setTimeout(() => {
        homeLogger.debug('Fading out loading screen to reveal opening transition');
        setLoadingScreenVisible(false);
      }, 100);
    }
  }, [loadingProgress, showOpening, showHero]);

  const handleOpeningComplete = useCallback(() => {
    homeLogger.info('Opening transition complete, showing hero');
    setShowOpening(false);
    setShowHero(true);
    setHeroVisible(true); // Set immediately, no delay needed
    setAboutStartVisible(true); // Reset for future transitions
  }, []);

  // Handle pending transition after fade-out animation starts and loop completes
  useEffect(() => {
    if (pendingTransition && !waitingForHeroLoop && !waitingForAboutStartLoop && !waitingForContactLoop) {
      homeLogger.debug('Pending transition ready, starting transition to:', pendingTransition.section);
      // Start transition immediately after loop ends
      handleTransition(
        pendingTransition.section,
        pendingTransition.video,
        pendingTransition.ref,
        false
      );
      setPendingTransition(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTransition, waitingForHeroLoop, waitingForAboutStartLoop, waitingForContactLoop]);

  // Cleanup videos on unmount
  useEffect(() => {
    return () => {
      // Clean up all video refs on unmount only
      Object.values(videoRefs).forEach(ref => {
        const video = ref.current;
        if (video) {
          video.pause();
          // Avoid clearing src/load here; this was causing videos to lose their source
          // video.src = '';
          // video.load();
        }
      });
    };
    // We intentionally run this effect only once (on mount/unmount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show contact elements when entering contact section, hide when leaving
  useEffect(() => {
    if (currentSection === 'contact' && showHero && !waitingForContactLoop && !contactVisible && !leavingContact) {
      // Small delay to ensure video is ready
      // Only set to true if not already visible, not waiting for loop, and not leaving
      const timer = setTimeout(() => {
        homeLogger.debug('Setting contactVisible to true');
        setContactVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (currentSection === 'contact' && showHero && !waitingForContactLoop && !contactVisible && leavingContact) {
      // Reset leavingContact flag if we're entering contact section again
      homeLogger.debug('Resetting leavingContact flag on re-entry to contact');
      setLeavingContact(false);
    } else if (currentSection !== 'contact' && contactVisible) {
      // Reset contactVisible when leaving contact section
      homeLogger.debug('Leaving contact section, resetting contactVisible to false');
      setContactVisible(false);
      setLeavingContact(false); // Reset the flag
    } else if (currentSection !== 'contact' && leavingContact) {
      // Also reset leavingContact if we left contact without the flag being reset
      homeLogger.debug('Resetting leavingContact flag after leaving contact');
      setLeavingContact(false);
    }
  }, [currentSection, showHero, contactVisible, waitingForContactLoop, leavingContact]);

  // Generic transition handler
  const handleTransition = useCallback((
    targetSection: Section,
    transitionVideo: string,
    targetVideoRef: React.RefObject<HTMLVideoElement | null>,
    isDirectNavigation: boolean = false // Track if this is a button click vs scroll
  ) => {
    if (isTransitioningRef.current) return;
    
    // Store previous section before transitioning (only for direct navigation from hero)
    if (isDirectNavigation && currentSection === 'hero') {
      previousSectionRef.current = 'hero';
    }
    
    isTransitioningRef.current = true;
    
    // Set transition video source but don't show it yet
    setTransitionVideoSrc(transitionVideo);
    
    // Prepare target video BEFORE starting transition
    if (targetVideoRef.current) {
      const targetVideo = targetVideoRef.current;
      targetVideo.currentTime = 0;
      // Preload the target video so it's ready when transition ends
      if (targetVideo.readyState < 2) {
        targetVideo.load();
      }
    }      setTimeout(() => {
      try {
        if (!transitionVideoRef.current) {
          homeLogger.error('transitionVideoRef.current is null!');
          return;
        }
        
        const video = transitionVideoRef.current;
        video.currentTime = 0;
        
        // Only call load() if video is not already loaded to prevent black flash
        if (video.readyState < 2) {
          video.load();
        }
        
        const handleCanPlay = () => {
          // Only show transition video once it's ready to play
          setIsTransitioning(true);
          
          video.play().catch(err => {
            homeLogger.warn('Transition video play error:', err.name);
            setCurrentSection(targetSection);
            setIsTransitioning(false);
            isTransitioningRef.current = false;
            if (targetVideoRef.current) {
              targetVideoRef.current.play().catch(() => {});
            }
          });
        };
        
        video.onended = () => {
          // Target video should be ready now - play it first
          if (targetVideoRef.current) {
            targetVideoRef.current.currentTime = 0;
            targetVideoRef.current.play().catch(() => {});
          }
          
          // Small delay to ensure target video is playing before showing section
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setCurrentSection(targetSection);
              setIsTransitioning(false);
              isTransitioningRef.current = false;
              // Restore hero visibility if going back to hero
              if (targetSection === 'hero') {
                setHeroVisible(true);
              }
              // Restore aboutStart visibility when entering aboutStart
              if (targetSection === 'aboutStart') {
                setAboutStartVisible(true);
              }
            });
          });
        };
        
        if (video.readyState >= 3) {
          handleCanPlay();
        } else {
          video.addEventListener('canplay', handleCanPlay, { once: true });
        }
      } catch (err) {
        homeLogger.error('Transition error:', err);
        setCurrentSection(targetSection);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }
    }, 50);
  }, [currentSection]);

  // Consolidated simple transitions - eliminates ~15 individual useCallback wrappers
  const transitions = useMemo(() => ({
    // From Hero (direct navigation)
    toShowreel: () => handleTransition('showreel', VIDEO_PATHS.heroToShowreel, showreelVideoRef, true),
    toCases: () => handleTransition('cases', VIDEO_PATHS.heroToCases, casesVideoRef, true),
    toContact: () => {
      previousSectionRef.current = 'hero';
      handleTransition('contact', VIDEO_PATHS.heroToContact, contactVideoRef, true);
    },
    toHero: () => {
      let reverseVideo = '';
      switch (currentSection) {
        case 'showreel': reverseVideo = VIDEO_PATHS.showreelToHero; break;
        case 'aboutStart': reverseVideo = VIDEO_PATHS.aboutStartToHero; break;
        case 'cases': reverseVideo = VIDEO_PATHS.casesToHero; break;
        case 'contact': reverseVideo = VIDEO_PATHS.contactToHero; break;
        default: return;
      }
      previousSectionRef.current = 'hero';
      handleTransition('hero', reverseVideo, heroVideoRef);
    },
    
    // AboutStart flow
    toAboutFromAboutStart: () => handleTransition('about', VIDEO_PATHS.aboutStartToAbout, aboutVideoRef),
    toAboutStartFromAbout: () => handleTransition('aboutStart', VIDEO_PATHS.aboutToAboutStart, aboutStartVideoRef),
    
    // Team flow
    toTeam1: () => handleTransition('team1', VIDEO_PATHS.aboutToTeam, team1VideoRef),
    toTeam2: () => handleTransition('team2', VIDEO_PATHS.team1ToTeam2, team2VideoRef),
    toOffer: () => handleTransition('offer', VIDEO_PATHS.team2ToOffer, offerVideoRef),
    toPartner: () => handleTransition('partner', VIDEO_PATHS.offerToPartner, partnerVideoRef),
    
    // Reverse team flow
    toAboutFromTeam1: () => handleTransition('about', VIDEO_PATHS.teamToAbout, aboutVideoRef),
    toTeam1FromTeam2: () => handleTransition('team1', VIDEO_PATHS.team2ToTeam1, team1VideoRef),
    toTeam2FromOffer: () => handleTransition('team2', VIDEO_PATHS.offerToTeam2, team2VideoRef),
    toOfferFromPartner: () => handleTransition('offer', VIDEO_PATHS.partnerToOffer, offerVideoRef),
    
    // Partner/Cases flow
    toCasesFromPartner: () => handleTransition('cases', VIDEO_PATHS.partnerToCases, casesVideoRef),
    toPartnerFromCases: () => handleTransition('partner', VIDEO_PATHS.casesToPartner, partnerVideoRef),
    toContactFromCases: () => {
      previousSectionRef.current = 'cases';
      handleTransition('contact', VIDEO_PATHS.casesToContact, contactVideoRef);
    },
  }), [handleTransition, currentSection]);

  // ========================================
  // TRANSITION FUNCTIONS
  // ========================================
  // Simple transitions now reference the consolidated object above
  // Complex transitions with loop logic remain as separate callbacks
  
  // Transition functions from Hero (button clicks - direct navigation)
  const transitionToShowreel = transitions.toShowreel;

  const transitionToAboutStart = useCallback((viaScroll: boolean = false) => {
    if (viaScroll && currentSection === 'hero') {
      // When scrolling from hero, fade out UI immediately and speed up video to finish loop
      setWaitingForHeroLoop(true);
      setHeroVisible(false); // Fade out immediately
      
      const cleanup = speedUpVideoLoop({
        videoRef: heroVideoRef,
        speedMultiplier: 5.0,
        onProgress: (current, duration) => {
          homeLogger.loopProgress(current, duration, 5.0);
        },
        onLoopComplete: () => {
          homeLogger.loopComplete('Hero');
          setWaitingForHeroLoop(false);
          setPendingTransition({
            section: 'aboutStart',
            video: VIDEO_PATHS.heroToAboutStart,
            ref: aboutStartVideoRef
          });
        }
      });
      
      // Return cleanup function
      return cleanup;
    } else {
      // Direct navigation (button click)
      handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, aboutStartVideoRef, true);
    }
  }, [handleTransition, currentSection]);

  const transitionToCases = transitions.toCases;

  const transitionToContact = transitions.toContact;

  // Additional transition functions for the full flow
  const transitionToAbout = useCallback((viaScroll: boolean = false) => {
    homeLogger.debug('transitionToAbout called, viaScroll:', viaScroll, 'currentSection:', currentSection);
    if (viaScroll && currentSection === 'aboutStart') {
      // When scrolling from aboutStart to about, fade out text immediately and speed up video to finish loop
      homeLogger.debug('Starting aboutStart loop speedup and fade-out');
      setWaitingForAboutStartLoop(true);
      setAboutStartVisible(false); // Fade out text immediately
      
      const cleanup = speedUpVideoLoop({
        videoRef: aboutStartVideoRef,
        speedMultiplier: 5.0,
        onProgress: (current, duration) => {
          homeLogger.loopProgress(current, duration, 5.0);
        },
        onLoopComplete: () => {
          homeLogger.loopComplete('AboutStart');
          setWaitingForAboutStartLoop(false);
          setPendingTransition({
            section: 'about',
            video: VIDEO_PATHS.aboutStartToAbout,
            ref: aboutVideoRef
          });
        }
      });
      
      // Return cleanup function
      return cleanup;
    } else {
      // Direct navigation (button click)
      handleTransition('about', VIDEO_PATHS.aboutStartToAbout, aboutVideoRef);
    }
  }, [handleTransition, currentSection]);

  const transitionToTeam1 = transitions.toTeam1;

  const transitionTeam1ToTeam2 = transitions.toTeam2;

  const transitionToOffer = transitions.toOffer;

  const transitionToPartner = transitions.toPartner;

  const transitionPartnerToCases = transitions.toCasesFromPartner;

  const transitionCasesToContact = transitions.toContactFromCases;

  // Transition back to Hero from AboutStart with loop-waiting logic
  const transitionBackToHeroFromAboutStart = useCallback((viaScroll: boolean = false) => {
    if (viaScroll && currentSection === 'aboutStart') {
      // When scrolling back from aboutStart, fade out text immediately and speed up video to finish loop
      setWaitingForAboutStartLoop(true);
      setAboutStartVisible(false); // Fade out text immediately
      
      const aboutStartVideo = aboutStartVideoRef.current;
      if (!aboutStartVideo) {
        homeLogger.warn('AboutStart video ref not available');
        return;
      }
      
      // Speed up the video to finish the loop faster (5x speed)
      aboutStartVideo.playbackRate = 5.0;
      
      const currentTime = aboutStartVideo.currentTime;
      let previousTime = currentTime;
      
      // Set up timeupdate handler to monitor for loop reset
      const handleTimeUpdate = () => {
        if (!aboutStartVideo) return;
        
        const current = aboutStartVideo.currentTime;
        
        // Detect loop: if current time jumped backwards significantly
        if (current < previousTime - 1) {
          // Reset playback rate to normal
          aboutStartVideo.playbackRate = 1.0;
          setWaitingForAboutStartLoop(false);
          setPendingTransition({
            section: 'hero',
            video: VIDEO_PATHS.aboutStartToHero,
            ref: heroVideoRef
          });
          aboutStartVideo.removeEventListener('timeupdate', handleTimeUpdate);
          return;
        }
        
        previousTime = current;
      };
      
      aboutStartVideo.addEventListener('timeupdate', handleTimeUpdate);
      
      // Cleanup function
      return () => {
        aboutStartVideo.removeEventListener('timeupdate', handleTimeUpdate);
        // Reset playback rate if cleanup happens before loop completes
        if (aboutStartVideo) {
          aboutStartVideo.playbackRate = 1.0;
        }
      };
    } else {
      // Direct navigation (button click) - use normal transition
      previousSectionRef.current = 'hero';
      handleTransition('hero', VIDEO_PATHS.aboutStartToHero, heroVideoRef);
    }
  }, [handleTransition, currentSection]);

  // Transition back from Contact with loop-waiting logic
  const transitionBackFromContact = useCallback((viaScroll: boolean = false) => {
    const previousSection = previousSectionRef.current;
    
    if (viaScroll && currentSection === 'contact') {
      // When scrolling back from contact, fade out elements immediately and speed up video to finish loop
      homeLogger.debug('Starting contact loop speedup and fade-out, will return to:', previousSection);
      setWaitingForContactLoop(true);
      setContactVisible(false); // Fade out elements immediately
      
      const cleanup = speedUpVideoLoop({
        videoRef: contactVideoRef,
        speedMultiplier: 5.0,
        onProgress: (current, duration) => {
          homeLogger.loopProgress(current, duration, 5.0);
        },
        onLoopComplete: () => {
          homeLogger.loopComplete('Contact');
          setWaitingForContactLoop(false);
          
          // Transition back to the section we came from
          if (previousSection === 'cases') {
            // Use the proper contact→cases reverse video
            handleTransition('cases', VIDEO_PATHS.contactToCases, casesVideoRef);
            // Keep previousSectionRef as 'partner' so scrolling from cases works correctly
            previousSectionRef.current = 'partner';
          } else {
            // Default: go back to hero
            previousSectionRef.current = 'hero';
            handleTransition('hero', VIDEO_PATHS.contactToHero, heroVideoRef);
          }
        }
      });
      
      // Return cleanup function
      return cleanup;
    } else {
      // Direct navigation (button click) - fade out UI first, then transition
      homeLogger.debug('Direct navigation from contact to', previousSection, '- fading out UI first');
      
      // Set flag to prevent useEffect from re-triggering fade-in
      setLeavingContact(true);
      // Fade out the contact UI
      setContactVisible(false);
      
      // Wait for fade-out animation to complete (400ms) before starting transition
      setTimeout(() => {
        if (previousSection === 'cases') {
          // Use the proper contact→cases reverse video
          handleTransition('cases', VIDEO_PATHS.contactToCases, casesVideoRef);
          previousSectionRef.current = 'partner';
        } else {
          // Default: go back to hero
          previousSectionRef.current = 'hero';
          handleTransition('hero', VIDEO_PATHS.contactToHero, heroVideoRef);
        }
      }, 400); // Match the fade-out duration from ContactSection
    }
  }, [handleTransition, currentSection]);

  // Scroll handling - Full navigation flow
  // Hero -> AboutStart -> About -> Team1 -> Team2 -> Offer -> Partner -> Cases -> Contact -> Hero
  const handleScrollDown = useCallback(() => {
    homeLogger.debug('handleScrollDown called, currentSection:', currentSection);
    switch(currentSection) {
      case 'hero': 
        transitionToAboutStart(true); // Pass true to indicate scroll
        break;
      case 'aboutStart': 
        transitionToAbout(true); // Pass true to indicate scroll
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
        // When scrolling from partner to cases, reset the tracker
        previousSectionRef.current = 'partner';
        transitionPartnerToCases();
        break;
      case 'cases': 
        // When scrolling from cases to contact, maintain the tracker
        transitionCasesToContact();
        break;
      case 'contact': 
        transitionBackFromContact(true); // Pass true to indicate scroll
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
    transitionBackFromContact
  ]);

  const handleScrollUp = useCallback(() => {
    homeLogger.debug('handleScrollUp called, currentSection:', currentSection);
    switch(currentSection) {
      case 'showreel':
        transitions.toHero();
        break;
      case 'aboutStart': 
        transitionBackToHeroFromAboutStart(true); // Pass true to indicate scroll
        break;
      case 'about': 
        transitions.toAboutStartFromAbout();
        break;
      case 'team1': 
        transitions.toAboutFromTeam1();
        break;
      case 'team2': 
        transitions.toTeam1FromTeam2();
        break;
      case 'offer': 
        transitions.toTeam2FromOffer();
        break;
      case 'partner': 
        transitions.toOfferFromPartner();
        break;
      case 'cases': 
        // If user came directly from hero, go back to hero
        if (previousSectionRef.current === 'hero') {
          transitions.toHero();
        } else {
          // Reset tracker when scrolling back to partner
          previousSectionRef.current = 'partner';
          transitions.toPartnerFromCases();
        }
        break;
      case 'contact': 
        // Always use loop speedup logic when scrolling away from contact
        transitionBackFromContact(true); // Pass true to indicate scroll
        break;
      default: 
        break;
    }
  }, [
    currentSection, 
    transitions,
    transitionBackToHeroFromAboutStart,
    transitionBackFromContact
  ]);

  useScrollTransition({
    currentSection,
    isTransitioning,
    isWaiting: waitingForHeroLoop || waitingForAboutStartLoop || waitingForContactLoop,
    onScrollDown: handleScrollDown,
    onScrollUp: handleScrollUp,
  });

  homeLogger.debug('Render state:', { isLoading, showOpening, showHero, currentSection });

  return (
    <>
      {/* Loading Screen - fades out when loading completes */}
      {isLoading && <LoadingScreen progress={loadingProgress} isVisible={loadingScreenVisible} />}

      {/* Opening Transition - plays after loading screen fades out */}
      <OpeningTransition 
        isPlaying={showOpening} 
        onComplete={handleOpeningComplete} 
      />

      {/* Main Content */}
      <main className="fixed inset-0 w-full h-screen overflow-hidden">
        {/* Hero Section - Render early (behind opening transition) to prevent black flash */}
        <HeroSection
          videoRef={heroVideoRef}
          videoSrc={VIDEO_PATHS.heroLoop}
          isVisible={currentSection === 'hero' && (showHero || showOpening)}
          showUI={heroVisible}
          currentSection={currentSection}
          onShowreelClick={transitionToShowreel}
          onAboutClick={() => transitionToAboutStart(false)}
          onCasesClick={transitionToCases}
          onContactClick={transitionToContact}
        />

        {/* Transition Video - Always rendered to keep ref available */}
        <TransitionVideo
          videoRef={transitionVideoRef}
          forwardSrc={transitionVideoSrc}
          reverseSrc={transitionVideoSrc}
          direction="forward"
          isVisible={isTransitioning}
        />

        {/* Showreel Section */}
        <StaticSection
          videoRef={showreelVideoRef}
          videoSrc={VIDEO_PATHS.heroToShowreel}
          isVisible={currentSection === 'showreel' && showHero}
          onBackClick={transitions.toHero}
        />

        {/* About Start Section */}
        <AboutStartSection
          videoRef={aboutStartVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartLoop}
          isVisible={currentSection === 'aboutStart' && showHero}
          showUI={aboutStartVisible}
          onHeroClick={transitions.toHero}
        />

        {/* About Section */}
        <StaticSection
          videoRef={aboutVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartToAbout}
          isVisible={currentSection === 'about' && showHero}
          onBackClick={transitions.toAboutStartFromAbout}
          frameOffsetFromEnd={0.01}
        />

        {/* Team 1 Section */}
        <StaticSection
          videoRef={team1VideoRef}
          videoSrc={VIDEO_PATHS.aboutToTeam}
          isVisible={currentSection === 'team1' && showHero}
          onBackClick={transitions.toAboutFromTeam1}
        />

        {/* Team 2 Section */}
        <StaticSection
          videoRef={team2VideoRef}
          videoSrc={VIDEO_PATHS.team1ToTeam2}
          isVisible={currentSection === 'team2' && showHero}
          onBackClick={transitions.toTeam1FromTeam2}
        />

        {/* Offer Section */}
        <StaticSection
          videoRef={offerVideoRef}
          videoSrc={VIDEO_PATHS.team2ToOffer}
          isVisible={currentSection === 'offer' && showHero}
          onBackClick={transitions.toTeam2FromOffer}
        />

        {/* Partner Section */}
        <StaticSection
          videoRef={partnerVideoRef}
          videoSrc={VIDEO_PATHS.offerToPartner}
          isVisible={currentSection === 'partner' && showHero}
          onBackClick={transitions.toOfferFromPartner}
        />

        {/* Cases Section */}
        <CasesSection
          videoRef={casesVideoRef}
          videoSrc={VIDEO_PATHS.partnerToCases}
          isVisible={currentSection === 'cases' && showHero}
          onBackClick={transitions.toPartnerFromCases}
        />

        {/* Contact Section */}
        <ContactSection
          videoRef={contactVideoRef}
          videoSrc={VIDEO_PATHS.contactLoop}
          isVisible={currentSection === 'contact' && showHero}
          isTransitioning={isTransitioning}
          showUI={contactVisible}
        />
      </main>
        
      {/* Persistent Social Links - Always visible across all sections, above everything */}
      {showHero && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <SocialLinks 
              showBackButton={currentSection !== 'hero'}
              onBackClick={() => {
                // Determine which back transition to use based on current section
                switch(currentSection) {
                  case 'showreel':
                  case 'cases':
                    transitions.toHero();
                    break;
                  case 'aboutStart':
                    transitionBackToHeroFromAboutStart(false); // Button click, not scroll
                    break;
                  case 'about':
                    transitions.toAboutStartFromAbout();
                    break;
                  case 'team1':
                    transitions.toAboutFromTeam1();
                    break;
                  case 'team2':
                    transitions.toTeam1FromTeam2();
                    break;
                  case 'offer':
                    transitions.toTeam2FromOffer();
                    break;
                  case 'partner':
                    transitions.toOfferFromPartner();
                    break;
                  case 'contact':
                    transitionBackFromContact(false); // Button click, not scroll
                    break;
                }
              }}
              isVisible={showHero}
              animateOnce={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
