import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Section } from '../constants/config';
import { VIDEO_PATHS } from '../constants/config';
import { homeLogger } from '../utils/logger';
import { speedUpVideoLoop } from '../utils/videoLoop';

export interface HomeNavigationVideoRefs {
  heroVideoRef: React.RefObject<HTMLVideoElement | null>;
  transitionVideoRef: React.RefObject<HTMLVideoElement | null>;
  showreelVideoRef: React.RefObject<HTMLVideoElement | null>;
  aboutStartVideoRef: React.RefObject<HTMLVideoElement | null>;
  aboutVideoRef: React.RefObject<HTMLVideoElement | null>;
  team1VideoRef: React.RefObject<HTMLVideoElement | null>;
  team2VideoRef: React.RefObject<HTMLVideoElement | null>;
  offerVideoRef: React.RefObject<HTMLVideoElement | null>;
  partnerVideoRef: React.RefObject<HTMLVideoElement | null>;
  casesVideoRef: React.RefObject<HTMLVideoElement | null>;
  contactVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export interface UseHomeNavigationResult {
  // section state
  currentSection: Section;
  isTransitioning: boolean;
  transitionVideoSrc: string;

  // UI flags
  contactVisible: boolean;
  leavingContact: boolean;
  waitingForHeroLoop: boolean;
  waitingForAboutStartLoop: boolean;
  waitingForContactLoop: boolean;

  // transition helpers
  transitions: {
    toShowreel: () => void;
    toCases: () => void;
    toContact: () => void;
    toHero: () => void;

    toAboutFromAboutStart: () => void;
    toAboutStartFromAbout: () => void;

    toTeam1: () => void;
    toTeam2: () => void;
    toOffer: () => void;
    toPartner: () => void;

    toAboutFromTeam1: () => void;
    toTeam1FromTeam2: () => void;
    toTeam2FromOffer: () => void;
    toOfferFromPartner: () => void;

    toCasesFromPartner: () => void;
    toPartnerFromCases: () => void;
    toContactFromCases: () => void;
  };

  // complex transitions
  transitionToAboutStart: (viaScroll?: boolean) => void | (() => void);
  transitionToAbout: (viaScroll?: boolean) => void | (() => void);
  transitionBackToHeroFromAboutStart: (viaScroll?: boolean) => void | (() => void);
  transitionBackFromContact: (viaScroll?: boolean) => void | (() => void);

  // scroll handlers for useScrollTransition
  handleScrollDown: () => void;
  handleScrollUp: () => void;

  // back button action
  handleBackClick: () => void;

  // UI setters used by page-level hooks
  setContactVisible: (v: boolean) => void;
  setLeavingContact: (v: boolean) => void;
  previousSectionRef: React.RefObject<Section>;
}

interface UseHomeNavigationOptions {
  setHeroVisible: (v: boolean) => void;
  setAboutStartVisible: (v: boolean) => void;
}

export function useHomeNavigation(
  refs: HomeNavigationVideoRefs,
  { setHeroVisible, setAboutStartVisible }: UseHomeNavigationOptions
): UseHomeNavigationResult {
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

  const { transitionVideoRef } = refs;

  const handleTransition = useCallback(
    (
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

      // Prepare target
      const targetVideo = targetVideoRef.current;
      if (targetVideo) {
        targetVideo.currentTime = 0;
        if (targetVideo.readyState < 2) {
          targetVideo.load();
        }
      }

      setTimeout(() => {
        try {
          const transitionEl = transitionVideoRef.current;
          if (!transitionEl) {
            homeLogger.error('transitionVideoRef.current is null!');
            return;
          }

          transitionEl.currentTime = 0;
          if (transitionEl.readyState < 2) {
            transitionEl.load();
          }

          const handleCanPlay = () => {
            setIsTransitioning(true);
            transitionEl.play().catch(err => {
              homeLogger.warn('Transition video play error:', err.name);
              setCurrentSection(targetSection);
              setIsTransitioning(false);
              isTransitioningRef.current = false;
              targetVideoRef.current?.play().catch(() => {});
            });
          };

          transitionEl.onended = () => {
            if (targetVideoRef.current) {
              targetVideoRef.current.currentTime = 0;
              targetVideoRef.current.play().catch(() => {});
            }

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setCurrentSection(targetSection);
                setIsTransitioning(false);
                isTransitioningRef.current = false;

                if (targetSection === 'hero') setHeroVisible(true);
                if (targetSection === 'aboutStart') setAboutStartVisible(true);
              });
            });
          };

          if (transitionEl.readyState >= 3) {
            handleCanPlay();
          } else {
            transitionEl.addEventListener('canplay', handleCanPlay, { once: true });
          }
        } catch (err) {
          homeLogger.error('Transition error:', err);
          setCurrentSection(targetSection);
          setIsTransitioning(false);
          isTransitioningRef.current = false;
        }
      }, 50);
    },
    [currentSection, setAboutStartVisible, setHeroVisible, transitionVideoRef]
  );

  const transitions = useMemo(
    () => ({
      toShowreel: () => handleTransition('showreel', VIDEO_PATHS.heroToShowreel, refs.showreelVideoRef, true),
      toCases: () => handleTransition('cases', VIDEO_PATHS.heroToCases, refs.casesVideoRef, true),
      toContact: () => {
        previousSectionRef.current = 'hero';
        handleTransition('contact', VIDEO_PATHS.heroToContact, refs.contactVideoRef, true);
      },
      toHero: () => {
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
        previousSectionRef.current = 'hero';
        handleTransition('hero', reverseVideo, refs.heroVideoRef);
      },

      toAboutFromAboutStart: () => handleTransition('about', VIDEO_PATHS.aboutStartToAbout, refs.aboutVideoRef),
      toAboutStartFromAbout: () => handleTransition('aboutStart', VIDEO_PATHS.aboutToAboutStart, refs.aboutStartVideoRef),

      toTeam1: () => handleTransition('team1', VIDEO_PATHS.aboutToTeam, refs.team1VideoRef),
      toTeam2: () => handleTransition('team2', VIDEO_PATHS.team1ToTeam2, refs.team2VideoRef),
      toOffer: () => handleTransition('offer', VIDEO_PATHS.team2ToOffer, refs.offerVideoRef),
      toPartner: () => handleTransition('partner', VIDEO_PATHS.offerToPartner, refs.partnerVideoRef),

      toAboutFromTeam1: () => handleTransition('about', VIDEO_PATHS.teamToAbout, refs.aboutVideoRef),
      toTeam1FromTeam2: () => handleTransition('team1', VIDEO_PATHS.team2ToTeam1, refs.team1VideoRef),
      toTeam2FromOffer: () => handleTransition('team2', VIDEO_PATHS.offerToTeam2, refs.team2VideoRef),
      toOfferFromPartner: () => handleTransition('offer', VIDEO_PATHS.partnerToOffer, refs.offerVideoRef),

      toCasesFromPartner: () => handleTransition('cases', VIDEO_PATHS.partnerToCases, refs.casesVideoRef),
      toPartnerFromCases: () => handleTransition('partner', VIDEO_PATHS.casesToPartner, refs.partnerVideoRef),
      toContactFromCases: () => {
        previousSectionRef.current = 'cases';
        handleTransition('contact', VIDEO_PATHS.casesToContact, refs.contactVideoRef);
      },
    }),
    [currentSection, handleTransition, refs]
  );

  // pending transitions after loop speed up
  useEffect(() => {
    if (!pendingTransition) return;
    if (waitingForHeroLoop || waitingForAboutStartLoop || waitingForContactLoop) return;

    const timer = setTimeout(() => {
      homeLogger.debug('Pending transition ready, starting transition to:', pendingTransition.section);
      handleTransition(pendingTransition.section, pendingTransition.video, pendingTransition.ref, false);
      setPendingTransition(null);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    pendingTransition,
    waitingForHeroLoop,
    waitingForAboutStartLoop,
    waitingForContactLoop,
    handleTransition,
  ]);

  const transitionToAboutStart = useCallback(
    (viaScroll: boolean = false) => {
      if (viaScroll && currentSection === 'hero') {
        setWaitingForHeroLoop(true);
        setHeroVisible(false);

        const cleanup = speedUpVideoLoop({
          videoRef: refs.heroVideoRef,
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
              ref: refs.aboutStartVideoRef,
            });
          },
        });

        return cleanup;
      }

      handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, refs.aboutStartVideoRef, true);
    },
    [currentSection, handleTransition, refs.aboutStartVideoRef, refs.heroVideoRef, setHeroVisible]
  );

  const transitionToAbout = useCallback(
    (viaScroll: boolean = false) => {
      if (viaScroll && currentSection === 'aboutStart') {
        setWaitingForAboutStartLoop(true);
        setAboutStartVisible(false);

        const cleanup = speedUpVideoLoop({
          videoRef: refs.aboutStartVideoRef,
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
              ref: refs.aboutVideoRef,
            });
          },
        });

        return cleanup;
      }

      handleTransition('about', VIDEO_PATHS.aboutStartToAbout, refs.aboutVideoRef);
    },
    [currentSection, handleTransition, refs.aboutStartVideoRef, refs.aboutVideoRef, setAboutStartVisible]
  );

  const transitionBackToHeroFromAboutStart = useCallback(
    (viaScroll: boolean = false) => {
      if (viaScroll && currentSection === 'aboutStart') {
        setWaitingForAboutStartLoop(true);
        setAboutStartVisible(false);

        const cleanup = speedUpVideoLoop({
          videoRef: refs.aboutStartVideoRef,
          speedMultiplier: 5.0,
          onProgress: (current, duration) => {
            homeLogger.loopProgress(current, duration, 5.0);
          },
          onLoopComplete: () => {
            homeLogger.loopComplete('AboutStart');
            setWaitingForAboutStartLoop(false);
            setPendingTransition({
              section: 'hero',
              video: VIDEO_PATHS.aboutStartToHero,
              ref: refs.heroVideoRef,
            });
          },
        });

        return cleanup;
      }

      previousSectionRef.current = 'hero';
      handleTransition('hero', VIDEO_PATHS.aboutStartToHero, refs.heroVideoRef);
    },
    [currentSection, handleTransition, refs.aboutStartVideoRef, refs.heroVideoRef, setAboutStartVisible]
  );

  const transitionBackFromContact = useCallback(
    (viaScroll: boolean = false) => {
      const previousSection = previousSectionRef.current;

      if (viaScroll && currentSection === 'contact') {
        setWaitingForContactLoop(true);
        setContactVisible(false);

        const cleanup = speedUpVideoLoop({
          videoRef: refs.contactVideoRef,
          speedMultiplier: 5.0,
          onProgress: (current, duration) => homeLogger.loopProgress(current, duration, 5.0),
          onLoopComplete: () => {
            homeLogger.loopComplete('Contact');
            setWaitingForContactLoop(false);

            if (previousSection === 'cases') {
              handleTransition('cases', VIDEO_PATHS.contactToCases, refs.casesVideoRef);
              previousSectionRef.current = 'partner';
            } else {
              previousSectionRef.current = 'hero';
              handleTransition('hero', VIDEO_PATHS.contactToHero, refs.heroVideoRef);
            }
          },
        });

        return cleanup;
      }

      setLeavingContact(true);
      setContactVisible(false);

      setTimeout(() => {
        if (previousSection === 'cases') {
          handleTransition('cases', VIDEO_PATHS.contactToCases, refs.casesVideoRef);
          previousSectionRef.current = 'partner';
        } else {
          previousSectionRef.current = 'hero';
          handleTransition('hero', VIDEO_PATHS.contactToHero, refs.heroVideoRef);
        }
      }, 400);
    },
    [currentSection, handleTransition, refs.casesVideoRef, refs.contactVideoRef, refs.heroVideoRef]
  );

  const handleScrollDown = useCallback(() => {
    switch (currentSection) {
      case 'hero':
        transitionToAboutStart(true);
        break;
      case 'aboutStart':
        transitionToAbout(true);
        break;
      case 'about':
        transitions.toTeam1();
        break;
      case 'team1':
        transitions.toTeam2();
        break;
      case 'team2':
        transitions.toOffer();
        break;
      case 'offer':
        transitions.toPartner();
        break;
      case 'partner':
        previousSectionRef.current = 'partner';
        transitions.toCasesFromPartner();
        break;
      case 'cases':
        transitions.toContactFromCases();
        break;
      case 'contact':
        transitionBackFromContact(true);
        break;
    }
  }, [currentSection, transitionBackFromContact, transitionToAbout, transitionToAboutStart, transitions]);

  const handleScrollUp = useCallback(() => {
    switch (currentSection) {
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
    }
  }, [currentSection, transitionBackFromContact, transitionBackToHeroFromAboutStart, transitions]);

  const handleBackClick = useCallback(() => {
    switch (currentSection) {
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
  }, [currentSection, transitionBackFromContact, transitionBackToHeroFromAboutStart, transitions]);

  return {
    currentSection,
    isTransitioning,
    transitionVideoSrc,
    contactVisible,
    leavingContact,
    waitingForHeroLoop,
    waitingForAboutStartLoop,
    waitingForContactLoop,
    transitions,
    transitionToAboutStart,
    transitionToAbout,
    transitionBackToHeroFromAboutStart,
    transitionBackFromContact,
    handleScrollDown,
    handleScrollUp,
    handleBackClick,
    setContactVisible,
    setLeavingContact,
    previousSectionRef,
  };
}
