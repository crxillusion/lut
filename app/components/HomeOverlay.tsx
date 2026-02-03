'use client';

import { SocialLinks } from './SocialLinks';
import type { UseHomeNavigationResult } from '../hooks/useHomeNavigation';

interface HomeOverlayProps {
  nav: UseHomeNavigationResult;
  showHero: boolean;
}

export function HomeOverlay({ nav, showHero }: HomeOverlayProps) {
  if (!showHero) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="pointer-events-auto">
        <SocialLinks
          showBackButton={nav.currentSection !== 'hero'}
          onBackClick={nav.handleBackClick}
          isVisible={showHero}
          animateOnce={true}
        />
      </div>
    </div>
  );
}
