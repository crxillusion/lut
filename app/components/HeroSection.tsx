'use client';

import { RefObject } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from './Navigation';
import { VideoBackground } from './VideoBackground';
import { useManagedVideoPlayback } from '../hooks/useManagedVideoPlayback';
import type { Section } from '../constants/config';

interface HeroSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  showUI: boolean; // Controls UI elements animation separately
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
  showUI,
  currentSection,
  onShowreelClick,
  onAboutClick,
  onCasesClick,
  onContactClick,
}: HeroSectionProps) {
  useManagedVideoPlayback(videoRef, {
    enabled: isVisible,
    name: 'Hero',
    minReadyState: 2,
    preloadFirstFrame: true,
  });

  // Keyed remount so framer-motion initial->animate runs reliably when showUI flips true.
  const uiKey = showUI ? 'hero-ui-visible' : 'hero-ui-hidden';

  return (
    <section
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground videoRef={videoRef} src={videoSrc} autoPlay loop />

      {/* Overlay Content */}
      <div className="relative z-10 h-full" key={uiKey}>
        {/* Navigation - center on mobile, keep original absolute pos on desktop */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 sm:top-[390px] sm:translate-y-0">
          <div className="flex flex-col items-center">
            <Navigation
              currentSection={currentSection}
              onShowreelClick={onShowreelClick}
              onAboutClick={onAboutClick}
              onCasesClick={onCasesClick}
              onContactClick={onContactClick}
              isVisible={showUI}
            />

            {/* Scroll Indicator - Right below navigation */}
            <motion.div
              key={`scroll-indicator-${uiKey}`}
              className="mt-4 text-white text-xs tracking-wider"
              initial={{
                filter: 'blur(10px)',
                opacity: 0,
                y: 20,
              }}
              animate={{
                filter: showUI ? 'blur(0px)' : 'blur(10px)',
                opacity: showUI ? 1 : 0,
                y: showUI ? 0 : 20,
              }}
              transition={{
                duration: showUI ? 0.6 : 0.4,
                delay: showUI ? 0.7 : 0,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              *scroll to discover
            </motion.div>
          </div>
        </div>

        {/* Copyright */}
        <motion.div
          key={`copyright-${uiKey}`}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center sm:left-8 sm:translate-x-0 sm:text-left text-white text-xs w-[calc(100%-2rem)] sm:w-auto px-4 sm:px-0"
          initial={{
            filter: 'blur(10px)',
            opacity: 0,
            y: 20,
          }}
          animate={{
            filter: showUI ? 'blur(0px)' : 'blur(10px)',
            opacity: showUI ? 1 : 0,
            y: showUI ? 0 : 20,
          }}
          transition={{
            duration: showUI ? 0.6 : 0.4,
            delay: showUI ? 1.0 : 0,
            ease: [0.23, 1, 0.32, 1],
          }}
        >
          Copyright © 2026. LUT Studios. All rights reserved.
        </motion.div>
      </div>
    </section>
  );
}
