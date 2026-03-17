'use client';

import { motion } from 'framer-motion';
import type { Section } from '../constants/config';

interface ScreenIndicatorProps {
  currentSection: Section;
}

const SECTIONS_ORDER: Section[] = [
  'hero',
  'showreel',
  'aboutStart',
  'about',
  'team1',
  'team2',
  'offer',
  'partner',
  'cases',
  'contact',
];

export function ScreenIndicator({ currentSection }: ScreenIndicatorProps) {
  return (
    <>
      {/* Desktop: Right side vertical dots */}
      <motion.div
        className="hidden md:flex fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {SECTIONS_ORDER.map((section, index) => {
          const isActive = section === currentSection;
          
          return (
            <motion.div
              key={`desktop-${section}`}
              className="rounded-full transition-all"
              style={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                backgroundColor: isActive ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
              }}
              animate={{
                scale: isActive ? 1 : 0.8,
              }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </motion.div>

      {/* Mobile: Bottom center horizontal dots */}
      <motion.div
        className="md:hidden fixed left-1/2 -translate-x-1/2 bottom-30 z-40 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {SECTIONS_ORDER.map((section, index) => {
          const isActive = section === currentSection;
          
          return (
            <motion.div
              key={`mobile-${section}`}
              className="rounded-full transition-all"
              style={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                backgroundColor: isActive ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
              }}
              animate={{
                scale: isActive ? 1 : 0.8,
              }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </motion.div>
    </>
  );
}
