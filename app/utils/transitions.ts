// Type-safe transition definitions and helpers
import { Section } from '../constants/config';
import { RefObject } from 'react';

export interface TransitionConfig {
  from: Section;
  to: Section;
  videoPath: string;
  requiresLoop?: boolean; // Whether to wait for loop completion
  fadeOutUI?: boolean; // Whether to fade out UI before transition
}

export interface TransitionContext {
  videoRefs: Record<Section, RefObject<HTMLVideoElement | null>>;
  transitionVideoRef: RefObject<HTMLVideoElement | null>;
  currentSection: Section;
  previousSection: Section;
}

// Navigation routes - defines which sections can transition to which
export const NAVIGATION_ROUTES: Record<Section, Section[]> = {
  hero: ['showreel', 'aboutStart', 'cases', 'contact'],
  showreel: ['hero'],
  aboutStart: ['hero', 'about'],
  about: ['aboutStart', 'team1'],
  team1: ['about', 'team2'],
  team2: ['team1', 'offer'],
  offer: ['team2', 'partner'],
  partner: ['offer', 'cases'],
  cases: ['partner', 'contact', 'hero'],
  contact: ['hero', 'cases'],
};

// Sections with looping videos
export const LOOPING_SECTIONS: Section[] = ['hero', 'aboutStart', 'contact'];

// Sections with special UI animations
export const ANIMATED_SECTIONS: Section[] = ['hero', 'aboutStart', 'contact'];

/**
 * Helper to determine if a section has a looping video
 */
export function hasLoopingVideo(section: Section): boolean {
  return LOOPING_SECTIONS.includes(section);
}

/**
 * Helper to determine if a section has animated UI
 */
export function hasAnimatedUI(section: Section): boolean {
  return ANIMATED_SECTIONS.includes(section);
}

/**
 * Helper to determine if a transition is valid
 */
export function isValidTransition(from: Section, to: Section): boolean {
  return NAVIGATION_ROUTES[from]?.includes(to) ?? false;
}

/**
 * Get the next section in scroll order
 */
export function getNextSection(current: Section): Section | null {
  const scrollOrder: Section[] = [
    'hero',
    'aboutStart',
    'about',
    'team1',
    'team2',
    'offer',
    'partner',
    'cases',
    'contact',
  ];

  const currentIndex = scrollOrder.indexOf(current);
  if (currentIndex === -1 || currentIndex === scrollOrder.length - 1) {
    return null;
  }

  return scrollOrder[currentIndex + 1];
}

/**
 * Get the previous section in scroll order
 */
export function getPreviousSection(current: Section): Section | null {
  const scrollOrder: Section[] = [
    'hero',
    'aboutStart',
    'about',
    'team1',
    'team2',
    'offer',
    'partner',
    'cases',
    'contact',
  ];

  const currentIndex = scrollOrder.indexOf(current);
  if (currentIndex <= 0) {
    return null;
  }

  return scrollOrder[currentIndex - 1];
}
