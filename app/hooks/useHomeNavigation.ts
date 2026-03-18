import type { Section } from '../constants/config';
import type { UseNavigationTransitionsResult } from './useNavigationTransitions';
import type { NavigationStateRefs } from './useNavigationState';

export interface UseHomeNavigationResult {
  currentSection: Section;
  isTransitioning: boolean;
  transitionVideoSrc: string | null;
  contactVisible: boolean;
  leavingContact: boolean;
  transitions: UseNavigationTransitionsResult['transitions'];
  transitionToAboutStart: (viaScroll?: boolean) => void;
  transitionToAbout: (viaScroll?: boolean) => void;
  transitionBackToHeroFromAboutStart: (viaScroll?: boolean) => void;
  transitionBackFromContact: () => void;
  handleScrollDown: () => void;
  handleScrollUp: () => void;
  handleBackClick: () => void;
  setContactVisible: (v: boolean) => void;
  setLeavingContact: (v: boolean) => void;
  showHero: boolean;
  previousSectionRef: NavigationStateRefs['previousSectionRef'];
}

export const DEFAULT_TRANSITION_VIDEO_SRC = '';

export type { NavigationState, NavigationStateActions, NavigationStateRefs } from './useNavigationState';
