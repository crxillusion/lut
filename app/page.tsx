'use client';

import { useEffect, useRef, useState } from 'react';
import { Instagram, Linkedin } from 'lucide-react';

type Section = 'hero' | 'about' | 'contact';

export default function Home() {
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'reverse'>('forward');
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const aboutLoopVideoRef = useRef<HTMLVideoElement>(null);
  const lastScrollTime = useRef<number>(0);
  const scrollCooldown = 1500; // Cooldown between transitions

  // Handle wheel/scroll events to trigger transitions
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isTransitioning) return;
      
      const now = Date.now();
      if (now - lastScrollTime.current < scrollCooldown) return;
      
      // Detect scroll direction
      if (e.deltaY > 0 && currentSection === 'hero') {
        // Scrolling down from hero
        lastScrollTime.current = now;
        transitionToAbout();
      } else if (e.deltaY < 0 && currentSection === 'about') {
        // Scrolling up from about
        lastScrollTime.current = now;
        transitionToHero();
      }
    };

    // Prevent default scrolling
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    // Prevent touch scrolling on mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (isTransitioning) {
        e.preventDefault();
      }
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [currentSection, isTransitioning]);

  const transitionToAbout = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTransitionDirection('forward');
    
    // Small delay to ensure the video element is mounted
    setTimeout(() => {
      if (transitionVideoRef.current) {
        transitionVideoRef.current.currentTime = 0;
        
        // Set up the ended handler before playing
        transitionVideoRef.current.onended = () => {
          setCurrentSection('about');
          setIsTransitioning(false);
          
          // Start about loop video
          if (aboutLoopVideoRef.current) {
            aboutLoopVideoRef.current.currentTime = 0;
            aboutLoopVideoRef.current.play().catch(err => console.log('About video play error:', err));
          }
        };
        
        // Play the transition video
        transitionVideoRef.current.play().catch(err => {
          console.log('Transition video play error:', err);
          // Fallback: skip to about section if video fails
          setCurrentSection('about');
          setIsTransitioning(false);
          if (aboutLoopVideoRef.current) {
            aboutLoopVideoRef.current.play();
          }
        });
      }
    }, 50);
  };

  const transitionToHero = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTransitionDirection('reverse');
    
    // Small delay to ensure the video element is mounted
    setTimeout(() => {
      if (transitionVideoRef.current) {
        transitionVideoRef.current.currentTime = 0;
        
        // Set up the ended handler before playing
        transitionVideoRef.current.onended = () => {
          setCurrentSection('hero');
          setIsTransitioning(false);
          
          // Start hero video
          if (heroVideoRef.current) {
            heroVideoRef.current.currentTime = 0;
            heroVideoRef.current.play().catch(err => console.log('Hero video play error:', err));
          }
        };
        
        // Play the transition video
        transitionVideoRef.current.play().catch(err => {
          console.log('Transition video play error:', err);
          // Fallback: skip to hero section if video fails
          setCurrentSection('hero');
          setIsTransitioning(false);
          if (heroVideoRef.current) {
            heroVideoRef.current.play();
          }
        });
      }
    }, 50);
  };

  const handleAboutClick = () => {
    if (currentSection === 'hero') {
      transitionToAbout();
    }
  };

  return (
    <main className="fixed inset-0 w-full h-screen overflow-hidden">
      {/* Hero Section - Homepage Loop */}
      <section 
        className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
          currentSection === 'hero' && !isTransitioning ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
        }`}
      >
        <video
          ref={heroVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/Homepage_loop[0000-0150].mp4" type="video/mp4" />
        </video>

        {/* Navigation Overlay */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Top Navigation */}
          <nav className="flex justify-center items-center gap-12 pt-8 md:pt-12">
            <button className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity">
              SHOWREEL
            </button>
            <button 
              onClick={handleAboutClick}
              className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity"
            >
              ABOUT
            </button>
            <button className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity">
              CASES
            </button>
            <button className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity">
              CONTACT
            </button>
          </nav>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs tracking-wider">
            Scroll down ↓
          </div>

          {/* Bottom Social Icons */}
          <div className="absolute bottom-8 left-8 flex gap-4">
            <a href="#" className="text-white hover:opacity-70 transition-opacity">
              <Instagram size={24} />
            </a>
            <a href="#" className="text-white hover:opacity-70 transition-opacity">
              <Linkedin size={24} />
            </a>
          </div>

          {/* Copyright */}
          <div className="absolute bottom-8 left-8 text-white text-xs">
            Copyright © 2026. LUT Studios. All rights reserved.
          </div>
        </div>
      </section>

      {/* Transition Video */}
      {isTransitioning && (
        <section className="fixed inset-0 z-50 w-full h-screen overflow-hidden">
          <video
            ref={transitionVideoRef}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source 
              src={transitionDirection === 'forward' 
                ? "/videos/Homepage_aboutstart[0150-0180].mp4" 
                : "/videos/aboutstart_homepage_reverse[0180-0150].mp4"
              } 
              type="video/mp4" 
            />
          </video>
        </section>
      )}

      {/* About Section - About Loop */}
      <section 
        className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
          currentSection === 'about' ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
        }`}
      >
        <video
          ref={aboutLoopVideoRef}
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/aboutstart_loop[0000-0150].mp4" type="video/mp4" />
        </video>

        {/* About Content Overlay */}
        <div className="relative z-10 flex flex-col h-full p-8 md:p-16">
          {/* Navigation */}
          <nav className="flex justify-center items-center gap-12 mb-12">
            <button 
              onClick={() => setCurrentSection('hero')}
              className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity"
            >
              SHOWREEL
            </button>
            <button className="text-white text-sm md:text-base tracking-[0.3em] opacity-100 border-b-2 border-white">
              ABOUT
            </button>
            <button className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity">
              CASES
            </button>
            <button className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity">
              CONTACT
            </button>
          </nav>

          {/* About Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-4xl text-center text-white">
              <h1 className="text-5xl md:text-7xl font-bold mb-8">About Us</h1>
              <p className="text-lg md:text-xl leading-relaxed opacity-90">
                We are LUT Studios, crafting exceptional visual experiences
                through architecture, design, and storytelling.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
