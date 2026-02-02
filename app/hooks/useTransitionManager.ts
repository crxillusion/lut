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

    transitionLogger.transition(currentSection, targetSection, isDirectNavigation ? 'click' : 'scroll');

    // Store previous section before transitioning (only for direct navigation from hero)
    if (isDirectNavigation && currentSection === 'hero') {
      previousSectionRef.current = 'hero';
    }

    isTransitioningRef.current = true;
    setTransitionVideoSrc(transitionVideo);

    // Prepare target video
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
          transitionLogger.error('transitionVideoRef.current is null!');
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
            transitionLogger.warn('Transition video play error:', err.name);
            setCurrentSection(targetSection);
            setIsTransitioning(false);
            isTransitioningRef.current = false;
            targetVideoRef.current?.play().catch(() => {});
          });
        };

        video.onended = () => {
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

        if (video.readyState >= 3) {
          handleCanPlay();
        } else {
          video.addEventListener('canplay', handleCanPlay, { once: true });
        }
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
