'use client';

import { RefObject, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from './Navigation';
import { VideoBackground } from './VideoBackground';
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
              isVisible={showUI}
            />
            {/* Scroll Indicator - Right below navigation */}
            <motion.div 
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
          className="absolute bottom-8 left-8 text-white text-xs"
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
