import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Section } from '../constants/config';
import { VIDEO_PATHS } from '../constants/config';
import { homeLogger } from '../utils/logger';

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
  currentSection: Section;
  isTransitioning: boolean;
  transitionVideoSrc: string;

  contactVisible: boolean;
  leavingContact: boolean;

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

  transitionToAboutStart: (viaScroll?: boolean) => void | (() => void);
  transitionToAbout: (viaScroll?: boolean) => void | (() => void);
  transitionBackToHeroFromAboutStart: (viaScroll?: boolean) => void | (() => void);
  transitionBackFromContact: (viaScroll?: boolean) => void | (() => void);

  handleScrollDown: () => void;
  handleScrollUp: () => void;
  handleBackClick: () => void;

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

      homeLogger.info('[Transition] request', {
        from: currentSection,
        to: targetSection,
        transitionVideo,
        isDirectNavigation,
      });

      if (currentSection === 'hero' && targetSection !== 'hero') {
        setHeroVisible(false);
      }
      if (currentSection === 'aboutStart' && targetSection !== 'aboutStart') {
        setAboutStartVisible(false);
      }

      if (targetSection === 'aboutStart') {
        setAboutStartVisible(false);
      }

      if (isDirectNavigation && currentSection === 'hero') {
        previousSectionRef.current = 'hero';
      }

      isTransitioningRef.current = true;
      setTransitionVideoSrc(transitionVideo);

      const targetVideo = targetVideoRef.current;
      if (targetVideo) {
        // Avoid forcing a seek-to-0 for the contact loop.
        // During Contact exit we intentionally speed the loop and freeze near the end;
        // an external seek (back to 0) can trigger `waiting` and a brief black flash.
        if (targetSection !== 'contact') {
          targetVideo.currentTime = 0;
        }
        if (targetVideo.readyState < 2) targetVideo.load();
      }

      setTimeout(() => {
        try {
          const transitionEl = transitionVideoRef.current;
          if (!transitionEl) {
            homeLogger.error('transitionVideoRef.current is null!');
            return;
          }

          const tName = `[TransitionVideo ${targetSection}]`;
          const logState = (label: string) => {
            homeLogger.debug(tName + ' ' + label, {
              readyState: transitionEl.readyState,
              networkState: transitionEl.networkState,
              paused: transitionEl.paused,
              currentTime: Number.isFinite(transitionEl.currentTime) ? Number(transitionEl.currentTime.toFixed(3)) : null,
              duration: Number.isFinite(transitionEl.duration) ? Number(transitionEl.duration.toFixed(3)) : null,
              src: transitionEl.currentSrc || transitionEl.src,
            });
          };

          const onLoadedData = () => logState('loadeddata');
          const onCanPlay = () => logState('canplay');
          const onPlay = () => logState('play');
          const onPlaying = () => logState('playing');
          const onWaiting = () => logState('waiting');
          const onStalled = () => logState('stalled');
          const onSeeking = () => logState('seeking');
          const onSeeked = () => logState('seeked');

          transitionEl.addEventListener('loadeddata', onLoadedData);
          transitionEl.addEventListener('canplay', onCanPlay);
          transitionEl.addEventListener('play', onPlay);
          transitionEl.addEventListener('playing', onPlaying);
          transitionEl.addEventListener('waiting', onWaiting);
          transitionEl.addEventListener('stalled', onStalled);
          transitionEl.addEventListener('seeking', onSeeking);
          transitionEl.addEventListener('seeked', onSeeked);

          transitionEl.currentTime = 0;
          if (transitionEl.readyState < 2) transitionEl.load();
          logState('after load/currentTime=0');

          const handleCanPlay = () => {
            homeLogger.info('[Transition] canplay -> setIsTransitioning(true) + play()', {
              from: currentSection,
              to: targetSection,
            });
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
            logState('ended');

            transitionEl.removeEventListener('loadeddata', onLoadedData);
            transitionEl.removeEventListener('canplay', onCanPlay);
            transitionEl.removeEventListener('play', onPlay);
            transitionEl.removeEventListener('playing', onPlaying);
            transitionEl.removeEventListener('waiting', onWaiting);
            transitionEl.removeEventListener('stalled', onStalled);
            transitionEl.removeEventListener('seeking', onSeeking);
            transitionEl.removeEventListener('seeked', onSeeked);

            if (targetVideoRef.current) {
              targetVideoRef.current.currentTime = 0;
              targetVideoRef.current.play().catch(() => {});
            }

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                homeLogger.info('[Transition] commit section', {
                  to: targetSection,
                });
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

  const transitionToAboutStart = useCallback(
    (viaScroll: boolean = false) => {
      // No longer wait for the Hero loop to complete; start transition immediately.
      handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, refs.aboutStartVideoRef, true);
    },
    [handleTransition, refs.aboutStartVideoRef]
  );

  const transitionToAbout = useCallback(
    (viaScroll: boolean = false) => {
      // No longer wait for the AboutStart loop to complete; start transition immediately.
      handleTransition('about', VIDEO_PATHS.aboutStartToAbout, refs.aboutVideoRef);
    },
    [handleTransition, refs.aboutVideoRef]
  );

  const transitionBackToHeroFromAboutStart = useCallback(
    (viaScroll: boolean = false) => {
      // No longer wait for the AboutStart loop to complete; start transition immediately.
      previousSectionRef.current = 'hero';
      handleTransition('hero', VIDEO_PATHS.aboutStartToHero, refs.heroVideoRef);
    },
    [handleTransition, refs.heroVideoRef]
  );

  const transitionBackFromContact = useCallback(
    () => {
      const previousSection = previousSectionRef.current;

      if (currentSection !== 'contact') return;

      // No longer speed up / wait for the contact loop. Freeze defensively, then transition immediately.
      setLeavingContact(true);
      setContactVisible(false);

      const contactEl = refs.contactVideoRef.current;
      if (contactEl) {
        const dur = Number.isFinite(contactEl.duration) ? contactEl.duration : null;
        try {
          if (dur) contactEl.currentTime = Math.max(0, dur - 0.01);
        } catch {
          // ignore
        }
        try {
          contactEl.pause();
          contactEl.playbackRate = 1.0;
        } catch {
          // ignore
        }
      }

      if (previousSection === 'cases') {
        handleTransition('cases', VIDEO_PATHS.contactToCases, refs.casesVideoRef);
        previousSectionRef.current = 'partner';
      } else {
        previousSectionRef.current = 'hero';
        handleTransition('hero', VIDEO_PATHS.contactToHero, refs.heroVideoRef);
      }
    },
    [
      currentSection,
      handleTransition,
      refs.casesVideoRef,
      refs.contactVideoRef,
      refs.heroVideoRef,
    ]
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
        transitionBackFromContact();
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
        transitionBackFromContact();
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
        transitionBackFromContact();
        break;
    }
  }, [currentSection, transitionBackFromContact, transitionBackToHeroFromAboutStart, transitions]);

  return {
    currentSection,
    isTransitioning,
    transitionVideoSrc,
    contactVisible,
    leavingContact,
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
