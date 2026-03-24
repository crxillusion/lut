import { useCallback, useMemo } from 'react';
import type { Section } from '../constants/config';
import { VIDEO_PATHS } from '../constants/config';
import { homeLogger, contactLogger } from '../utils/logger';
import { videoPlaybackManager } from '../utils/VideoPlaybackManager';
import { useNavigationSound } from './useNavigationSound';
import type { NavigationState, NavigationStateActions, NavigationStateRefs } from './useNavigationState';

// How long (ms) to let the contact UI fade-out animation play before kicking off the
// video transition (which sets isTransitioning=true and hides the contact section).
// The Framer Motion exit duration is 0.4s; we add extra headroom for React commit lag.
const CONTACT_FADEOUT_DELAY_MS = 600;

export interface NavigationTransitionVideoRefs {
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

export interface UseNavigationTransitionsResult {
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
  transitionToAboutStart: (viaScroll?: boolean) => void;
  transitionToAbout: (viaScroll?: boolean) => void;
  transitionBackToHeroFromAboutStart: (viaScroll?: boolean) => void;
  transitionBackFromContact: () => void;
  handleScrollDown: () => void;
  handleScrollUp: () => void;
  handleBackClick: () => void;
}

export function useNavigationTransitions(
  videoRefs: NavigationTransitionVideoRefs,
  state: NavigationState,
  actions: NavigationStateActions,
  refs: NavigationStateRefs
): UseNavigationTransitionsResult {
  const { playSound } = useNavigationSound();

  const handleTransition = useCallback(
    (
      targetSection: Section,
      transitionVideo: string,
      targetVideoRef: React.RefObject<HTMLVideoElement | null>,
      isDirectNavigation: boolean = false
    ) => {
      if (refs.isTransitioningRef.current) {
        homeLogger.warn('[Transition] ⛔ Already transitioning — ignoring request', {
          from: state.currentSection,
          to: targetSection,
        });
        return;
      }

      homeLogger.info('[Transition] ▶️ START', {
        from: state.currentSection,
        to: targetSection,
        transitionVideo,
        isDirectNavigation,
        'isTransitioningRef.current': refs.isTransitioningRef.current,
      });

      // --- UI hide for current section ---
      if (state.currentSection === 'hero' && targetSection !== 'hero') {
        homeLogger.debug('[Transition] Hiding hero UI (setHeroVisible false)');
        actions.setHeroVisible(false);
      }
      if (state.currentSection === 'aboutStart' && targetSection !== 'aboutStart') {
        homeLogger.debug('[Transition] Hiding aboutStart UI (setAboutStartVisible false)');
        actions.setAboutStartVisible(false);
      }
      if (targetSection === 'aboutStart') {
        homeLogger.debug('[Transition] Pre-hiding aboutStart UI before transition');
        actions.setAboutStartVisible(false);
      }

      if (isDirectNavigation && state.currentSection === 'hero') {
        homeLogger.debug('[Transition] Saving previousSectionRef = hero (direct nav)');
        refs.previousSectionRef.current = 'hero';
      }

      refs.isTransitioningRef.current = true;
      actions.setIsTransitioning(true);
      actions.setTransitionVideoSrc(transitionVideo);

      homeLogger.debug('[Transition] State updated → isTransitioning=true, transitionVideoSrc set', {
        transitionVideo,
      });

      // --- Sound ---
      if (state.currentSection === 'hero' && targetSection !== 'hero') {
        homeLogger.info('[Transition] 🔊 Playing FORWARD sound (hero → other)');
        playSound('forward');
      } else if (state.currentSection !== 'hero' && targetSection === 'hero') {
        homeLogger.info('[Transition] 🔊 Playing BACKWARD sound (other → hero)');
        playSound('backward');
      } else {
        homeLogger.debug('[Transition] No navigation sound for this route', {
          from: state.currentSection,
          to: targetSection,
        });
      }

      // --- Prepare target video ---
      const targetVideo = targetVideoRef.current;
      homeLogger.debug('[Transition] Target video element', {
        exists: !!targetVideo,
        readyState: targetVideo?.readyState,
        src: targetVideo?.currentSrc?.split('/').pop(),
      });

      if (targetVideo) {
        if (targetSection !== 'contact') {
          videoPlaybackManager.stop(targetVideoRef, true);
          homeLogger.debug('[Transition] Target video stopped+reset (non-contact)');
        }
        videoPlaybackManager.load(targetVideoRef);
        homeLogger.debug('[Transition] Target video .load() called');
      } else {
        homeLogger.warn('[Transition] ⚠️ Target videoRef is null — cannot preload');
      }

      // Small delay to ensure src swap committed before playback attempts
      setTimeout(() => {
        try {
          const transitionEl = videoRefs.transitionVideoRef.current;
          if (!transitionEl) {
            homeLogger.error('[Transition] ❌ transitionVideoRef.current is null!');
            // Fail open
            actions.setCurrentSection(targetSection);
            actions.setIsTransitioning(false);
            refs.isTransitioningRef.current = false;
            return;
          }

          homeLogger.debug('[Transition] transitionEl state (before load)', {
            readyState: transitionEl.readyState,
            src: transitionEl.currentSrc?.split('/').pop(),
            duration: transitionEl.duration,
            paused: transitionEl.paused,
          });

          // Prepare transition video for playback
          transitionEl.preload = 'auto';
          videoPlaybackManager.stop(videoRefs.transitionVideoRef, true);
          videoPlaybackManager.load(videoRefs.transitionVideoRef);

          homeLogger.debug('[Transition] transitionEl after stop+load', {
            readyState: transitionEl.readyState,
          });

          const handleCanPlay = () => {
            homeLogger.info('[Transition] ▶️ canplay fired → starting transition video playback', {
              from: state.currentSection,
              to: targetSection,
              readyState: transitionEl.readyState,
            });
            videoPlaybackManager
              .play(videoRefs.transitionVideoRef)
              .then(() => {
                homeLogger.debug('[Transition] Transition video play() resolved');
              })
              .catch((err) => {
                homeLogger.warn('[Transition] ⚠️ Transition video play() error — failing open', {
                  error: (err as Error).message,
                  to: targetSection,
                });
                // Fail open
                actions.setCurrentSection(targetSection);
                actions.setIsTransitioning(false);
                refs.isTransitioningRef.current = false;
                videoPlaybackManager.play(targetVideoRef).catch(() => {});
              });
          };

          const handleTransitionEnd = () => {
            homeLogger.info('[Transition] ✅ Transition video ended → advancing to target section', {
              to: targetSection,
            });

            // Clean up video event listeners
            transitionEl.onended = null;
            transitionEl.removeEventListener('canplay', handleCanPlay);

            // Prepare target video playback
            videoPlaybackManager.play(targetVideoRef).catch((err) => {
              homeLogger.warn('[Transition] ⚠️ Target video play() error after transition', {
                to: targetSection,
                error: (err as Error).message,
              });
            });

            // Use requestAnimationFrame to batch state updates
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                homeLogger.debug('[Transition] rAF: setting currentSection and clearing isTransitioning', {
                  to: targetSection,
                });
                actions.setCurrentSection(targetSection);
                actions.setIsTransitioning(false);
                refs.isTransitioningRef.current = false;

                // Show UI when entering hero or aboutStart
                if (targetSection === 'hero') {
                  homeLogger.debug('[Transition] Showing hero UI (setHeroVisible true)');
                  actions.setHeroVisible(true);
                }
                if (targetSection === 'aboutStart') {
                  homeLogger.debug('[Transition] Showing aboutStart UI (setAboutStartVisible true)');
                  actions.setAboutStartVisible(true);
                }
              });
            });
          };

          transitionEl.onended = handleTransitionEnd;

          // If transition video is already ready, play immediately
          if (transitionEl.readyState >= 3) {
            homeLogger.debug('[Transition] transitionEl already HAVE_FUTURE_DATA — calling handleCanPlay immediately');
            handleCanPlay();
          } else {
            homeLogger.debug('[Transition] Waiting for "canplay" event on transition video');
            transitionEl.addEventListener('canplay', handleCanPlay, { once: true });
          }
        } catch (err) {
          homeLogger.error('[Transition] ❌ Unexpected error in transition setTimeout', err);
          actions.setCurrentSection(targetSection);
          actions.setIsTransitioning(false);
          refs.isTransitioningRef.current = false;
        }
      }, 50);
    },
    [state.currentSection, actions, refs, videoRefs, playSound]
  );

  const transitions = useMemo(
    () => ({
      toShowreel: () =>
        handleTransition('showreel', VIDEO_PATHS.heroToShowreel, videoRefs.showreelVideoRef, true),
      toCases: () =>
        handleTransition('cases', VIDEO_PATHS.heroToCases, videoRefs.casesVideoRef, true),
      toContact: () => {
        refs.previousSectionRef.current = 'hero';
        handleTransition('contact', VIDEO_PATHS.heroToContact, videoRefs.contactVideoRef, true);
      },
      toHero: () => {
        let reverseVideo = '';
        switch (state.currentSection) {
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
            homeLogger.warn('[transitions.toHero] No reverse video for section', { currentSection: state.currentSection });
            return;
        }
        refs.previousSectionRef.current = 'hero';
        handleTransition('hero', reverseVideo, videoRefs.heroVideoRef);
      },

      toAboutFromAboutStart: () =>
        handleTransition('about', VIDEO_PATHS.aboutStartToAbout, videoRefs.aboutVideoRef),
      toAboutStartFromAbout: () =>
        handleTransition('aboutStart', VIDEO_PATHS.aboutToAboutStart, videoRefs.aboutStartVideoRef),

      toTeam1: () => handleTransition('team1', VIDEO_PATHS.aboutToTeam, videoRefs.team1VideoRef),
      toTeam2: () => handleTransition('team2', VIDEO_PATHS.team1ToTeam2, videoRefs.team2VideoRef),
      toOffer: () => handleTransition('offer', VIDEO_PATHS.team2ToOffer, videoRefs.offerVideoRef),
      toPartner: () =>
        handleTransition('partner', VIDEO_PATHS.offerToPartner, videoRefs.partnerVideoRef),

      toAboutFromTeam1: () =>
        handleTransition('about', VIDEO_PATHS.teamToAbout, videoRefs.aboutVideoRef),
      toTeam1FromTeam2: () =>
        handleTransition('team1', VIDEO_PATHS.team2ToTeam1, videoRefs.team1VideoRef),
      toTeam2FromOffer: () =>
        handleTransition('team2', VIDEO_PATHS.offerToTeam2, videoRefs.team2VideoRef),
      toOfferFromPartner: () =>
        handleTransition('offer', VIDEO_PATHS.partnerToOffer, videoRefs.offerVideoRef),

      toCasesFromPartner: () =>
        handleTransition('cases', VIDEO_PATHS.partnerToCases, videoRefs.casesVideoRef),
      toPartnerFromCases: () =>
        handleTransition('partner', VIDEO_PATHS.casesToPartner, videoRefs.partnerVideoRef),
      toContactFromCases: () => {
        refs.previousSectionRef.current = 'cases';
        handleTransition('contact', VIDEO_PATHS.casesToContact, videoRefs.contactVideoRef);
      },
    }),
    [state.currentSection, handleTransition, videoRefs, refs]
  );

  const transitionToAboutStart = useCallback(
    (viaScroll: boolean = false) => {
      homeLogger.info('[transitionToAboutStart] viaScroll=' + viaScroll);
      handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, videoRefs.aboutStartVideoRef, true);
    },
    [handleTransition, videoRefs.aboutStartVideoRef]
  );

  const transitionToAbout = useCallback(
    (viaScroll: boolean = false) => {
      homeLogger.info('[transitionToAbout] viaScroll=' + viaScroll);
      handleTransition('about', VIDEO_PATHS.aboutStartToAbout, videoRefs.aboutVideoRef);
    },
    [handleTransition, videoRefs.aboutVideoRef]
  );

  const transitionBackToHeroFromAboutStart = useCallback(
    (viaScroll: boolean = false) => {
      homeLogger.info('[transitionBackToHeroFromAboutStart] viaScroll=' + viaScroll);
      refs.previousSectionRef.current = 'hero';
      handleTransition('hero', VIDEO_PATHS.aboutStartToHero, videoRefs.heroVideoRef);
    },
    [handleTransition, videoRefs.heroVideoRef, refs]
  );

  /**
   * Leave the contact section:
   * 1. Immediately set isLeavingContactRef (sync guard) + fade out contact UI
   * 2. After CONTACT_FADEOUT_DELAY_MS, begin the actual video transition so the
   *    section stays visible long enough for the fade-out animation to complete.
   */
  const transitionBackFromContact = useCallback(() => {
    contactLogger.info('[transitionBackFromContact] 🚀 Triggered', {
      currentSection: state.currentSection,
      isTransitioningRef: refs.isTransitioningRef.current,
      isLeavingContactRef: refs.isLeavingContactRef.current,
      contactVideoReadyState: videoRefs.contactVideoRef.current?.readyState,
      contactVideoDuration: videoRefs.contactVideoRef.current?.duration,
      contactVideoCurrentTime: videoRefs.contactVideoRef.current?.currentTime,
    });

    if (state.currentSection !== 'contact') {
      contactLogger.warn('[transitionBackFromContact] ⛔ Not on contact section — ignoring', {
        currentSection: state.currentSection,
      });
      return;
    }

    if (refs.isTransitioningRef.current) {
      contactLogger.warn('[transitionBackFromContact] ⛔ Already transitioning (isTransitioningRef) — ignoring');
      return;
    }

    // Guard against double-fire during the fade window (isTransitioningRef is still false here)
    if (refs.isLeavingContactRef.current) {
      contactLogger.warn('[transitionBackFromContact] ⛔ Already leaving contact (isLeavingContactRef) — ignoring');
      return;
    }

    // Set the sync guard immediately so any re-render during the delay can't re-trigger
    refs.isLeavingContactRef.current = true;
    contactLogger.info('[transitionBackFromContact] ✅ isLeavingContactRef=true (sync guard set)');

    // Step 1: Fade out the contact UI elements immediately
    contactLogger.info('[transitionBackFromContact] Step 1 — Fade out UI (setLeavingContact=true, setContactVisible=false)');
    actions.setLeavingContact(true);
    actions.setContactVisible(false);

    // Pause the contact loop video
    const contactEl = videoRefs.contactVideoRef.current;
    if (contactEl) {
      const dur = Number.isFinite(contactEl.duration) ? contactEl.duration : null;
      contactLogger.debug('[transitionBackFromContact] contactEl state', {
        duration: dur,
        currentTime: contactEl.currentTime,
        paused: contactEl.paused,
        readyState: contactEl.readyState,
      });
      try {
        if (dur) contactEl.currentTime = Math.max(0, dur - 0.01);
      } catch (e) {
        contactLogger.warn('[transitionBackFromContact] Could not seek contactEl to near-end', e);
      }
      try {
        contactEl.pause();
        contactEl.playbackRate = 1.0;
        contactLogger.debug('[transitionBackFromContact] contactEl paused');
      } catch (e) {
        contactLogger.warn('[transitionBackFromContact] Could not pause contactEl', e);
      }
    } else {
      contactLogger.warn('[transitionBackFromContact] ⚠️ contactVideoRef.current is null');
    }

    refs.previousSectionRef.current = 'hero';

    // Step 2: After fade-out animation completes, begin the video transition
    contactLogger.info(`[transitionBackFromContact] Step 2 — Scheduling handleTransition in ${CONTACT_FADEOUT_DELAY_MS}ms`);
    setTimeout(() => {
      contactLogger.info('[transitionBackFromContact] Step 2 — Delay elapsed → calling handleTransition(hero, contactToHero)', {
        isTransitioningRef: refs.isTransitioningRef.current,
        isLeavingContactRef: refs.isLeavingContactRef.current,
      });
      // Clear the leaving guard — isTransitioningRef takes over from here
      refs.isLeavingContactRef.current = false;
      handleTransition('hero', VIDEO_PATHS.contactToHero, videoRefs.heroVideoRef);
    }, CONTACT_FADEOUT_DELAY_MS);
  }, [state.currentSection, actions, videoRefs.contactVideoRef, videoRefs.heroVideoRef, handleTransition, refs]);

  const handleScrollDown = useCallback(() => {
    homeLogger.debug('[handleScrollDown] currentSection=' + state.currentSection);
    switch (state.currentSection) {
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
        refs.previousSectionRef.current = 'partner';
        transitions.toCasesFromPartner();
        break;
      case 'cases':
        transitions.toContactFromCases();
        break;
      case 'contact':
        homeLogger.info('[handleScrollDown] On contact → calling transitionBackFromContact (scroll down = exit)');
        transitionBackFromContact();
        break;
      default:
        homeLogger.debug('[handleScrollDown] No scroll-down handler for', state.currentSection);
    }
  }, [state.currentSection, transitions, transitionToAboutStart, transitionToAbout, transitionBackFromContact, refs]);

  const handleScrollUp = useCallback(() => {
    homeLogger.debug('[handleScrollUp] currentSection=' + state.currentSection);
    switch (state.currentSection) {
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
        homeLogger.debug('[handleScrollUp] cases → previousSectionRef=' + refs.previousSectionRef.current);
        if (refs.previousSectionRef.current === 'hero') {
          transitions.toHero();
        } else {
          refs.previousSectionRef.current = 'partner';
          transitions.toPartnerFromCases();
        }
        break;
      case 'contact':
        homeLogger.info('[handleScrollUp] On contact → calling transitionBackFromContact');
        transitionBackFromContact();
        break;
      default:
        homeLogger.debug('[handleScrollUp] No scroll-up handler for', state.currentSection);
    }
  }, [state.currentSection, transitions, transitionBackToHeroFromAboutStart, transitionBackFromContact, refs]);

  const handleBackClick = useCallback(() => {
    homeLogger.info('[handleBackClick] currentSection=' + state.currentSection);
    switch (state.currentSection) {
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
        homeLogger.info('[handleBackClick] On contact → calling transitionBackFromContact');
        transitionBackFromContact();
        break;
      default:
        homeLogger.debug('[handleBackClick] No back handler for', state.currentSection);
    }
  }, [state.currentSection, transitions, transitionBackToHeroFromAboutStart, transitionBackFromContact]);

  return {
    transitions,
    transitionToAboutStart,
    transitionToAbout,
    transitionBackToHeroFromAboutStart,
    transitionBackFromContact,
    handleScrollDown,
    handleScrollUp,
    handleBackClick,
  };
}
