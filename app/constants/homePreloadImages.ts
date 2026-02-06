import { BASE_PATH } from './config';

/**
 * Images that should be warmed in cache during the loading phase.
 * Keep this list stable to avoid re-running any preload effect.
 */
export const HOME_PRELOAD_IMAGE_PATHS: string[] = [
  `${BASE_PATH}/cases-bg.png`,

  // Loading screen assets
  `${BASE_PATH}/logo-animation.gif`,
  `${BASE_PATH}/loading-bg.jpg`,
] as const;
