import { RefObject } from 'react';
import { Navigation } from './Navigation';
import { VideoBackground } from './VideoBackground';
import type { Section } from '../constants/config';

interface AboutSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  currentSection: Section;
  onHeroClick: () => void;
}

export function AboutSection({ 
  videoRef, 
  videoSrc, 
  isVisible,
  currentSection,
  onHeroClick 
}: AboutSectionProps) {
  return (
    <section 
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground 
        videoRef={videoRef}
        src={videoSrc}
        loop
      />

      {/* Content Overlay */}
      <div className="relative z-10 h-full">
        {/* Navigation - 390px from top */}
        <div className="absolute top-[390px] left-0 right-0 flex justify-center">
          <Navigation 
            currentSection={currentSection}
            onHeroClick={onHeroClick}
          />
        </div>

        {/* About Content - Below Navigation */}
        <div className="absolute inset-0 flex items-center justify-center pt-32">
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
  );
}
