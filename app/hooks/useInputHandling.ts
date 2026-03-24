import { useEffect, useRef } from 'react';
import { SCROLL_COOLDOWN } from '../constants/config';
import type { Section } from '../constants/config';
import { inputLogger } from '../utils/logger';

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
    if (currentSection === 'cases') {
      inputLogger.debug('[useInputHandling] Skipping event binding — section is "cases" (uses internal scroll)');
      return;
    }

    inputLogger.debug('[useInputHandling] Binding input handlers', { currentSection, isTransitioning, isWaiting });

    const canTrigger = () => {
      if (isTransitioning || isWaiting) {
        inputLogger.debug('[useInputHandling] canTrigger=false — isTransitioning or isWaiting', { isTransitioning, isWaiting });
        return false;
      }

      const now = Date.now();
      const elapsed = now - lastScrollTime.current;
      if (elapsed < SCROLL_COOLDOWN) {
        inputLogger.debug('[useInputHandling] canTrigger=false — cooldown active', { elapsed, SCROLL_COOLDOWN });
        return false;
      }

      lastScrollTime.current = now;
      return true;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      inputLogger.debug('[useInputHandling] wheel event', {
        deltaY: e.deltaY,
        currentSection,
        isTransitioning,
        isWaiting,
      });

      if (isTransitioning || isWaiting) {
        inputLogger.debug('[useInputHandling] wheel ignored — transitioning/waiting');
        return;
      }

      const now = Date.now();
      const elapsed = now - lastScrollTime.current;
      if (elapsed < SCROLL_COOLDOWN) {
        inputLogger.debug('[useInputHandling] wheel ignored — cooldown', { elapsed });
        return;
      }

      lastScrollTime.current = now;

      // Positive deltaY = scroll down, negative = scroll up
      if (e.deltaY > 0) {
        inputLogger.info('[useInputHandling] 🖱️ Scroll DOWN →', currentSection);
        onScrollDown();
      } else if (e.deltaY < 0) {
        inputLogger.info('[useInputHandling] 🖱️ Scroll UP →', currentSection);
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
      inputLogger.debug('[useInputHandling] touchstart', { y: touchStartY.current, x: touchStartX.current });
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

      const startY = touchStartY.current;
      const startX = touchStartX.current;

      if (startY === null || startX === null) return;

      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;

      const deltaY = startY - endY;
      const deltaX = startX - endX;
      const SWIPE_THRESHOLD = 30;

      const verticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

      inputLogger.debug('[useInputHandling] touchend', { deltaY, deltaX, verticalSwipe, currentSection });

      if (!canTrigger()) return;

      if (verticalSwipe && Math.abs(deltaY) > SWIPE_THRESHOLD) {
        // Swipe up = scroll down, swipe down = scroll up
        if (deltaY > 0) {
          inputLogger.info('[useInputHandling] 👆 Swipe UP (scroll down) →', currentSection);
          onScrollDown();
        } else {
          inputLogger.info('[useInputHandling] 👇 Swipe DOWN (scroll up) →', currentSection);
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
      inputLogger.debug('[useInputHandling] Removing input handlers', { currentSection });
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSection, isTransitioning, isWaiting, onScrollDown, onScrollUp]);
}
