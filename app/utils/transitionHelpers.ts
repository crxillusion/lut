// Transition helper utilities to reduce boilerplate
import { RefObject } from 'react';
import { Section } from '../constants/config';

/**
 * Creates a simple transition callback that just calls handleTransition
 * Eliminates the need for individual useCallback wrappers for simple transitions
 */
export function createSimpleTransition(
  targetSection: Section,
  videoPath: string,
  targetVideoRef: RefObject<HTMLVideoElement | null>,
  handleTransition: (
    section: Section,
    video: string,
    ref: RefObject<HTMLVideoElement | null>,
    isDirect?: boolean
  ) => void,
  isDirectNavigation: boolean = false
) {
  return () => {
    handleTransition(targetSection, videoPath, targetVideoRef, isDirectNavigation);
  };
}

/**
 * Creates a transition callback that also updates the previousSection ref
 */
export function createTransitionWithTracking(
  targetSection: Section,
  videoPath: string,
  targetVideoRef: RefObject<HTMLVideoElement | null>,
  previousSectionRef: RefObject<Section>,
  trackingSection: Section,
  handleTransition: (
    section: Section,
    video: string,
    ref: RefObject<HTMLVideoElement | null>,
    isDirect?: boolean
  ) => void,
  isDirectNavigation: boolean = false
) {
  return () => {
    previousSectionRef.current = trackingSection;
    handleTransition(targetSection, videoPath, targetVideoRef, isDirectNavigation);
  };
}

/**
 * Type for video ref mapping
 */
export type VideoRefMap = {
  [K in Section]: RefObject<HTMLVideoElement | null>;
};

/**
 * Gets video ref by section name
 */
export function getVideoRef(section: Section, refs: VideoRefMap): RefObject<HTMLVideoElement | null> {
  return refs[section];
}
