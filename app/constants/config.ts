// Configuration constants for the application

export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/lut' : '';

export const SCROLL_COOLDOWN = 1500; // milliseconds
export const LOADING_TIMEOUT = 10000; // milliseconds
export const LOADING_DELAY = 500; // milliseconds

export const VIDEO_PATHS = {
  heroLoop: `${BASE_PATH}/videos/Homepage_loop[0000-0150].mp4`,
  heroToAbout: `${BASE_PATH}/videos/Homepage_aboutstart[0150-0180].mp4`,
  aboutToHero: `${BASE_PATH}/videos/aboutstart_homepage_reverse[0180-0150].mp4`,
  aboutLoop: `${BASE_PATH}/videos/aboutstart_loop[0000-0150].mp4`,
} as const;

export type Section = 'hero' | 'about' | 'contact';
export type TransitionDirection = 'forward' | 'reverse';
