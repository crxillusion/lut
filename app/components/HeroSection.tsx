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
  onShowreelClick: () => void;
  onAboutClick: () => void;
  onCasesClick: () => void;
  onContactClick: () => void;
}

export function HeroSection({ 
  videoRef, 
  videoSrc, 
  isVisible, 
  currentSection,
  onShowreelClick,
  onAboutClick,
  onCasesClick,
  onContactClick
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
      <div className="relative z-10 h-full">
        {/* Navigation - 390px from top */}
        <div className="absolute top-[390px] left-0 right-0">
          <div className="flex flex-col items-center">
            <Navigation 
              currentSection={currentSection}
              onShowreelClick={onShowreelClick}
              onAboutClick={onAboutClick}
              onCasesClick={onCasesClick}
              onContactClick={onContactClick}
            />
            {/* Scroll Indicator - Right below navigation */}
            <div className="mt-4 text-white text-xs tracking-wider">
              *scroll to discover
            </div>
          </div>
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
