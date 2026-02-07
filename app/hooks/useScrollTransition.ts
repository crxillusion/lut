import { useEffect, useRef } from 'react';
import { SCROLL_COOLDOWN } from '../constants/config';
import type { Section } from '../constants/config';

interface UseScrollTransitionProps {
  currentSection: Section;
  isTransitioning: boolean;
  isWaiting?: boolean; // Block scrolls while waiting for hero loop to complete
  onScrollDown: () => void;
  onScrollUp: () => void;
}

export function useScrollTransition({
  currentSection,
  isTransitioning,
  isWaiting = false,
  onScrollDown,
  onScrollUp,
}: UseScrollTransitionProps) {
  const lastScrollTime = useRef<number>(0);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    // Cases has its own internal scroll container and wheel interception.
    // On mobile, global swipe transitions fight with that UX and can accidentally
    // navigate to Contact/Partner while the user is trying to scroll.
    if (currentSection === 'cases') return;

    const canTrigger = () => {
      // Disable all scrolling on contact section
      if (currentSection === 'contact') return false;
      if (isTransitioning || isWaiting) return false;

      const now = Date.now();
      if (now - lastScrollTime.current < SCROLL_COOLDOWN) return false;

      lastScrollTime.current = now;
      return true;
    };

    const triggerDown = () => {
      if (!canTrigger()) return;
      onScrollDown();
    };

    const triggerUp = () => {
      if (!canTrigger()) return;
      onScrollUp();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (currentSection === 'contact') return;
      if (isTransitioning || isWaiting) return;

      const now = Date.now();
      if (now - lastScrollTime.current < SCROLL_COOLDOWN) return;

      lastScrollTime.current = now;

      if (e.deltaY > 0) {
        onScrollDown();
      } else if (e.deltaY < 0) {
        onScrollUp();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent native scroll while transitioning/waiting to avoid fighting the overlay.
      if (isTransitioning || isWaiting) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const startY = touchStartY.current;
      const startX = touchStartX.current;
      touchStartY.current = null;
      touchStartX.current = null;

      if (startY == null || startX == null) return;
      if (e.changedTouches.length !== 1) return;

      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;

      const dy = startY - endY; // positive => swipe up => go down
      const dx = startX - endX;

      const absDy = Math.abs(dy);
      const absDx = Math.abs(dx);

      // Basic swipe heuristics: mostly vertical and above threshold.
      const SWIPE_MIN_PX = 50;
      const VERTICAL_RATIO = 1.2;
      if (absDy < SWIPE_MIN_PX) return;
      if (absDy < absDx * VERTICAL_RATIO) return;

      if (dy > 0) {
        triggerDown();
      } else {
        triggerUp();
      }
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
