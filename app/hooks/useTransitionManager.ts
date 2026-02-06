// Consolidated hook for managing video transitions with loop support
import { useCallback, RefObject } from 'react';
import { Section } from '../constants/config';
import { speedUpVideoLoop } from '../utils/videoLoop';
import { transitionLogger } from '../utils/logger';

interface UseTransitionManagerProps {
  currentSection: Section;
  transitionVideoRef: RefObject<HTMLVideoElement | null>;
  isTransitioningRef: RefObject<boolean>;
  previousSectionRef: RefObject<Section>;
  
  // State setters
  setIsTransitioning: (value: boolean) => void;
  setTransitionVideoSrc: (src: string) => void;
  setCurrentSection: (section: Section) => void;
  setHeroVisible: (value: boolean) => void;
  setAboutStartVisible: (value: boolean) => void;
  setContactVisible: (value: boolean) => void;
  setLeavingContact: (value: boolean) => void;
  setWaitingForHeroLoop: (value: boolean) => void;
  setWaitingForAboutStartLoop: (value: boolean) => void;
  setWaitingForContactLoop: (value: boolean) => void;
  setPendingTransition: (transition: {
    section: Section;
    video: string;
    ref: RefObject<HTMLVideoElement | null>;
  } | null) => void;
}

export function useTransitionManager(props: UseTransitionManagerProps) {
  const {
    currentSection,
    transitionVideoRef,
    isTransitioningRef,
    previousSectionRef,
    setIsTransitioning,
    setTransitionVideoSrc,
    setCurrentSection,
    setHeroVisible,
    setAboutStartVisible,
    setContactVisible,
    setLeavingContact,
    setWaitingForHeroLoop,
    setWaitingForAboutStartLoop,
    setWaitingForContactLoop,
    setPendingTransition,
  } = props;

  /**
   * Core transition handler
   */
  const handleTransition = useCallback((
    targetSection: Section,
    transitionVideo: string,
    targetVideoRef: RefObject<HTMLVideoElement | null>,
    isDirectNavigation: boolean = false
  ) => {
    if (isTransitioningRef.current) {
      transitionLogger.warn('Transition already in progress, ignoring');
      return;
    }

    const requestAt = performance.now();
    transitionLogger.transition(currentSection, targetSection, isDirectNavigation ? 'click' : 'scroll');

    // Store previous section before transitioning (only for direct navigation from hero)
    if (isDirectNavigation && currentSection === 'hero') {
      previousSectionRef.current = 'hero';
    }

    isTransitioningRef.current = true;

    // Show transition overlay immediately so UI responds to click right away.
    setIsTransitioning(true);
    setTransitionVideoSrc(transitionVideo);

    // Prepare target video
    if (targetVideoRef.current) {
      const targetVideo = targetVideoRef.current;
      targetVideo.currentTime = 0;
      if (targetVideo.readyState < 2) {
        targetVideo.load();
      }
    }

    // Small delay to ensure the src swap has committed before we call play/load.
    setTimeout(() => {
      try {
        if (!transitionVideoRef.current) {
          transitionLogger.error('transitionVideoRef.current is null!');
          // Fail open.
          setCurrentSection(targetSection);
          setIsTransitioning(false);
          isTransitioningRef.current = false;
          return;
        }

        const video = transitionVideoRef.current;

        // Hint to browser this is an important load.
        video.preload = 'auto';

        video.currentTime = 0;

        if (video.readyState < 2) {
          video.load();
        }

        let didAdvance = false;
        const ADVANCE_TIMEOUT_MS = 900;
        let advanceTimer: number | undefined;

        const advanceToTarget = (reason: string) => {
          if (didAdvance) return;
          didAdvance = true;

          if (advanceTimer !== undefined) {
            window.clearTimeout(advanceTimer);
            advanceTimer = undefined;
          }

          transitionLogger.warn(
            `Advancing transition without waiting (reason=${reason}, readyState=${video.readyState})`
          );

          // Ensure we end up in the target section even if the transition video wasn't ready.
          setCurrentSection(targetSection);
          setIsTransitioning(false);
          isTransitioningRef.current = false;

          targetVideoRef.current?.play().catch(() => {});
        };

        const cleanup = () => {
          video.onended = null;
          video.onplaying = null;
          video.onwaiting = null;
          video.onstalled = null;
        };

        const canPlayAt = () => Math.round(performance.now() - requestAt);

        // If canplay is slow on GH Pages, we still want instant UI.
        // Try to start playback immediately; if it fails, fall back.
        const tryStart = (reason: string) => {
          transitionLogger.debug(
            `Transition tryStart (${reason}): readyState=${video.readyState} dt=${canPlayAt()}ms src=${transitionVideo.split('/').pop()}`
          );

          video.play().then(() => {
            transitionLogger.debug(
              `Transition video playing dt=${canPlayAt()}ms`
            );
            // If we see playback begin, cancel fallback advance timer.
            if (advanceTimer !== undefined) {
              window.clearTimeout(advanceTimer);
              advanceTimer = undefined;
            }
          }).catch(err => {
            transitionLogger.warn('Transition video play error:', err?.name ?? err);
            advanceToTarget('play_error');
          });
        };

        // If transition video ends normally, move to target section.
        video.onended = () => {
          cleanup();

          // Play target video first
          if (targetVideoRef.current) {
            targetVideoRef.current.currentTime = 0;
            targetVideoRef.current.play().catch(() => {});
          }

          // Update section
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setCurrentSection(targetSection);
              setIsTransitioning(false);
              isTransitioningRef.current = false;

              // Restore visibility for specific sections
              if (targetSection === 'hero') {
                setHeroVisible(true);
              }
              if (targetSection === 'aboutStart') {
                setAboutStartVisible(true);
              }

              transitionLogger.info(`✅ Transition complete: ${targetSection}`);
            });
          });
        };

        // Additional logging hooks for diagnosing buffering stalls.
        video.onwaiting = () => {
          transitionLogger.debug(`Transition video waiting dt=${canPlayAt()}ms readyState=${video.readyState}`);
        };
        video.onstalled = () => {
          transitionLogger.debug(`Transition video stalled dt=${canPlayAt()}ms readyState=${video.readyState}`);
        };
        video.onplaying = () => {
          transitionLogger.debug(`Transition video onplaying dt=${canPlayAt()}ms readyState=${video.readyState}`);
        };

        // Start ASAP (even if not canplay yet). This usually renders faster than waiting for canplay.
        tryStart(video.readyState >= 2 ? 'ready' : 'not_ready');

        // But also attempt again on canplay to recover if the first play() was blocked.
        const onCanPlay = () => {
          transitionLogger.debug(`Transition canplay dt=${canPlayAt()}ms readyState=${video.readyState}`);
          tryStart('canplay');
        };

        if (video.readyState >= 3) {
          // Already good enough.
          onCanPlay();
        } else {
          video.addEventListener('canplay', onCanPlay, { once: true });
        }

        // Fallback: if transition video still hasn't started after a short delay, advance anyway.
        advanceTimer = window.setTimeout(() => {
          if (didAdvance) return;
          // If the video has started playing, we should not force-advance.
          if (!video.paused && video.currentTime > 0) return;
          advanceToTarget('advance_timeout');
        }, ADVANCE_TIMEOUT_MS);
      } catch (err) {
        transitionLogger.error('Transition error:', err);
        setCurrentSection(targetSection);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }
    }, 50);
  }, [
    currentSection,
    transitionVideoRef,
    isTransitioningRef,
    previousSectionRef,
    setIsTransitioning,
    setTransitionVideoSrc,
    setCurrentSection,
    setHeroVisible,
    setAboutStartVisible,
  ]);

  /**
   * Handle transitions with loop speed-up
   */
  const handleTransitionWithLoop = useCallback((
    fromSection: 'hero' | 'aboutStart' | 'contact',
    videoRef: RefObject<HTMLVideoElement | null>,
    targetSection: Section,
    targetVideo: string,
    targetVideoRef: RefObject<HTMLVideoElement | null>
  ) => {
    transitionLogger.info(`Starting loop speed-up for ${fromSection}`);

    // Set waiting flag
    const setWaiting = fromSection === 'hero' ? setWaitingForHeroLoop :
                       fromSection === 'aboutStart' ? setWaitingForAboutStartLoop :
                       setWaitingForContactLoop;

    const setVisible = fromSection === 'hero' ? setHeroVisible :
                       fromSection === 'aboutStart' ? setAboutStartVisible :
                       setContactVisible;

    setWaiting(true);
    setVisible(false);

    // Speed up loop
    return speedUpVideoLoop({
      videoRef,
      speedMultiplier: fromSection === 'contact' ? 5.0 : 5.0,
      onProgress: (current, duration) => {
        transitionLogger.loopProgress(current, duration, 5.0);
      },
      onLoopComplete: () => {
        transitionLogger.loopComplete(fromSection);
        setWaiting(false);
        setPendingTransition({
          section: targetSection,
          video: targetVideo,
          ref: targetVideoRef,
        });
      },
    });
  }, [
    setWaitingForHeroLoop,
    setWaitingForAboutStartLoop,
    setWaitingForContactLoop,
    setHeroVisible,
    setAboutStartVisible,
    setContactVisible,
    setPendingTransition,
  ]);

  /**
   * Handle contact back transition with fade-out
   */
  const handleContactBackTransition = useCallback((
    targetSection: Section,
    targetVideo: string,
    targetVideoRef: RefObject<HTMLVideoElement | null>,
    viaScroll: boolean
  ) => {
    transitionLogger.info(`Contact back transition to ${targetSection} (${viaScroll ? 'scroll' : 'click'})`);

    if (viaScroll) {
      // Use loop speed-up logic
      return handleTransitionWithLoop(
        'contact',
        targetVideoRef,
        targetSection,
        targetVideo,
        targetVideoRef
      );
    } else {
      // Direct navigation - fade out first
      setLeavingContact(true);
      setContactVisible(false);

      setTimeout(() => {
        handleTransition(targetSection, targetVideo, targetVideoRef, false);
      }, 400); // Match fade-out duration
    }
  }, [handleTransitionWithLoop, setLeavingContact, setContactVisible, handleTransition]);

  return {
    handleTransition,
    handleTransitionWithLoop,
    handleContactBackTransition,
  };
}
