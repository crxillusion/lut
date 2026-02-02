// Centralized state management for section transitions
import { useState, useRef } from 'react';
import type { Section } from '../constants/config';

export interface SectionState {
  current: Section;
  isTransitioning: boolean;
  transitionVideoSrc: string;
  showOpening: boolean;
  showHero: boolean;
  loadingScreenVisible: boolean;
  
  // UI visibility states
  heroVisible: boolean;
  aboutStartVisible: boolean;
  contactVisible: boolean;
  leavingContact: boolean;
  
  // Loop waiting states
  waitingForHeroLoop: boolean;
  waitingForAboutStartLoop: boolean;
  waitingForContactLoop: boolean;
  
  // Pending transition
  pendingTransition: {
    section: Section;
    video: string;
    ref: React.RefObject<HTMLVideoElement | null>;
  } | null;
}

export interface SectionStateActions {
  setCurrentSection: (section: Section) => void;
  setIsTransitioning: (value: boolean) => void;
  setTransitionVideoSrc: (src: string) => void;
  setShowOpening: (value: boolean) => void;
  setShowHero: (value: boolean) => void;
  setLoadingScreenVisible: (value: boolean) => void;
  setHeroVisible: (value: boolean) => void;
  setAboutStartVisible: (value: boolean) => void;
  setContactVisible: (value: boolean) => void;
  setLeavingContact: (value: boolean) => void;
  setWaitingForHeroLoop: (value: boolean) => void;
  setWaitingForAboutStartLoop: (value: boolean) => void;
  setWaitingForContactLoop: (value: boolean) => void;
  setPendingTransition: (transition: SectionState['pendingTransition']) => void;
}

export function useSectionState() {
  const [currentSection, setCurrentSection] = useState<Section>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoSrc, setTransitionVideoSrc] = useState('');
  const [showOpening, setShowOpening] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true);
  const [heroVisible, setHeroVisible] = useState(false);
  const [aboutStartVisible, setAboutStartVisible] = useState(true);
  const [contactVisible, setContactVisible] = useState(false);
  const [leavingContact, setLeavingContact] = useState(false);
  const [waitingForHeroLoop, setWaitingForHeroLoop] = useState(false);
  const [waitingForAboutStartLoop, setWaitingForAboutStartLoop] = useState(false);
  const [waitingForContactLoop, setWaitingForContactLoop] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<SectionState['pendingTransition']>(null);

  const isTransitioningRef = useRef(false);
  const previousSectionRef = useRef<Section>('hero');

  const state: SectionState = {
    current: currentSection,
    isTransitioning,
    transitionVideoSrc,
    showOpening,
    showHero,
    loadingScreenVisible,
    heroVisible,
    aboutStartVisible,
    contactVisible,
    leavingContact,
    waitingForHeroLoop,
    waitingForAboutStartLoop,
    waitingForContactLoop,
    pendingTransition,
  };

  const actions: SectionStateActions = {
    setCurrentSection,
    setIsTransitioning,
    setTransitionVideoSrc,
    setShowOpening,
    setShowHero,
    setLoadingScreenVisible,
    setHeroVisible,
    setAboutStartVisible,
    setContactVisible,
    setLeavingContact,
    setWaitingForHeroLoop,
    setWaitingForAboutStartLoop,
    setWaitingForContactLoop,
    setPendingTransition,
  };

  return {
    state,
    actions,
    refs: {
      isTransitioning: isTransitioningRef,
      previousSection: previousSectionRef,
    },
  };
}
