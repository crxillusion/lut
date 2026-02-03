import { VIDEO_PATHS } from './config';

/**
 * Videos that must be ready before the loading screen completes.
 * Keep this list stable to avoid re-running the preload effect.
 */
export const HOME_PRELOAD_VIDEO_PATHS: string[] = [
  VIDEO_PATHS.opening,
  VIDEO_PATHS.heroLoop,
  VIDEO_PATHS.heroToShowreel,
  VIDEO_PATHS.showreelToHero,
  VIDEO_PATHS.heroToAboutStart,
  VIDEO_PATHS.aboutStartToHero,
  VIDEO_PATHS.heroToCases,
  VIDEO_PATHS.casesToHero,
  VIDEO_PATHS.heroToContact,
  VIDEO_PATHS.contactToHero,
  VIDEO_PATHS.aboutStartLoop,
  VIDEO_PATHS.aboutStartToAbout,
  VIDEO_PATHS.aboutToAboutStart,
  VIDEO_PATHS.aboutToTeam,
  VIDEO_PATHS.teamToAbout,
  VIDEO_PATHS.team1ToTeam2,
  VIDEO_PATHS.team2ToTeam1,
  VIDEO_PATHS.team2ToOffer,
  VIDEO_PATHS.offerToTeam2,
  VIDEO_PATHS.offerToPartner,
  VIDEO_PATHS.partnerToOffer,
  VIDEO_PATHS.partnerToCases,
  VIDEO_PATHS.casesToPartner,
  VIDEO_PATHS.casesToContact,
  VIDEO_PATHS.contactLoop,
];
