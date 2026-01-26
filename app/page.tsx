'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { OpeningTransition } from './components/OpeningTransition';
import { HeroSection } from './components/HeroSection';
import { AboutStartSection } from './components/AboutStartSection';
import { StaticSection } from './components/StaticSection';
import { ContactSection } from './components/ContactSection';
import { TransitionVideo } from './components/TransitionVideo';
import { SocialLinks } from './components/SocialLinks';
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
  const [heroVisible, setHeroVisible] = useState(false); // Controls hero animations - starts false, then animates to true
  const [aboutStartVisible, setAboutStartVisible] = useState(true); // Controls aboutStart text visibility
  const [waitingForHeroLoop, setWaitingForHeroLoop] = useState(false); // Waiting for hero video to finish loop
  const [waitingForAboutStartLoop, setWaitingForAboutStartLoop] = useState(false); // Waiting for aboutStart video to finish loop
  const [pendingTransition, setPendingTransition] = useState<{
    section: Section;
    video: string;
    ref: React.RefObject<HTMLVideoElement | null>;
  } | null>(null);
  const isTransitioningRef = useRef(false);
  const previousSectionRef = useRef<Section>('hero'); // Track where user came from

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
      setShowOpening(true);
    }
  }, [isLoading, showOpening, showHero]);

  const handleOpeningComplete = useCallback(() => {
    setShowOpening(false);
    setShowHero(true);
    // Delay heroVisible to trigger animations after hero section mounts
    setTimeout(() => {
      setHeroVisible(true);
    }, 50); // Small delay to ensure component is mounted
  }, []);

  // Handle pending transition after fade-out animation starts
  useEffect(() => {
    if (pendingTransition && !heroVisible && !waitingForHeroLoop && !waitingForAboutStartLoop) {
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
  }, [pendingTransition, heroVisible, waitingForHeroLoop, waitingForAboutStartLoop]);

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
    }
    
    setTimeout(() => {
      try {
        if (!transitionVideoRef.current) {
          console.error('[Home] transitionVideoRef.current is null!');
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
        console.error('Transition error:', err);
        setCurrentSection(targetSection);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }
    }, 50);
  }, [currentSection]);

  // Transition functions from Hero (button clicks - direct navigation)
  const transitionToShowreel = useCallback(() => {
    handleTransition('showreel', VIDEO_PATHS.heroToShowreel, showreelVideoRef, true);
  }, [handleTransition]);

  const transitionToAboutStart = useCallback((viaScroll: boolean = false) => {
    if (viaScroll && currentSection === 'hero') {
      // When scrolling from hero, fade out UI immediately and speed up video to finish loop
      setWaitingForHeroLoop(true);
      setHeroVisible(false); // Fade out immediately
      
      const heroVideo = heroVideoRef.current;
      if (!heroVideo) {
        console.warn('[Home] Hero video ref not available');
        return;
      }
      
      // Speed up the video to finish the loop faster (3x speed)
      heroVideo.playbackRate = 3.0;
      
      const currentTime = heroVideo.currentTime;
      let previousTime = currentTime;
      
      // Set up timeupdate handler to monitor for loop reset
      const handleTimeUpdate = () => {
        if (!heroVideo) return;
        
        const current = heroVideo.currentTime;
        
        // Detect loop: if current time jumped backwards significantly
        if (current < previousTime - 1) {
          // Reset playback rate to normal
          heroVideo.playbackRate = 1.0;
          setWaitingForHeroLoop(false);
          setPendingTransition({
            section: 'aboutStart',
            video: VIDEO_PATHS.heroToAboutStart,
            ref: aboutStartVideoRef
          });
          heroVideo.removeEventListener('timeupdate', handleTimeUpdate);
          return;
        }
        
        previousTime = current;
      };
      
      heroVideo.addEventListener('timeupdate', handleTimeUpdate);
      
      // Cleanup function
      return () => {
        heroVideo.removeEventListener('timeupdate', handleTimeUpdate);
        // Reset playback rate if cleanup happens before loop completes
        if (heroVideo) {
          heroVideo.playbackRate = 1.0;
        }
      };
    } else {
      // Direct navigation (button click)
      handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, aboutStartVideoRef, true);
    }
  }, [handleTransition, currentSection, heroVisible, waitingForHeroLoop, isTransitioning]);

  const transitionToCases = useCallback(() => {
    handleTransition('cases', VIDEO_PATHS.heroToCases, casesVideoRef, true);
  }, [handleTransition]);

  const transitionToContact = useCallback(() => {
    handleTransition('contact', VIDEO_PATHS.heroToContact, contactVideoRef, true);
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
    // Reset the previous section tracker when returning to hero
    previousSectionRef.current = 'hero';
    handleTransition('hero', reverseVideo, heroVideoRef);
  }, [currentSection, handleTransition]);

  // Transition back to Hero from AboutStart with loop-waiting logic
  const transitionBackToHeroFromAboutStart = useCallback((viaScroll: boolean = false) => {
    if (viaScroll && currentSection === 'aboutStart') {
      // When scrolling back from aboutStart, fade out text immediately and speed up video to finish loop
      setWaitingForAboutStartLoop(true);
      setAboutStartVisible(false); // Fade out text immediately
      
      const aboutStartVideo = aboutStartVideoRef.current;
      if (!aboutStartVideo) {
        console.warn('[Home] AboutStart video ref not available');
        return;
      }
      
      // Speed up the video to finish the loop faster (3x speed)
      aboutStartVideo.playbackRate = 3.0;
      
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

  // Scroll handling - Full navigation flow
  // Hero -> AboutStart -> About -> Team1 -> Team2 -> Offer -> Partner -> Cases -> Contact -> Hero
  const handleScrollDown = useCallback(() => {
    switch(currentSection) {
      case 'hero': 
        transitionToAboutStart(true); // Pass true to indicate scroll
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
        // When scrolling from partner to cases, reset the tracker
        previousSectionRef.current = 'partner';
        transitionPartnerToCases();
        break;
      case 'cases': 
        // When scrolling from cases to contact, maintain the tracker
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
      case 'showreel':
        transitionToHero();
        break;
      case 'aboutStart': 
        transitionBackToHeroFromAboutStart(true); // Pass true to indicate scroll
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
        // If user came directly from hero, go back to hero
        if (previousSectionRef.current === 'hero') {
          transitionToHero();
        } else {
          // Reset tracker when scrolling back to partner
          previousSectionRef.current = 'partner';
          transitionCasesToPartner();
        }
        break;
      case 'contact': 
        // If user came directly from hero, go back to hero
        if (previousSectionRef.current === 'hero') {
          transitionToHero();
        } else {
          transitionToCases();
        }
        break;
      default: 
        break;
    }
  }, [
    currentSection, 
    transitionToHero, 
    transitionBackToHeroFromAboutStart,
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
    isWaiting: waitingForHeroLoop || waitingForAboutStartLoop,
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
        {/* Hero Section - Keep visible during transition to prevent black flash */}
        <HeroSection
          videoRef={heroVideoRef}
          videoSrc={VIDEO_PATHS.heroLoop}
          isVisible={currentSection === 'hero' && showHero}
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
          onBackClick={transitionToHero}
        />

        {/* About Start Section */}
        <AboutStartSection
          videoRef={aboutStartVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartLoop}
          isVisible={currentSection === 'aboutStart' && showHero}
          showUI={aboutStartVisible}
          onHeroClick={transitionToHero}
        />

        {/* About Section */}
        <StaticSection
          videoRef={aboutVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartToAbout}
          isVisible={currentSection === 'about' && showHero}
          onBackClick={transitionAboutToAboutStart}
          frameOffsetFromEnd={0.01}
        />

        {/* Team 1 Section */}
        <StaticSection
          videoRef={team1VideoRef}
          videoSrc={VIDEO_PATHS.aboutToTeam}
          isVisible={currentSection === 'team1' && showHero}
          onBackClick={transitionTeam1ToAbout}
        />

        {/* Team 2 Section */}
        <StaticSection
          videoRef={team2VideoRef}
          videoSrc={VIDEO_PATHS.team1ToTeam2}
          isVisible={currentSection === 'team2' && showHero}
          onBackClick={transitionTeam2ToTeam1}
        />

        {/* Offer Section */}
        <StaticSection
          videoRef={offerVideoRef}
          videoSrc={VIDEO_PATHS.team2ToOffer}
          isVisible={currentSection === 'offer' && showHero}
          onBackClick={transitionOfferToTeam2}
        />

        {/* Partner Section */}
        <StaticSection
          videoRef={partnerVideoRef}
          videoSrc={VIDEO_PATHS.offerToPartner}
          isVisible={currentSection === 'partner' && showHero}
          onBackClick={transitionPartnerToOffer}
        />

        {/* Cases Section */}
        <StaticSection
          videoRef={casesVideoRef}
          videoSrc={VIDEO_PATHS.partnerToCases}
          isVisible={currentSection === 'cases' && showHero}
          onBackClick={transitionCasesToPartner}
        />

        {/* Contact Section */}
        <ContactSection
          videoRef={contactVideoRef}
          videoSrc={VIDEO_PATHS.contactLoop}
          isVisible={currentSection === 'contact' && showHero}
        />
      </main>
        
      {/* Persistent Social Links - Always visible across all sections, above everything */}
      {showHero && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <SocialLinks 
              showBackButton={currentSection !== 'hero' && currentSection !== 'contact'}
              onBackClick={() => {
                // Determine which back transition to use based on current section
                switch(currentSection) {
                  case 'showreel':
                  case 'cases':
                    transitionToHero();
                    break;
                  case 'aboutStart':
                    transitionBackToHeroFromAboutStart(false); // Button click, not scroll
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
