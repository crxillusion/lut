'use client';

import { useRef, useState, useCallback } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { TransitionVideo } from './components/TransitionVideo';
import { useVideoPreloader } from './hooks/useVideoPreloader';
import { useScrollTransition } from './hooks/useScrollTransition';
import { VIDEO_PATHS } from './constants/config';
import type { Section, TransitionDirection } from './constants/config';

export default function Home() {
  // State management
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('forward');

  // Video refs
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const aboutLoopVideoRef = useRef<HTMLVideoElement>(null);

  // Preload videos
  const { isLoading, loadingProgress } = useVideoPreloader([
    VIDEO_PATHS.heroLoop,
    VIDEO_PATHS.heroToAbout,
    VIDEO_PATHS.aboutToHero,
    VIDEO_PATHS.aboutLoop,
  ]);

  // Transition handlers
  const transitionToAbout = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTransitionDirection('forward');
    
    setTimeout(() => {
      if (transitionVideoRef.current) {
        transitionVideoRef.current.currentTime = 0;
        
        transitionVideoRef.current.onended = () => {
          setCurrentSection('about');
          setIsTransitioning(false);
          
          if (aboutLoopVideoRef.current) {
            aboutLoopVideoRef.current.currentTime = 0;
            aboutLoopVideoRef.current.play().catch(err => console.log('About video play error:', err));
          }
        };
        
        transitionVideoRef.current.play().catch(err => {
          console.log('Transition video play error:', err);
          setCurrentSection('about');
          setIsTransitioning(false);
          if (aboutLoopVideoRef.current) {
            aboutLoopVideoRef.current.play();
          }
        });
      }
    }, 50);
  }, [isTransitioning]);

  const transitionToHero = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTransitionDirection('reverse');
    
    setTimeout(() => {
      if (transitionVideoRef.current) {
        transitionVideoRef.current.currentTime = 0;
        
        transitionVideoRef.current.onended = () => {
          setCurrentSection('hero');
          setIsTransitioning(false);
          
          if (heroVideoRef.current) {
            heroVideoRef.current.currentTime = 0;
            heroVideoRef.current.play().catch(err => console.log('Hero video play error:', err));
          }
        };
        
        transitionVideoRef.current.play().catch(err => {
          console.log('Transition video play error:', err);
          setCurrentSection('hero');
          setIsTransitioning(false);
          if (heroVideoRef.current) {
            heroVideoRef.current.play();
          }
        });
      }
    }, 50);
  }, [isTransitioning]);

  // Scroll handling
  useScrollTransition({
    currentSection,
    isTransitioning,
    onScrollDown: transitionToAbout,
    onScrollUp: transitionToHero,
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
          onAboutClick={transitionToAbout}
        />

        {/* Transition Video */}
        <TransitionVideo
          videoRef={transitionVideoRef}
          forwardSrc={VIDEO_PATHS.heroToAbout}
          reverseSrc={VIDEO_PATHS.aboutToHero}
          direction={transitionDirection}
          isVisible={isTransitioning}
        />

        {/* About Section */}
        <AboutSection
          videoRef={aboutLoopVideoRef}
          videoSrc={VIDEO_PATHS.aboutLoop}
          isVisible={currentSection === 'about'}
          currentSection={currentSection}
          onHeroClick={transitionToHero}
        />
      </main>
    </>
  );
}
