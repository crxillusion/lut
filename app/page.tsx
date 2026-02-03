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
  const [contactVisible, setContactVisible] = useState(false);
  const [leavingContact, setLeavingContact] = useState(false);
  const [waitingForHeroLoop, setWaitingForHeroLoop] = useState(false);
  const [waitingForAboutStartLoop, setWaitingForAboutStartLoop] = useState(false);
  const [waitingForContactLoop, setWaitingForContactLoop] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{
    section: Section;
    video: string;
    ref: React.RefObject<HTMLVideoElement | null>;
  } | null>(null);
  const isTransitioningRef = useRef(false);
  const previousSectionRef = useRef<Section>('hero');

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

  // Centralized loading / opening / hero visibility state
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
    // handleTransition is declared below; we intentionally omit it from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTransition, waitingForHeroLoop, waitingForAboutStartLoop, waitingForContactLoop]);

  // Cleanup videos on unmount
  useEffect(() => {
    return () => {
      Object.values(videoRefs).forEach(ref => {
        const video = ref.current;
        if (video) {
          video.pause();
        }
      });
    };
  }, [videoRefs]);

  // Show contact elements when entering contact section, hide when leaving
  useEffect(() => {
    if (currentSection === 'contact' && showHero && !waitingForContactLoop && !contactVisible && !leavingContact) {
      const timer = setTimeout(() => {
        homeLogger.debug('Setting contactVisible to true');
        setContactVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (currentSection === 'contact' && showHero && !waitingForContactLoop && !contactVisible && leavingContact) {
      homeLogger.debug('Resetting leavingContact flag on re-entry to contact');
      setLeavingContact(false);
    } else if (currentSection !== 'contact' && contactVisible) {
      homeLogger.debug('Leaving contact section, resetting contactVisible to false');
      setContactVisible(false);
      setLeavingContact(false);
    } else if (currentSection !== 'contact' && leavingContact) {
      homeLogger.debug('Resetting leavingContact flag after leaving contact');
      setLeavingContact(false);
    }
  }, [currentSection, showHero, contactVisible, waitingForContactLoop, leavingContact]);

  // Generic transition handler
  const handleTransition = useCallback((
    targetSection: Section,
    transitionVideo: string,
    targetVideoRef: React.RefObject<HTMLVideoElement | null>,
    isDirectNavigation: boolean = false
  ) => {
    if (isTransitioningRef.current) return;

    if (isDirectNavigation && currentSection === 'hero') {
      previousSectionRef.current = 'hero';
    }

    isTransitioningRef.current = true;

    setTransitionVideoSrc(transitionVideo);

    if (targetVideoRef.current) {
      const targetVideo = targetVideoRef.current;
      targetVideo.currentTime = 0;
      if (targetVideo.readyState < 2) {
        targetVideo.load();
      }
    }
    setTimeout(() => {
      try {
        if (!transitionVideoRef.current) {
          homeLogger.error('transitionVideoRef.current is null!');
          return;
        }

        const video = transitionVideoRef.current;
        video.currentTime = 0;

        if (video.readyState < 2) {
          video.load();
        }

        const handleCanPlay = () => {
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
          if (targetVideoRef.current) {
            targetVideoRef.current.currentTime = 0;
            targetVideoRef.current.play().catch(() => {});
          }

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setCurrentSection(targetSection);
              setIsTransitioning(false);
              isTransitioningRef.current = false;
              if (targetSection === 'hero') {
                setHeroVisible(true);
              }
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
  }, [currentSection, transitionVideoRef, setHeroVisible, setAboutStartVisible]);

  // Consolidated simple transitions
  const transitions = useMemo(() => ({
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
    toAboutFromAboutStart: () => handleTransition('about', VIDEO_PATHS.aboutStartToAbout, aboutVideoRef),
    toAboutStartFromAbout: () => handleTransition('aboutStart', VIDEO_PATHS.aboutToAboutStart, aboutStartVideoRef),
    toTeam1: () => handleTransition('team1', VIDEO_PATHS.aboutToTeam, team1VideoRef),
    toTeam2: () => handleTransition('team2', VIDEO_PATHS.team1ToTeam2, team2VideoRef),
    toOffer: () => handleTransition('offer', VIDEO_PATHS.team2ToOffer, offerVideoRef),
    toPartner: () => handleTransition('partner', VIDEO_PATHS.offerToPartner, partnerVideoRef),
    toAboutFromTeam1: () => handleTransition('about', VIDEO_PATHS.teamToAbout, aboutVideoRef),
    toTeam1FromTeam2: () => handleTransition('team1', VIDEO_PATHS.team2ToTeam1, team1VideoRef),
    toTeam2FromOffer: () => handleTransition('team2', VIDEO_PATHS.offerToTeam2, team2VideoRef),
    toOfferFromPartner: () => handleTransition('offer', VIDEO_PATHS.partnerToOffer, offerVideoRef),
    toCasesFromPartner: () => handleTransition('cases', VIDEO_PATHS.partnerToCases, casesVideoRef),
    toPartnerFromCases: () => handleTransition('partner', VIDEO_PATHS.casesToPartner, partnerVideoRef),
    toContactFromCases: () => {
      previousSectionRef.current = 'cases';
      handleTransition('contact', VIDEO_PATHS.casesToContact, contactVideoRef);
    },
  }), [
    handleTransition,
    currentSection,
    heroVideoRef,
    showreelVideoRef,
    aboutStartVideoRef,
    aboutVideoRef,
    team1VideoRef,
    team2VideoRef,
    offerVideoRef,
    partnerVideoRef,
    casesVideoRef,
    contactVideoRef,
  ]);

  const transitionToShowreel = transitions.toShowreel;

  const transitionToAboutStart = useCallback((viaScroll: boolean = false) => {
    if (viaScroll && currentSection === 'hero') {
      setWaitingForHeroLoop(true);
      setHeroVisible(false);

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

      return cleanup;
    } else {
      handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, aboutStartVideoRef, true);
    }
  }, [
    handleTransition,
    currentSection,
    heroVideoRef,
    aboutStartVideoRef,
    setHeroVisible,
  ]);

  const transitionToCases = transitions.toCases;

  const transitionToContact = transitions.toContact;

  const transitionToAbout = useCallback((viaScroll: boolean = false) => {
    homeLogger.debug('transitionToAbout called, viaScroll:', viaScroll, 'currentSection:', currentSection);
    if (viaScroll && currentSection === 'aboutStart') {
      homeLogger.debug('Starting aboutStart loop speedup and fade-out');
      setWaitingForAboutStartLoop(true);
      setAboutStartVisible(false);

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

      return cleanup;
    } else {
      handleTransition('about', VIDEO_PATHS.aboutStartToAbout, aboutVideoRef);
    }
  }, [
    handleTransition,
    currentSection,
    aboutStartVideoRef,
    aboutVideoRef,
    setAboutStartVisible,
  ]);

  const transitionToTeam1 = transitions.toTeam1;

  const transitionTeam1ToTeam2 = transitions.toTeam2;

  const transitionToOffer = transitions.toOffer;

  const transitionToPartner = transitions.toPartner;

  const transitionPartnerToCases = transitions.toCasesFromPartner;

  const transitionCasesToContact = transitions.toContactFromCases;

  const transitionBackToHeroFromAboutStart = useCallback((viaScroll: boolean = false) => {
    if (viaScroll && currentSection === 'aboutStart') {
      setWaitingForAboutStartLoop(true);
      setAboutStartVisible(false);

      const aboutStartVideo = aboutStartVideoRef.current;
      if (!aboutStartVideo) {
        homeLogger.warn('AboutStart video ref not available');
        return;
      }

      aboutStartVideo.playbackRate = 5.0;

      const currentTime = aboutStartVideo.currentTime;
      let previousTime = currentTime;

      const handleTimeUpdate = () => {
        if (!aboutStartVideo) return;

        const current = aboutStartVideo.currentTime;

        if (current < previousTime - 1) {
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

      return () => {
        aboutStartVideo.removeEventListener('timeupdate', handleTimeUpdate);
        if (aboutStartVideo) {
          aboutStartVideo.playbackRate = 1.0;
        }
      };
    } else {
      previousSectionRef.current = 'hero';
      handleTransition('hero', VIDEO_PATHS.aboutStartToHero, heroVideoRef);
    }
  }, [
    handleTransition,
    currentSection,
    aboutStartVideoRef,
    heroVideoRef,
    setAboutStartVisible,
  ]);

  const transitionBackFromContact = useCallback((viaScroll: boolean = false) => {
    const previousSection = previousSectionRef.current;

    if (viaScroll && currentSection === 'contact') {
      homeLogger.debug('Starting contact loop speedup and fade-out, will return to:', previousSection);
      setWaitingForContactLoop(true);
      setContactVisible(false);

      const cleanup = speedUpVideoLoop({
        videoRef: contactVideoRef,
        speedMultiplier: 5.0,
        onProgress: (current, duration) => {
          homeLogger.loopProgress(current, duration, 5.0);
        },
        onLoopComplete: () => {
          homeLogger.loopComplete('Contact');
          setWaitingForContactLoop(false);

          if (previousSection === 'cases') {
            handleTransition('cases', VIDEO_PATHS.contactToCases, casesVideoRef);
            previousSectionRef.current = 'partner';
          } else {
            previousSectionRef.current = 'hero';
            handleTransition('hero', VIDEO_PATHS.contactToHero, heroVideoRef);
          }
        }
      });

      return cleanup;
    } else {
      homeLogger.debug('Direct navigation from contact to', previousSection, '- fading out UI first');

      setLeavingContact(true);
      setContactVisible(false);

      setTimeout(() => {
        if (previousSection === 'cases') {
          handleTransition('cases', VIDEO_PATHS.contactToCases, casesVideoRef);
          previousSectionRef.current = 'partner';
        } else {
          previousSectionRef.current = 'hero';
          handleTransition('hero', VIDEO_PATHS.contactToHero, heroVideoRef);
        }
      }, 400);
    }
  }, [
    handleTransition,
    currentSection,
    contactVideoRef,
    heroVideoRef,
    casesVideoRef,
  ]);

  const handleScrollDown = useCallback(() => {
    homeLogger.debug('handleScrollDown called, currentSection:', currentSection);
    switch(currentSection) {
      case 'hero': 
        transitionToAboutStart(true);
        break;
      case 'aboutStart': 
        transitionToAbout(true);
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
        previousSectionRef.current = 'partner';
        transitionPartnerToCases();
        break;
      case 'cases': 
        transitionCasesToContact();
        break;
      case 'contact': 
        transitionBackFromContact(true);
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
        transitionBackToHeroFromAboutStart(true);
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
        if (previousSectionRef.current === 'hero') {
          transitions.toHero();
        } else {
          previousSectionRef.current = 'partner';
          transitions.toPartnerFromCases();
        }
        break;
      case 'contact': 
        transitionBackFromContact(true);
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

  return (
    <>
      {isLoading && <LoadingScreen progress={loadingProgress} isVisible={loadingScreenVisible} />}

      <OpeningTransition 
        isPlaying={showOpening} 
        onComplete={handleOpeningComplete} 
      />

      <main className="fixed inset-0 w-full h-screen overflow-hidden">
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

        <TransitionVideo
          videoRef={transitionVideoRef}
          forwardSrc={transitionVideoSrc}
          reverseSrc={transitionVideoSrc}
          direction="forward"
          isVisible={isTransitioning}
        />

        <StaticSection
          videoRef={showreelVideoRef}
          videoSrc={VIDEO_PATHS.heroToShowreel}
          isVisible={currentSection === 'showreel' && showHero}
          onBackClick={transitions.toHero}
        />

        <AboutStartSection
          videoRef={aboutStartVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartLoop}
          isVisible={currentSection === 'aboutStart' && showHero}
          showUI={aboutStartVisible}
          onHeroClick={transitions.toHero}
        />

        <StaticSection
          videoRef={aboutVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartToAbout}
          isVisible={currentSection === 'about' && showHero}
          onBackClick={transitions.toAboutStartFromAbout}
          frameOffsetFromEnd={0.01}
        />

        <StaticSection
          videoRef={team1VideoRef}
          videoSrc={VIDEO_PATHS.aboutToTeam}
          isVisible={currentSection === 'team1' && showHero}
          onBackClick={transitions.toAboutFromTeam1}
        />

        <StaticSection
          videoRef={team2VideoRef}
          videoSrc={VIDEO_PATHS.team1ToTeam2}
          isVisible={currentSection === 'team2' && showHero}
          onBackClick={transitions.toTeam1FromTeam2}
        />

        <StaticSection
          videoRef={offerVideoRef}
          videoSrc={VIDEO_PATHS.team2ToOffer}
          isVisible={currentSection === 'offer' && showHero}
          onBackClick={transitions.toTeam2FromOffer}
        />

        <StaticSection
          videoRef={partnerVideoRef}
          videoSrc={VIDEO_PATHS.offerToPartner}
          isVisible={currentSection === 'partner' && showHero}
          onBackClick={transitions.toOfferFromPartner}
        />

        <CasesSection
          videoRef={casesVideoRef}
          videoSrc={VIDEO_PATHS.partnerToCases}
          isVisible={currentSection === 'cases' && showHero}
          onBackClick={transitions.toPartnerFromCases}
        />

        <ContactSection
          videoRef={contactVideoRef}
          videoSrc={VIDEO_PATHS.contactLoop}
          isVisible={currentSection === 'contact' && showHero}
          isTransitioning={isTransitioning}
          showUI={contactVisible}
        />
      </main>
        
      {showHero && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <SocialLinks 
              showBackButton={currentSection !== 'hero'}
              onBackClick={() => {
                switch(currentSection) {
                  case 'showreel':
                  case 'cases':
                    transitions.toHero();
                    break;
                  case 'aboutStart':
                    transitionBackToHeroFromAboutStart(false);
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
                    transitionBackFromContact(false);
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
