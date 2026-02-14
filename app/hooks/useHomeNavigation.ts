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
  currentSection: Section;
  isTransitioning: boolean;
  transitionVideoSrc: string;

  contactVisible: boolean;
  leavingContact: boolean;
  waitingForHeroLoop: boolean;
  waitingForAboutStartLoop: boolean;
  waitingForContactLoop: boolean;

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
          onProgress: (current, duration) => homeLogger.loopProgress(current, duration, 5.0),
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
          onProgress: (current, duration) => homeLogger.loopProgress(current, duration, 5.0),
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
          onProgress: (current, duration) => homeLogger.loopProgress(current, duration, 5.0),
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
    () => {
      const previousSection = previousSectionRef.current;

      if (currentSection !== 'contact') return;

      homeLogger.info('[ContactExit] begin', {
        previousSection,
        currentSection,
        contact: {
          readyState: refs.contactVideoRef.current?.readyState,
          paused: refs.contactVideoRef.current?.paused,
          currentTime: refs.contactVideoRef.current?.currentTime,
          duration: refs.contactVideoRef.current?.duration,
          playbackRate: refs.contactVideoRef.current?.playbackRate,
        },
      });

      setWaitingForContactLoop(true);
      setLeavingContact(true);
      setContactVisible(false);

      let transitionStarted = false;
      let frozeContact = false;

      const contactEl = refs.contactVideoRef.current;

      const freezeContactNow = (reason: string) => {
        if (!contactEl || frozeContact) return;
        frozeContact = true;

        const dur = Number.isFinite(contactEl.duration) ? contactEl.duration : null;
        const t = Number.isFinite(contactEl.currentTime) ? contactEl.currentTime : null;

        homeLogger.info('[ContactExit] freezeContactNow', {
          reason,
          t,
          dur,
          playbackRate: contactEl.playbackRate,
          readyState: contactEl.readyState,
          paused: contactEl.paused,
        });

        // Best-effort: clamp near the end and pause to prevent an internal loop reset -> black flash.
        try {
          if (dur) contactEl.currentTime = Math.max(0, dur - 0.01);
        } catch {
          // ignore
        }
        try {
          contactEl.pause();
        } catch {
          // ignore
        }
      };

      const startTransition = (reason: string) => {
        if (transitionStarted) {
          homeLogger.debug('[ContactExit] startTransition skipped (already started)', { reason });
          return;
        }
        transitionStarted = true;

        // Freeze contact immediately when we decide to transition.
        freezeContactNow('startTransition:' + reason);

        const transitionEl = refs.transitionVideoRef.current;
        homeLogger.info('[ContactExit] startTransition', {
          reason,
          previousSection,
          target: previousSection === 'cases' ? 'cases' : 'hero',
          transition: {
            hasEl: Boolean(transitionEl),
            readyState: transitionEl?.readyState,
            paused: transitionEl?.paused,
            currentTime: transitionEl?.currentTime,
            duration: transitionEl?.duration,
            src: transitionEl?.currentSrc || transitionEl?.src,
          },
          contact: {
            readyState: refs.contactVideoRef.current?.readyState,
            paused: refs.contactVideoRef.current?.paused,
            currentTime: refs.contactVideoRef.current?.currentTime,
            duration: refs.contactVideoRef.current?.duration,
            playbackRate: refs.contactVideoRef.current?.playbackRate,
          },
        });

        if (previousSection === 'cases') {
          handleTransition('cases', VIDEO_PATHS.contactToCases, refs.casesVideoRef);
          previousSectionRef.current = 'partner';
        } else {
          previousSectionRef.current = 'hero';
          handleTransition('hero', VIDEO_PATHS.contactToHero, refs.heroVideoRef);
        }
      };

      const NEAR_END_S = 0.12;

      const nearEndCheck = () => {
        if (!contactEl || transitionStarted) return;
        const dur = Number.isFinite(contactEl.duration) ? contactEl.duration : 0;
        const t = Number.isFinite(contactEl.currentTime) ? contactEl.currentTime : 0;
        if (!dur) return;

        // Freeze slightly before wrap, even before we start the transition.
        if (!frozeContact && t >= dur - NEAR_END_S) {
          freezeContactNow('near_end_freeze');
        }

        if (t >= dur - NEAR_END_S) {
          homeLogger.debug('[ContactExit] near-end detected', { t, dur, NEAR_END_S });
          startTransition('near_end_timeupdate');
        }
      };

      const onContactSeeking = () =>
        homeLogger.debug('[ContactExit][contact] seeking', {
          currentTime: contactEl?.currentTime,
          frozeContact,
          transitionStarted,
        });
      const onContactSeeked = () =>
        homeLogger.debug('[ContactExit][contact] seeked', {
          currentTime: contactEl?.currentTime,
          frozeContact,
          transitionStarted,
        });
      const onContactWaiting = () => {
        // If we've frozen intentionally, waiting at t=0 is likely an internal reset; log it separately.
        const t = contactEl?.currentTime;
        if (frozeContact) {
          homeLogger.warn('[ContactExit][contact] waiting (after freeze)', { currentTime: t });
          return;
        }
        homeLogger.warn('[ContactExit][contact] waiting', { currentTime: t });
      };

      contactEl?.addEventListener('timeupdate', nearEndCheck);
      contactEl?.addEventListener('seeking', onContactSeeking);
      contactEl?.addEventListener('seeked', onContactSeeked);
      contactEl?.addEventListener('waiting', onContactWaiting);

      const cleanup = speedUpVideoLoop({
        videoRef: refs.contactVideoRef,
        speedMultiplier: 5.0,
        earlyCompleteSeconds: 0.12,
        onProgress: (current, duration) => homeLogger.loopProgress(current, duration, 5.0),
        onLoopComplete: () => {
          homeLogger.loopComplete('Contact');
          setWaitingForContactLoop(false);

          // Freeze before starting transition (defensive).
          freezeContactNow('loop_complete');
          startTransition('loop_complete');
        },
      });

      return () => {
        homeLogger.info('[ContactExit] cleanup');
        contactEl?.removeEventListener('timeupdate', nearEndCheck);
        contactEl?.removeEventListener('seeking', onContactSeeking);
        contactEl?.removeEventListener('seeked', onContactSeeked);
        contactEl?.removeEventListener('waiting', onContactWaiting);
        cleanup?.();
      };
    },
    [
      currentSection,
      handleTransition,
      refs.casesVideoRef,
      refs.contactVideoRef,
      refs.heroVideoRef,
      refs.transitionVideoRef,
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
