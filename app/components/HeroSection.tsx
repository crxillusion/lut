import { RefObject } from 'react';
import { Navigation } from './Navigation';
import { SocialLinks } from './SocialLinks';
import { VideoBackground } from './VideoBackground';
import type { Section } from '../constants/config';

interface HeroSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  currentSection: Section;
  onAboutClick: () => void;
}

export function HeroSection({ 
  videoRef, 
  videoSrc, 
  isVisible, 
  currentSection,
  onAboutClick 
}: HeroSectionProps) {
  return (
    <section 
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground 
        videoRef={videoRef}
        src={videoSrc}
        autoPlay
        loop
      />

      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col h-full">
        <Navigation 
          currentSection={currentSection}
          onAboutClick={onAboutClick}
        />

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs tracking-wider">
          Scroll down ↓
        </div>

        <SocialLinks />

        {/* Copyright */}
        <div className="absolute bottom-8 left-8 text-white text-xs">
          Copyright © 2026. LUT Studios. All rights reserved.
        </div>
      </div>
    </section>
  );
}
