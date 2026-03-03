import { BASE_PATH } from './config';

/**
 * Images that should be warmed in cache during the loading phase.
 * Keep this list stable to avoid re-running any preload effect.
 */
export const HOME_PRELOAD_IMAGE_PATHS: string[] = [
  // Loading screen + global background assets
  // NOTE: loader is now a .lottie file (preloaded as fetch in `app/page.tsx`), so no GIF here.
  `${BASE_PATH}/loading-bg.jpg`,

  // Static sections backgrounds (optimized)
  // Preload *all* responsive widths in both AVIF and WebP so every screen gets a warm cache.
  `${BASE_PATH}/optimized/about--640.avif`,
  `${BASE_PATH}/optimized/about--960.avif`,
  `${BASE_PATH}/optimized/about--1280.avif`,
  `${BASE_PATH}/optimized/about--1600.avif`,
  `${BASE_PATH}/optimized/about--1920.avif`,
  `${BASE_PATH}/optimized/about--2560.avif`,
  `${BASE_PATH}/optimized/about--2920.avif`,
  `${BASE_PATH}/optimized/about--640.webp`,
  `${BASE_PATH}/optimized/about--960.webp`,
  `${BASE_PATH}/optimized/about--1280.webp`,
  `${BASE_PATH}/optimized/about--1600.webp`,
  `${BASE_PATH}/optimized/about--1920.webp`,
  `${BASE_PATH}/optimized/about--2560.webp`,
  `${BASE_PATH}/optimized/about--2920.webp`,

  `${BASE_PATH}/optimized/team1--640.avif`,
  `${BASE_PATH}/optimized/team1--960.avif`,
  `${BASE_PATH}/optimized/team1--1280.avif`,
  `${BASE_PATH}/optimized/team1--1600.avif`,
  `${BASE_PATH}/optimized/team1--1920.avif`,
  `${BASE_PATH}/optimized/team1--2560.avif`,
  `${BASE_PATH}/optimized/team1--2920.avif`,
  `${BASE_PATH}/optimized/team1--640.webp`,
  `${BASE_PATH}/optimized/team1--960.webp`,
  `${BASE_PATH}/optimized/team1--1280.webp`,
  `${BASE_PATH}/optimized/team1--1600.webp`,
  `${BASE_PATH}/optimized/team1--1920.webp`,
  `${BASE_PATH}/optimized/team1--2560.webp`,
  `${BASE_PATH}/optimized/team1--2920.webp`,

  `${BASE_PATH}/optimized/team2--640.avif`,
  `${BASE_PATH}/optimized/team2--960.avif`,
  `${BASE_PATH}/optimized/team2--1280.avif`,
  `${BASE_PATH}/optimized/team2--1600.avif`,
  `${BASE_PATH}/optimized/team2--1920.avif`,
  `${BASE_PATH}/optimized/team2--2560.avif`,
  `${BASE_PATH}/optimized/team2--2920.avif`,
  `${BASE_PATH}/optimized/team2--640.webp`,
  `${BASE_PATH}/optimized/team2--960.webp`,
  `${BASE_PATH}/optimized/team2--1280.webp`,
  `${BASE_PATH}/optimized/team2--1600.webp`,
  `${BASE_PATH}/optimized/team2--1920.webp`,
  `${BASE_PATH}/optimized/team2--2560.webp`,
  `${BASE_PATH}/optimized/team2--2920.webp`,

  `${BASE_PATH}/optimized/offer--640.avif`,
  `${BASE_PATH}/optimized/offer--960.avif`,
  `${BASE_PATH}/optimized/offer--1280.avif`,
  `${BASE_PATH}/optimized/offer--1600.avif`,
  `${BASE_PATH}/optimized/offer--1920.avif`,
  `${BASE_PATH}/optimized/offer--2560.avif`,
  `${BASE_PATH}/optimized/offer--2920.avif`,
  `${BASE_PATH}/optimized/offer--640.webp`,
  `${BASE_PATH}/optimized/offer--960.webp`,
  `${BASE_PATH}/optimized/offer--1280.webp`,
  `${BASE_PATH}/optimized/offer--1600.webp`,
  `${BASE_PATH}/optimized/offer--1920.webp`,
  `${BASE_PATH}/optimized/offer--2560.webp`,
  `${BASE_PATH}/optimized/offer--2920.webp`,

  `${BASE_PATH}/optimized/partners--640.avif`,
  `${BASE_PATH}/optimized/partners--960.avif`,
  `${BASE_PATH}/optimized/partners--1280.avif`,
  `${BASE_PATH}/optimized/partners--1600.avif`,
  `${BASE_PATH}/optimized/partners--1920.avif`,
  `${BASE_PATH}/optimized/partners--2560.avif`,
  `${BASE_PATH}/optimized/partners--2920.avif`,
  `${BASE_PATH}/optimized/partners--640.webp`,
  `${BASE_PATH}/optimized/partners--960.webp`,
  `${BASE_PATH}/optimized/partners--1280.webp`,
  `${BASE_PATH}/optimized/partners--1600.webp`,
  `${BASE_PATH}/optimized/partners--1920.webp`,
  `${BASE_PATH}/optimized/partners--2560.webp`,
  `${BASE_PATH}/optimized/partners--2920.webp`,

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

  // Section frame overlays
  `${BASE_PATH}/Cases_png_transparent.png`,
  `${BASE_PATH}/Showreel_png_transparent.png`,
] as const;
