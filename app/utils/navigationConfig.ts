// Navigation configuration - maps all possible transitions
import { Section, VIDEO_PATHS } from '../constants/config';

export interface NavigationAction {
  targetSection: Section;
  videoPath: string;
  requiresLoop?: boolean;
  updatePreviousSection?: boolean;
}

type NavigationMap = {
  [key in Section]?: {
    forward?: NavigationAction;
    back?: NavigationAction;
    directNav?: Partial<Record<Section, NavigationAction>>;
  };
};

export const NAVIGATION_CONFIG: NavigationMap = {
  hero: {
    forward: {
      targetSection: 'aboutStart',
      videoPath: VIDEO_PATHS.heroToAboutStart,
      requiresLoop: true,
    },
    directNav: {
      showreel: {
        targetSection: 'showreel',
        videoPath: VIDEO_PATHS.heroToShowreel,
        updatePreviousSection: true,
      },
      aboutStart: {
        targetSection: 'aboutStart',
        videoPath: VIDEO_PATHS.heroToAboutStart,
        updatePreviousSection: true,
      },
      cases: {
        targetSection: 'cases',
        videoPath: VIDEO_PATHS.heroToCases,
        updatePreviousSection: true,
      },
      contact: {
        targetSection: 'contact',
        videoPath: VIDEO_PATHS.heroToContact,
        updatePreviousSection: true,
      },
    },
  },
  
  showreel: {
    back: {
      targetSection: 'hero',
      videoPath: VIDEO_PATHS.showreelToHero,
    },
  },
  
  aboutStart: {
    forward: {
      targetSection: 'about',
      videoPath: VIDEO_PATHS.aboutStartToAbout,
      requiresLoop: true,
    },
    back: {
      targetSection: 'hero',
      videoPath: VIDEO_PATHS.aboutStartToHero,
      requiresLoop: true,
    },
  },
  
  about: {
    forward: {
      targetSection: 'team1',
      videoPath: VIDEO_PATHS.aboutToTeam,
    },
    back: {
      targetSection: 'aboutStart',
      videoPath: VIDEO_PATHS.aboutToAboutStart,
    },
  },
  
  team1: {
    forward: {
      targetSection: 'team2',
      videoPath: VIDEO_PATHS.team1ToTeam2,
    },
    back: {
      targetSection: 'about',
      videoPath: VIDEO_PATHS.teamToAbout,
    },
  },
  
  team2: {
    forward: {
      targetSection: 'offer',
      videoPath: VIDEO_PATHS.team2ToOffer,
    },
    back: {
      targetSection: 'team1',
      videoPath: VIDEO_PATHS.team2ToTeam1,
    },
  },
  
  offer: {
    forward: {
      targetSection: 'partner',
      videoPath: VIDEO_PATHS.offerToPartner,
    },
    back: {
      targetSection: 'team2',
      videoPath: VIDEO_PATHS.offerToTeam2,
    },
  },
  
  partner: {
    forward: {
      targetSection: 'cases',
      videoPath: VIDEO_PATHS.partnerToCases,
    },
    back: {
      targetSection: 'offer',
      videoPath: VIDEO_PATHS.partnerToOffer,
    },
  },
  
  cases: {
    forward: {
      targetSection: 'contact',
      videoPath: VIDEO_PATHS.casesToContact,
    },
    back: {
      targetSection: 'partner',
      videoPath: VIDEO_PATHS.casesToPartner,
    },
    directNav: {
      hero: {
        targetSection: 'hero',
        videoPath: VIDEO_PATHS.casesToHero,
      },
    },
  },
  
  contact: {
    back: {
      targetSection: 'cases', // Will be determined dynamically based on previousSection
      videoPath: VIDEO_PATHS.contactToCases,
      requiresLoop: true,
    },
  },
};

/**
 * Get navigation action for a given section and direction
 */
export function getNavigationAction(
  from: Section,
  direction: 'forward' | 'back' | Section
): NavigationAction | null {
  const config = NAVIGATION_CONFIG[from];
  
  if (!config) return null;
  
  if (direction === 'forward') {
    return config.forward ?? null;
  }
  
  if (direction === 'back') {
    return config.back ?? null;
  }
  
  // Direct navigation to specific section
  return config.directNav?.[direction] ?? null;
}

/**
 * Get the video path for a transition
 */
export function getTransitionVideoPath(from: Section, to: Section): string | null {
  const action = getNavigationAction(from, to);
  return action?.videoPath ?? null;
}
