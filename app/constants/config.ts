// Configuration constants for the application

export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/lut' : '';

export const SCROLL_COOLDOWN = 1500; // milliseconds
export const LOADING_TIMEOUT = 10000; // milliseconds
export const LOADING_DELAY = 500; // milliseconds

export const VIDEO_PATHS = {
  // Hero/Homepage
  heroLoop: `${BASE_PATH}/videos/Homepage_loop[0000-0150].mp4`,
  heroToShowreel: `${BASE_PATH}/videos/Homepage_showreel.mp4`,
  showreelToHero: `${BASE_PATH}/videos/Homepage_showreel_reverse.mp4`,
  heroToAboutStart: `${BASE_PATH}/videos/Homepage_aboutstart[0150-0180].mp4`,
  aboutStartToHero: `${BASE_PATH}/videos/aboutstart_homepage_reverse[0180-0150].mp4`,
  heroToCases: `${BASE_PATH}/videos/Homepage_cases.mp4`,
  casesToHero: `${BASE_PATH}/videos/Homepage_cases_reverse.mp4`,
  heroToContact: `${BASE_PATH}/videos/Homepage_contact[0150-0180].mp4`,
  contactToHero: `${BASE_PATH}/videos/Homepage_contact_reverse.mp4`,
  
  // About Start
  aboutStartLoop: `${BASE_PATH}/videos/aboutstart_loop[0000-0150].mp4`,
  aboutStartToAbout: `${BASE_PATH}/videos/aboutstarttoabout.mp4`,
  aboutToAboutStart: `${BASE_PATH}/videos/aboutstarttoaboutreverse.mp4`,
  
  // About
  aboutToTeam: `${BASE_PATH}/videos/abouttoteam.mp4`,
  teamToAbout: `${BASE_PATH}/videos/abouttoteam_reverse.mp4`,
  
  // Team (split into Team1 and Team2)
  team1ToTeam2: `${BASE_PATH}/videos/teamtoteam.mp4`,
  team2ToTeam1: `${BASE_PATH}/videos/teamtoteam_reverse.mp4`,
  team2ToOffer: `${BASE_PATH}/videos/teamtooffer.mp4`,
  offerToTeam2: `${BASE_PATH}/videos/teamtooffer_reverse.mp4`,
  
  // Offer
  offerToPartner: `${BASE_PATH}/videos/offertopartner.mp4`,
  partnerToOffer: `${BASE_PATH}/videos/offertopartner_reverse.mp4`,
  
  // Partner
  partnerToCases: `${BASE_PATH}/videos/partnertoCases.mp4`,
  casesToPartner: `${BASE_PATH}/videos/partnertoCases_reverse.mp4`,
  
  // Cases
  casesToContact: `${BASE_PATH}/videos/CasestoContact.mp4`,
  
  // Contact
  contactLoop: `${BASE_PATH}/videos/Contact_loop.mp4`,
} as const;

export type Section = 
  | 'hero' 
  | 'showreel' 
  | 'aboutStart' 
  | 'about' 
  | 'team1'
  | 'team2'
  | 'offer' 
  | 'partner' 
  | 'cases' 
  | 'contact';

export type TransitionDirection = 'forward' | 'reverse';
