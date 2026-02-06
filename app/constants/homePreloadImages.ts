import { BASE_PATH } from './config';

/**
 * Images that should be warmed in cache during the loading phase.
 * Keep this list stable to avoid re-running any preload effect.
 */
export const HOME_PRELOAD_IMAGE_PATHS: string[] = [
  // Loading screen + global background assets
  `${BASE_PATH}/logo-animation.gif`,
  `${BASE_PATH}/loading-bg.jpg`,

  // Cases section background
  `${BASE_PATH}/cases-bg.png`,

  // Cases cards (preload during loading screen so the grid appears instantly)
  `${BASE_PATH}/cases/5f74027c328b57bc4440ab05dfa0115e909245e3.png`,
  `${BASE_PATH}/cases/f7f9a59fb629bc50bd16b0d625b4121f2ced0c0c.png`,
  `${BASE_PATH}/cases/f52f8354b0cae68738cfcd2bfd7e2f28c24e56eb.png`,
  `${BASE_PATH}/cases/7a43535bda67a565f92d4c59b40208caca25857c.jpg`,
  `${BASE_PATH}/cases/9cb8ae990c7485afbbdad3534bbb2fb9f0b95ba0.png`,
  `${BASE_PATH}/cases/a947072b922f94c359fe8d47a6f82546cd6251ba.png`,
  `${BASE_PATH}/cases/614242dcf847675c792606557d89585df622ca2d.png`,
  `${BASE_PATH}/cases/d7546950bcd3ab692d9d95cf48dbf1f4b49d65ca.jpg`,
  `${BASE_PATH}/cases/9534b83aa66ccdd7e8f10bcea0eeaea278cf4554.jpg`,
  `${BASE_PATH}/cases/d95f75bea90f42feb2c769a38b8c30a17d48bca5.png`,
] as const;
