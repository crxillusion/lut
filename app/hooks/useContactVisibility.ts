import { useEffect } from 'react';
import type { Section } from '../constants/config';
import { homeLogger } from '../utils/logger';

interface UseContactVisibilityOptions {
  currentSection: Section;
  showHero: boolean;
  waitingForContactLoop: boolean;
  contactVisible: boolean;
  leavingContact: boolean;
  setContactVisible: (v: boolean) => void;
  setLeavingContact: (v: boolean) => void;
}

/**
 * Manages the Contact section UI fade-in/out state.
 *
 * Behavior:
 * - When entering `contact`, waits briefly then shows UI.
 * - When leaving `contact`, hides UI and keeps `leavingContact` true until section changes.
 *   This prevents a fade-in glitch where UI re-appears before the transition video starts.
 */
export function useContactVisibility({
  currentSection,
  showHero,
  waitingForContactLoop,
  contactVisible,
  leavingContact,
  setContactVisible,
  setLeavingContact,
}: UseContactVisibilityOptions) {
  useEffect(() => {
    // Enter: show UI after a short delay (only when not leaving)
    if (currentSection === 'contact' && showHero && !waitingForContactLoop && !contactVisible && !leavingContact) {
      const timer = setTimeout(() => {
        homeLogger.debug('Setting contactVisible to true');
        setContactVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }

    // While still on the contact section, do NOT reset leavingContact.
    // We want to keep it true throughout the exit sequence (loop speed-up + transition).

    // After leaving contact section, reset state
    if (currentSection !== 'contact' && (contactVisible || leavingContact)) {
      if (contactVisible) {
        homeLogger.debug('Leaving contact section, resetting contactVisible to false');
        setContactVisible(false);
      }
      if (leavingContact) {
        homeLogger.debug('Resetting leavingContact flag after leaving contact');
        setLeavingContact(false);
      }
    }
  }, [
    contactVisible,
    currentSection,
    leavingContact,
    setContactVisible,
    setLeavingContact,
    showHero,
    waitingForContactLoop,
  ]);
}
