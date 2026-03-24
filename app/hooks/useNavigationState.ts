import { useState, useRef } from 'react';
import type { Section } from '../constants/config';

export interface NavigationState {
  currentSection: Section;
  isTransitioning: boolean;
  transitionVideoSrc: string;
  heroVisible: boolean;
  aboutStartVisible: boolean;
  contactVisible: boolean;
  leavingContact: boolean;
}

export interface NavigationStateActions {
  setCurrentSection: (section: Section) => void;
  setIsTransitioning: (value: boolean) => void;
  setTransitionVideoSrc: (src: string) => void;
  setHeroVisible: (value: boolean) => void;
  setAboutStartVisible: (value: boolean) => void;
  setContactVisible: (value: boolean) => void;
  setLeavingContact: (value: boolean) => void;
}

export interface NavigationStateRefs {
  isTransitioningRef: React.MutableRefObject<boolean>;
  previousSectionRef: React.MutableRefObject<Section>;
  /** Set to true synchronously when leaving contact, before the 450ms fade delay elapses.
   *  Cleared when the video transition actually starts. Guards against double-fire. */
  isLeavingContactRef: React.MutableRefObject<boolean>;
}

export function useNavigationState() {
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoSrc, setTransitionVideoSrc] = useState('');
  const [heroVisible, setHeroVisible] = useState(false);
  const [aboutStartVisible, setAboutStartVisible] = useState(true);
  const [contactVisible, setContactVisible] = useState(false);
  const [leavingContact, setLeavingContact] = useState(false);

  const isTransitioningRef = useRef(false);
  const previousSectionRef = useRef<Section>('hero');
  const isLeavingContactRef = useRef(false);

  const state: NavigationState = {
    currentSection,
    isTransitioning,
    transitionVideoSrc,
    heroVisible,
    aboutStartVisible,
    contactVisible,
    leavingContact,
  };

  const actions: NavigationStateActions = {
    setCurrentSection,
    setIsTransitioning,
    setTransitionVideoSrc,
    setHeroVisible,
    setAboutStartVisible,
    setContactVisible,
    setLeavingContact,
  };

  const refs: NavigationStateRefs = {
    isTransitioningRef,
    previousSectionRef,
    isLeavingContactRef,
  };

  return { state, actions, refs };
}
