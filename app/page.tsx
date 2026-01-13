'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
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
  const isTransitioningRef = useRef(false);

  // Video refs
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const aboutLoopVideoRef = useRef<HTMLVideoElement>(null);

  // Preload videos (simplified - no actual preloading to prevent memory issues)
  const { isLoading, loadingProgress } = useVideoPreloader([
    VIDEO_PATHS.heroLoop,
    VIDEO_PATHS.heroToAbout,
    VIDEO_PATHS.aboutToHero,
    VIDEO_PATHS.aboutLoop,
  ]);

  // Cleanup videos on unmount
  useEffect(() => {
    return () => {
      [heroVideoRef, transitionVideoRef, aboutLoopVideoRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = '';
          ref.current.load();
        }
      });
    };
  }, []);

  // Transition handlers
  const transitionToAbout = useCallback(() => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setTransitionDirection('forward');
    
    setTimeout(() => {
      try {
        if (transitionVideoRef.current) {
          const video = transitionVideoRef.current;
          video.currentTime = 0;
          
          // Load the video to ensure it's ready
          video.load();
          
          const handleCanPlay = () => {
            video.play().catch(err => {
              console.warn('Transition video play error:', err.name);
              // If play fails, skip to about section immediately
              setCurrentSection('about');
              setIsTransitioning(false);
              isTransitioningRef.current = false;
              if (aboutLoopVideoRef.current) {
                aboutLoopVideoRef.current.play().catch(() => {});
              }
            });
          };
          
          video.onended = () => {
            setCurrentSection('about');
            setIsTransitioning(false);
            isTransitioningRef.current = false;
            
            if (aboutLoopVideoRef.current) {
              aboutLoopVideoRef.current.currentTime = 0;
              aboutLoopVideoRef.current.play().catch(() => {});
            }
          };
          
          // Wait for video to be ready to play
          if (video.readyState >= 3) {
            handleCanPlay();
          } else {
            video.addEventListener('canplay', handleCanPlay, { once: true });
          }
        }
      } catch (err) {
        console.error('Transition error:', err);
        setCurrentSection('about');
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }
    }, 50);
  }, []);

  const transitionToHero = useCallback(() => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setTransitionDirection('reverse');
    
    setTimeout(() => {
      try {
        if (transitionVideoRef.current) {
          const video = transitionVideoRef.current;
          video.currentTime = 0;
          
          // Load the video to ensure it's ready
          video.load();
          
          const handleCanPlay = () => {
            video.play().catch(err => {
              console.warn('Transition video play error:', err.name);
              // If play fails, skip to hero section immediately
              setCurrentSection('hero');
              setIsTransitioning(false);
              isTransitioningRef.current = false;
              if (heroVideoRef.current) {
                heroVideoRef.current.play().catch(() => {});
              }
            });
          };
          
          video.onended = () => {
            setCurrentSection('hero');
            setIsTransitioning(false);
            isTransitioningRef.current = false;
            
            if (heroVideoRef.current) {
              heroVideoRef.current.currentTime = 0;
              heroVideoRef.current.play().catch(() => {});
            }
          };
          
          // Wait for video to be ready to play
          if (video.readyState >= 3) {
            handleCanPlay();
          } else {
            video.addEventListener('canplay', handleCanPlay, { once: true });
          }
        }
      } catch (err) {
        console.error('Transition error:', err);
        setCurrentSection('hero');
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }
    }, 50);
  }, []);

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
