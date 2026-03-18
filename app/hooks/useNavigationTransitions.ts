import { useCallback, useMemo } from 'react';
import type { Section } from '../constants/config';
import { VIDEO_PATHS } from '../constants/config';
import { homeLogger } from '../utils/logger';
import { videoPlaybackManager } from '../utils/VideoPlaybackManager';
import { useNavigationSound } from './useNavigationSound';
import type { NavigationState, NavigationStateActions, NavigationStateRefs } from './useNavigationState';

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
        homeLogger.warn('[Transition] Already transitioning, ignoring');
        return;
      }

      homeLogger.info('[Transition] request', {
        from: state.currentSection,
        to: targetSection,
        transitionVideo,
        isDirectNavigation,
      });

      if (state.currentSection === 'hero' && targetSection !== 'hero') {
        actions.setHeroVisible(false);
      }
      if (state.currentSection === 'aboutStart' && targetSection !== 'aboutStart') {
        actions.setAboutStartVisible(false);
      }

      if (targetSection === 'aboutStart') {
        actions.setAboutStartVisible(false);
      }

      if (isDirectNavigation && state.currentSection === 'hero') {
        refs.previousSectionRef.current = 'hero';
      }

      refs.isTransitioningRef.current = true;
      actions.setIsTransitioning(true);
      actions.setTransitionVideoSrc(transitionVideo);

      if (state.currentSection === 'hero' && targetSection !== 'hero') {
        playSound('forward');
      } else if (state.currentSection !== 'hero' && targetSection === 'hero') {
        playSound('backward');
      }

      const targetVideo = targetVideoRef.current;
      if (targetVideo) {
        if (targetSection !== 'contact') {
          videoPlaybackManager.stop(targetVideoRef, true);
        }
        videoPlaybackManager.load(targetVideoRef);
      }

      // Small delay to ensure src swap committed before playback attempts
      setTimeout(() => {
        try {
          const transitionEl = videoRefs.transitionVideoRef.current;
          if (!transitionEl) {
            homeLogger.error('transitionVideoRef.current is null!');
            return;
          }

          // Prepare transition video for playback
          transitionEl.preload = 'auto';
          videoPlaybackManager.stop(videoRefs.transitionVideoRef, true);
          videoPlaybackManager.load(videoRefs.transitionVideoRef);

          const handleCanPlay = () => {
            homeLogger.info('[Transition] canplay -> start playback', {
              from: state.currentSection,
              to: targetSection,
            });
            videoPlaybackManager
              .play(videoRefs.transitionVideoRef)
              .catch((err) => {
                homeLogger.warn('Transition video play error:', (err as Error).message);
                // Fail open - advance to target section even if video fails
                actions.setCurrentSection(targetSection);
                actions.setIsTransitioning(false);
                refs.isTransitioningRef.current = false;
                videoPlaybackManager.play(targetVideoRef).catch(() => {});
              });
          };

          const handleTransitionEnd = () => {
            homeLogger.info('[Transition] ended, advancing to target section', {
              to: targetSection,
            });

            // Clean up video event listeners
            transitionEl.onended = null;
            transitionEl.removeEventListener('canplay', handleCanPlay);

            // Prepare target video playback
            videoPlaybackManager.play(targetVideoRef).catch(() => {});

            // Use requestAnimationFrame to batch state updates
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                actions.setCurrentSection(targetSection);
                actions.setIsTransitioning(false);
                refs.isTransitioningRef.current = false;

                // Show UI when entering hero or aboutStart
                if (targetSection === 'hero') {
                  actions.setHeroVisible(true);
                }
                if (targetSection === 'aboutStart') {
                  actions.setAboutStartVisible(true);
                }
              });
            });
          };

          transitionEl.onended = handleTransitionEnd;

          // If transition video is already ready, play immediately
          if (transitionEl.readyState >= 3) {
            handleCanPlay();
          } else {
            // Wait for canplay event to start playback
            transitionEl.addEventListener('canplay', handleCanPlay, { once: true });
          }
        } catch (err) {
          homeLogger.error('Transition error:', err);
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
      handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, videoRefs.aboutStartVideoRef, true);
    },
    [handleTransition, videoRefs.aboutStartVideoRef]
  );

  const transitionToAbout = useCallback(
    (viaScroll: boolean = false) => {
      handleTransition('about', VIDEO_PATHS.aboutStartToAbout, videoRefs.aboutVideoRef);
    },
    [handleTransition, videoRefs.aboutVideoRef]
  );

  const transitionBackToHeroFromAboutStart = useCallback(
    (viaScroll: boolean = false) => {
      refs.previousSectionRef.current = 'hero';
      handleTransition('hero', VIDEO_PATHS.aboutStartToHero, videoRefs.heroVideoRef);
    },
    [handleTransition, videoRefs.heroVideoRef, refs]
  );

  const transitionBackFromContact = useCallback(() => {
    if (state.currentSection !== 'contact') return;

    actions.setLeavingContact(true);
    actions.setContactVisible(false);

    const contactEl = videoRefs.contactVideoRef.current;
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

    refs.previousSectionRef.current = 'hero';
    handleTransition('hero', VIDEO_PATHS.contactToHero, videoRefs.heroVideoRef);
  }, [state.currentSection, actions, videoRefs.contactVideoRef, videoRefs.heroVideoRef, handleTransition, refs]);

  const handleScrollDown = useCallback(() => {
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
        transitionBackFromContact();
        break;
    }
  }, [state.currentSection, transitions, transitionToAboutStart, transitionToAbout, transitionBackFromContact, refs]);

  const handleScrollUp = useCallback(() => {
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
        if (refs.previousSectionRef.current === 'hero') {
          transitions.toHero();
        } else {
          refs.previousSectionRef.current = 'partner';
          transitions.toPartnerFromCases();
        }
        break;
      case 'contact':
        transitionBackFromContact();
        break;
    }
  }, [state.currentSection, transitions, transitionBackToHeroFromAboutStart, transitionBackFromContact, refs]);

  const handleBackClick = useCallback(() => {
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
        transitionBackFromContact();
        break;
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
