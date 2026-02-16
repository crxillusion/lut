// Configuration constants for the application

import { assetUrl } from '@/app/utils/assetUrl';

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const SCROLL_COOLDOWN = 1500; // milliseconds
export const LOADING_TIMEOUT = 20000; // 20 seconds - for slow GitHub Pages LFS downloads
export const LOADING_DELAY = 7000; // 7 seconds - balanced loading time for branding

export const VIDEO_PATHS = {
  // Opening
  opening: assetUrl('/videos/loading_to_homepage.mp4'),
  
  // Hero/Homepage
  heroLoop: assetUrl('/videos/Homepage_loop.mp4'),
  heroToShowreel: assetUrl('/videos/Homepage_showreel.mp4'),
  showreelToHero: assetUrl('/videos/Homepage_showreel_reverse.mp4'),
  heroToAboutStart: assetUrl('/videos/Homepage_aboutstart.mp4'),
  aboutStartToHero: assetUrl('/videos/Homepage_aboutstart_reverse.mp4'),
  heroToCases: assetUrl('/videos/Homepage_cases.mp4'),
  casesToHero: assetUrl('/videos/Homepage_cases_reverse.mp4'),
  heroToContact: assetUrl('/videos/Homepage_contact.mp4'),
  contactToHero: assetUrl('/videos/Homepage_contact_reverse.mp4'),
  
  // About Start
  aboutStartLoop: assetUrl('/videos/aboutstart_loop.mp4'),
  aboutStartToAbout: assetUrl('/videos/aboutstarttoabout.mp4'),
  aboutToAboutStart: assetUrl('/videos/aboutstarttoabout_reverse.mp4'),
  
  // About
  aboutToTeam: assetUrl('/videos/abouttoteam.mp4'),
  teamToAbout: assetUrl('/videos/abouttoteam_reverse.mp4'),
  
  // Team (split into Team1 and Team2)
  team1ToTeam2: assetUrl('/videos/teamtoteam.mp4'),
  team2ToTeam1: assetUrl('/videos/teamtoteam_reverse.mp4'),
  team2ToOffer: assetUrl('/videos/teamtooffer.mp4'),
  offerToTeam2: assetUrl('/videos/teamtooffer_reverse.mp4'),
  
  // Offer
  offerToPartner: assetUrl('/videos/offertopartner.mp4'),
  partnerToOffer: assetUrl('/videos/offertopartner_reverse.mp4'),
  
  // Partner
  partnerToCases: assetUrl('/videos/partnertoCases.mp4'),
  casesToPartner: assetUrl('/videos/partnertoCases_reverse.mp4'),
  
  // Cases
  casesToContact: assetUrl('/videos/CasestoContact.mp4'),
  contactToCases: assetUrl('/videos/CasestoContact_reverse.mp4'),
  
  // Contact
  contactLoop: assetUrl('/videos/Contact_loop.mp4'),
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
