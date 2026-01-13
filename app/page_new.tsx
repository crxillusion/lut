'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { HeroSection } from './components/HeroSection';
import { AboutStartSection } from './components/AboutStartSection';
import { StaticSection } from './components/StaticSection';
import { ContactSection } from './components/ContactSection';
import { TransitionVideo } from './components/TransitionVideo';
import { useVideoPreloader } from './hooks/useVideoPreloader';
import { useScrollTransition } from './hooks/useScrollTransition';
import { VIDEO_PATHS } from './constants/config';
import type { Section, TransitionDirection } from './constants/config';

export default function Home() {
  // State management
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoSrc, setTransitionVideoSrc] = useState('');
  const isTransitioningRef = useRef(false);

  // Video refs for each section
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const showreelVideoRef = useRef<HTMLVideoElement>(null);
  const aboutStartVideoRef = useRef<HTMLVideoElement>(null);
  const aboutVideoRef = useRef<HTMLVideoElement>(null);
  const teamVideoRef = useRef<HTMLVideoElement>(null);
  const offerVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const casesVideoRef = useRef<HTMLVideoElement>(null);
  const contactVideoRef = useRef<HTMLVideoElement>(null);

  // Preload essential videos
  const { isLoading, loadingProgress } = useVideoPreloader([
    VIDEO_PATHS.heroLoop,
    VIDEO_PATHS.heroToShowreel,
    VIDEO_PATHS.heroToAboutStart,
    VIDEO_PATHS.heroToCases,
    VIDEO_PATHS.heroToContact,
    VIDEO_PATHS.aboutStartLoop,
    VIDEO_PATHS.contactLoop,
  ]);

  // Cleanup videos on unmount
  useEffect(() => {
    return () => {
      const refs = [
        heroVideoRef, transitionVideoRef, showreelVideoRef, aboutStartVideoRef,
        aboutVideoRef, teamVideoRef, offerVideoRef, partnerVideoRef, casesVideoRef, contactVideoRef
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
    targetVideoRef: React.RefObject<HTMLVideoElement>
  ) => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setTransitionVideoSrc(transitionVideo);
    
    setTimeout(() => {
      try {
        if (transitionVideoRef.current) {
          const video = transitionVideoRef.current;
          video.currentTime = 0;
          video.load();
          
          const handleCanPlay = () => {
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
            setCurrentSection(targetSection);
            setIsTransitioning(false);
            isTransitioningRef.current = false;
            
            if (targetVideoRef.current) {
              targetVideoRef.current.currentTime = 0;
              targetVideoRef.current.play().catch(() => {});
            }
          };
          
          if (video.readyState >= 3) {
            handleCanPlay();
          } else {
            video.addEventListener('canplay', handleCanPlay, { once: true });
          }
        }
      } catch (err) {
        console.error('Transition error:', err);
        setCurrentSection(targetSection);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }
    }, 50);
  }, []);

  // Transition functions from Hero
  const transitionToShowreel = useCallback(() => {
    handleTransition('showreel', VIDEO_PATHS.heroToShowreel, showreelVideoRef);
  }, [handleTransition]);

  const transitionToAboutStart = useCallback(() => {
    handleTransition('aboutStart', VIDEO_PATHS.heroToAboutStart, aboutStartVideoRef);
  }, [handleTransition]);

  const transitionToCases = useCallback(() => {
    handleTransition('cases', VIDEO_PATHS.heroToCases, casesVideoRef);
  }, [handleTransition]);

  const transitionToContact = useCallback(() => {
    handleTransition('contact', VIDEO_PATHS.heroToContact, contactVideoRef);
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
    handleTransition('hero', reverseVideo, heroVideoRef);
  }, [currentSection, handleTransition]);

  // Scroll handling - only works on hero and aboutStart sections
  useScrollTransition({
    currentSection,
    isTransitioning,
    onScrollDown: currentSection === 'hero' ? transitionToAboutStart : undefined,
    onScrollUp: currentSection === 'aboutStart' ? transitionToHero : undefined,
  });

  return (
    <>
      {/* Loading Screen */}
      {isLoading && <LoadingScreen progress={loadingProgress} />}

      {/* Main Content */}
      <main className="fixed inset-0 w-full h-screen overflow-hidden">
        {/* Hero Section */}
        <HeroSection
          videoRef={heroVideoRef}
          videoSrc={VIDEO_PATHS.heroLoop}
          isVisible={currentSection === 'hero' && !isTransitioning}
          currentSection={currentSection}
          onShowreelClick={transitionToShowreel}
          onAboutClick={transitionToAboutStart}
          onCasesClick={transitionToCases}
          onContactClick={transitionToContact}
        />

        {/* Transition Video */}
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
          isVisible={currentSection === 'showreel'}
          onBackClick={transitionToHero}
        />

        {/* About Start Section */}
        <AboutStartSection
          videoRef={aboutStartVideoRef}
          videoSrc={VIDEO_PATHS.aboutStartLoop}
          isVisible={currentSection === 'aboutStart'}
          onHeroClick={transitionToHero}
        />

        {/* Cases Section */}
        <StaticSection
          videoRef={casesVideoRef}
          videoSrc={VIDEO_PATHS.heroToCases}
          isVisible={currentSection === 'cases'}
          title="Cases"
          content="Our portfolio of exceptional work."
          onBackClick={transitionToHero}
        />

        {/* Contact Section */}
        <ContactSection
          videoRef={contactVideoRef}
          videoSrc={VIDEO_PATHS.contactLoop}
          isVisible={currentSection === 'contact'}
        />
      </main>
    </>
  );
}
