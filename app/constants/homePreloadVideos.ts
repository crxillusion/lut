import { VIDEO_PATHS } from './config';

/**
 * Videos that must be ready before the loading screen completes.
 * Keep this list stable to avoid re-running the preload effect.
 */
export const HOME_PRELOAD_VIDEO_PATHS: string[] = [
  // Must-have for initial experience
  VIDEO_PATHS.opening,
  VIDEO_PATHS.heroLoop,

  // Immediate hero navigation targets
  VIDEO_PATHS.heroToShowreel,
  VIDEO_PATHS.heroToAboutStart,
  VIDEO_PATHS.heroToCases,
  VIDEO_PATHS.heroToContact,

  // Ensure the first loop in AboutStart and Contact is ready when reached
  VIDEO_PATHS.aboutStartLoop,
  VIDEO_PATHS.contactLoop,

  // Back transitions to hero from first-level sections
  VIDEO_PATHS.showreelToHero,
  VIDEO_PATHS.aboutStartToHero,
  VIDEO_PATHS.casesToHero,
  VIDEO_PATHS.contactToHero,
];
