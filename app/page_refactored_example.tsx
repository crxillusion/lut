// Refactored page.tsx - EXAMPLE/REFERENCE
// This shows how the new architecture simplifies the main component
// DO NOT replace the current page.tsx yet - this is for reference

'use client';

import { useCallback, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { OpeningTransition } from './components/OpeningTransition';
import { HeroSection } from './components/HeroSection';
import { ContactSection } from './components/ContactSection';
import { TransitionVideo } from './components/TransitionVideo';
import { SocialLinks } from './components/SocialLinks';
import { useVideoPreloader } from './hooks/useVideoPreloader';
import { useScrollTransition } from './hooks/useScrollTransition';
import { useSectionState } from './hooks/useSectionState';
import { useVideoRefs } from './hooks/useVideoRefs';
import { useTransitionManager } from './hooks/useTransitionManager';
import { VIDEO_PATHS, type Section } from './constants/config';
import { getNavigationAction } from './utils/navigationConfig';
import { homeLogger } from './utils/logger';

export default function Home() {
  // Consolidated state management
  const { state, actions, refs: stateRefs } = useSectionState();
  
  // Video refs
  const videoRefs = useVideoRefs();
  
  // Transition manager
  const { handleTransition, handleTransitionWithLoop, handleContactBackTransition } = useTransitionManager({
    currentSection: state.current,
    transitionVideoRef: videoRefs.transition,
    isTransitioningRef: stateRefs.isTransitioning,
    previousSectionRef: stateRefs.previousSection,
    ...actions,
  });

  // Preload videos
  const { isLoading, loadingProgress } = useVideoPreloader([
    VIDEO_PATHS.opening,
    VIDEO_PATHS.heroLoop,
    // ... all other video paths
  ]);

  // Opening sequence
  useEffect(() => {
    if (loadingProgress === 100 && !state.showOpening && !state.showHero) {
      homeLogger.info('Loading complete, starting opening transition');
      actions.setShowOpening(true);
      setTimeout(() => actions.setLoadingScreenVisible(false), 100);
    }
  }, [loadingProgress, state.showOpening, state.showHero, actions]);

  const handleOpeningComplete = useCallback(() => {
    homeLogger.info('Opening transition complete');
    actions.setShowOpening(false);
    actions.setShowHero(true);
    actions.setHeroVisible(true);
    actions.setAboutStartVisible(true);
  }, [actions]);

  // Pending transition handler
  useEffect(() => {
    if (state.pendingTransition && 
        !state.waitingForHeroLoop && 
        !state.waitingForAboutStartLoop && 
        !state.waitingForContactLoop) {
      homeLogger.info('Executing pending transition to:', state.pendingTransition.section);
      handleTransition(
        state.pendingTransition.section,
        state.pendingTransition.video,
        state.pendingTransition.ref,
        false
      );
      actions.setPendingTransition(null);
    }
  }, [state.pendingTransition, state.waitingForHeroLoop, state.waitingForAboutStartLoop, state.waitingForContactLoop, handleTransition, actions]);

  // Contact visibility management
  useEffect(() => {
    if (state.current === 'contact' && state.showHero && !state.waitingForContactLoop && !state.contactVisible && !state.leavingContact) {
      const timer = setTimeout(() => {
        homeLogger.info('Showing contact UI');
        actions.setContactVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (state.current === 'contact' && state.showHero && !state.waitingForContactLoop && !state.contactVisible && state.leavingContact) {
      homeLogger.info('Resetting leavingContact flag');
      actions.setLeavingContact(false);
    } else if (state.current !== 'contact' && state.contactVisible) {
      homeLogger.info('Leaving contact, resetting visibility');
      actions.setContactVisible(false);
      actions.setLeavingContact(false);
    } else if (state.current !== 'contact' && state.leavingContact) {
      homeLogger.info('Resetting leavingContact flag after section change');
      actions.setLeavingContact(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.current, state.showHero, state.contactVisible, state.waitingForContactLoop, state.leavingContact, actions]);

  // Helper to get target video ref
  const getTargetVideoRef = useCallback((section: Section) => {
    const refMap = {
      hero: videoRefs.hero,
      showreel: videoRefs.showreel,
      aboutStart: videoRefs.aboutStart,
      about: videoRefs.about,
      team1: videoRefs.team1,
      team2: videoRefs.team2,
      offer: videoRefs.offer,
      partner: videoRefs.partner,
      cases: videoRefs.cases,
      contact: videoRefs.contact,
    };
    return refMap[section];
  }, [videoRefs]);

  // Navigation handlers using config
  const handleScrollDown = useCallback(() => {
    const action = getNavigationAction(state.current, 'forward');
    if (!action) return;

    homeLogger.info('Scroll down:', state.current, '→', action.targetSection);

    if (action.requiresLoop) {
      // Use loop-based transition
      const videoRef = state.current === 'hero' ? videoRefs.hero :
                       state.current === 'aboutStart' ? videoRefs.aboutStart :
                       videoRefs.contact;
      
      const targetRef = action.targetSection === 'aboutStart' ? videoRefs.aboutStart :
                       action.targetSection === 'about' ? videoRefs.about :
                       action.targetSection === 'contact' ? videoRefs.contact :
                       videoRefs.hero;

      handleTransitionWithLoop(
        state.current as 'hero' | 'aboutStart' | 'contact',
        videoRef,
        action.targetSection,
        action.videoPath,
        targetRef
      );
    } else {
      // Direct transition
      const targetRef = getTargetVideoRef(action.targetSection);
      handleTransition(action.targetSection, action.videoPath, targetRef, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state.current is intentionally not a dependency
  }, [videoRefs, handleTransition, handleTransitionWithLoop, getTargetVideoRef]);

  const handleScrollUp = useCallback(() => {
    const action = getNavigationAction(state.current, 'back');
    if (!action) return;

    homeLogger.info('Scroll up:', state.current, '→', action.targetSection);

    if (state.current === 'contact') {
      // Special handling for contact back
      const targetSection = stateRefs.previousSection.current === 'cases' ? 'cases' : 'hero';
      const targetVideo = targetSection === 'cases' ? VIDEO_PATHS.contactToCases : VIDEO_PATHS.contactToHero;
      const targetRef = targetSection === 'cases' ? videoRefs.cases : videoRefs.hero;
      
      handleContactBackTransition(targetSection, targetVideo, targetRef, true);
    } else if (action.requiresLoop) {
      // Loop-based back transition
      const videoRef = state.current === 'aboutStart' ? videoRefs.aboutStart : videoRefs.hero;
      const targetRef = action.targetSection === 'hero' ? videoRefs.hero : videoRefs.aboutStart;
      
      handleTransitionWithLoop(
        state.current as 'hero' | 'aboutStart',
        videoRef,
        action.targetSection,
        action.videoPath,
        targetRef
      );
    } else {
      // Direct back transition
      const targetRef = getTargetVideoRef(action.targetSection);
      handleTransition(action.targetSection, action.videoPath, targetRef, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state.current is intentionally not a dependency
  }, [stateRefs.previousSection, videoRefs, handleTransition, handleTransitionWithLoop, handleContactBackTransition, getTargetVideoRef]);

  // Scroll hook
  useScrollTransition({
    currentSection: state.current,
    isTransitioning: state.isTransitioning,
    isWaiting: state.waitingForHeroLoop || state.waitingForAboutStartLoop || state.waitingForContactLoop,
    onScrollDown: handleScrollDown,
    onScrollUp: handleScrollUp,
  });

  return (
    <>
      {isLoading && <LoadingScreen progress={loadingProgress} isVisible={state.loadingScreenVisible} />}
      <OpeningTransition isPlaying={state.showOpening} onComplete={handleOpeningComplete} />

      <main className="fixed inset-0 w-full h-screen overflow-hidden">
        <HeroSection
          videoRef={videoRefs.hero}
          videoSrc={VIDEO_PATHS.heroLoop}
          isVisible={state.current === 'hero' && (state.showHero || state.showOpening)}
          showUI={state.heroVisible}
          currentSection={state.current}
          onShowreelClick={() => {/* ... */}}
          onAboutClick={() => {/* ... */}}
          onCasesClick={() => {/* ... */}}
          onContactClick={() => {/* ... */}}
        />

        <TransitionVideo
          videoRef={videoRefs.transition}
          forwardSrc={state.transitionVideoSrc}
          reverseSrc={state.transitionVideoSrc}
          direction="forward"
          isVisible={state.isTransitioning}
        />

        {/* All other sections... */}

        <ContactSection
          videoRef={videoRefs.contact}
          videoSrc={VIDEO_PATHS.contactLoop}
          isVisible={state.current === 'contact' && state.showHero}
          isTransitioning={state.isTransitioning}
          showUI={state.contactVisible}
        />
      </main>

      {state.showHero && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <SocialLinks 
              showBackButton={state.current !== 'hero'}
              onBackClick={() => handleScrollUp()}
              isVisible={state.showHero}
              animateOnce={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
