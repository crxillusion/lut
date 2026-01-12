import { useEffect, useRef } from 'react';
import { SCROLL_COOLDOWN } from '../constants/config';
import type { Section } from '../constants/config';

interface UseScrollTransitionProps {
  currentSection: Section;
  isTransitioning: boolean;
  onScrollDown: () => void;
  onScrollUp: () => void;
}

export function useScrollTransition({
  currentSection,
  isTransitioning,
  onScrollDown,
  onScrollUp,
}: UseScrollTransitionProps) {
  const lastScrollTime = useRef<number>(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isTransitioning) return;
      
      const now = Date.now();
      if (now - lastScrollTime.current < SCROLL_COOLDOWN) return;
      
      if (e.deltaY > 0 && currentSection === 'hero') {
        lastScrollTime.current = now;
        onScrollDown();
      } else if (e.deltaY < 0 && currentSection === 'about') {
        lastScrollTime.current = now;
        onScrollUp();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isTransitioning) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [currentSection, isTransitioning, onScrollDown, onScrollUp]);
}
