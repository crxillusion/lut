// Centralized video ref management
import { useRef, RefObject, useMemo } from 'react';
import { Section } from '../constants/config';

export interface VideoRefs {
  hero: RefObject<HTMLVideoElement | null>;
  transition: RefObject<HTMLVideoElement | null>;
  showreel: RefObject<HTMLVideoElement | null>;
  aboutStart: RefObject<HTMLVideoElement | null>;
  about: RefObject<HTMLVideoElement | null>;
  team1: RefObject<HTMLVideoElement | null>;
  team2: RefObject<HTMLVideoElement | null>;
  offer: RefObject<HTMLVideoElement | null>;
  partner: RefObject<HTMLVideoElement | null>;
  cases: RefObject<HTMLVideoElement | null>;
  contact: RefObject<HTMLVideoElement | null>;
}

export function useVideoRefs(): VideoRefs {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const showreelVideoRef = useRef<HTMLVideoElement>(null);
  const aboutStartVideoRef = useRef<HTMLVideoElement>(null);
  const aboutVideoRef = useRef<HTMLVideoElement>(null);
  const team1VideoRef = useRef<HTMLVideoElement>(null);
  const team2VideoRef = useRef<HTMLVideoElement>(null);
  const offerVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const casesVideoRef = useRef<HTMLVideoElement>(null);
  const contactVideoRef = useRef<HTMLVideoElement>(null);

  return useMemo(
    () => ({
      hero: heroVideoRef,
      transition: transitionVideoRef,
      showreel: showreelVideoRef,
      aboutStart: aboutStartVideoRef,
      about: aboutVideoRef,
      team1: team1VideoRef,
      team2: team2VideoRef,
      offer: offerVideoRef,
      partner: partnerVideoRef,
      cases: casesVideoRef,
      contact: contactVideoRef,
    }),
    []
  );
}

/**
 * Get video ref by section name
 */
export function getVideoRefBySection(refs: VideoRefs, section: Section): RefObject<HTMLVideoElement | null> {
  const mapping: Record<Section, keyof VideoRefs> = {
    hero: 'hero',
    showreel: 'showreel',
    aboutStart: 'aboutStart',
    about: 'about',
    team1: 'team1',
    team2: 'team2',
    offer: 'offer',
    partner: 'partner',
    cases: 'cases',
    contact: 'contact',
  };

  return refs[mapping[section]];
}
