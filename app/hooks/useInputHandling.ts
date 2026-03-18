import { useEffect, useRef } from 'react';
import { SCROLL_COOLDOWN } from '../constants/config';
import type { Section } from '../constants/config';

interface UseInputHandlingProps {
  currentSection: Section;
  isTransitioning: boolean;
  isWaiting?: boolean;
  onScrollDown: () => void;
  onScrollUp: () => void;
}

export function useInputHandling({
  currentSection,
  isTransitioning,
  isWaiting = false,
  onScrollDown,
  onScrollUp,
}: UseInputHandlingProps) {
  const lastScrollTime = useRef<number>(0);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    // Cases has its own internal scroll container
    // Global swipe transitions would conflict with internal scrolling
    if (currentSection === 'cases') return;

    const canTrigger = () => {
      if (currentSection === 'contact') return false;
      if (isTransitioning || isWaiting) return false;

      const now = Date.now();
      if (now - lastScrollTime.current < SCROLL_COOLDOWN) return false;

      lastScrollTime.current = now;
      return true;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (currentSection === 'contact') return;
      if (isTransitioning || isWaiting) return;

      const now = Date.now();
      if (now - lastScrollTime.current < SCROLL_COOLDOWN) return;

      lastScrollTime.current = now;

      // Positive deltaY = scroll down, negative = scroll up
      if (e.deltaY > 0) {
        onScrollDown();
      } else if (e.deltaY < 0) {
        onScrollUp();
      }
    };

    /**
     * Touch start handler - record initial position
     */
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isTransitioning || isWaiting) {
        e.preventDefault();
      }
    };

    /**
     * Touch end handler - detect swipes and trigger navigation
     */
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      if (!canTrigger()) return;

      const startY = touchStartY.current;
      const startX = touchStartX.current;

      if (startY === null || startX === null) return;

      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;

      const deltaY = startY - endY;
      const deltaX = startX - endX;
      const SWIPE_THRESHOLD = 30;

      const verticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

      if (verticalSwipe && Math.abs(deltaY) > SWIPE_THRESHOLD) {
        // Swipe up = scroll down, swipe down = scroll up
        if (deltaY > 0) {
          onScrollDown();
        } else {
          onScrollUp();
        }
      }

      touchStartY.current = null;
      touchStartX.current = null;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSection, isTransitioning, isWaiting, onScrollDown, onScrollUp]);
}
