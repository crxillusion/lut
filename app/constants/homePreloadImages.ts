import { BASE_PATH } from './config';

/**
 * Intelligent preloading strategy:
 * - CRITICAL: Must load before user can interact (loading screen)
 * - HIGH PRIORITY: Load while opening transition plays (~5-8s window)
 * - MEDIUM PRIORITY: Load in background after page is interactive
 * - LOW PRIORITY: Lazy load on-demand when user scrolls
 */

// Utility to detect optimal image variant for device width
export const getOptimalImageVariant = (width?: number): number => {
  const deviceWidth = width ?? (typeof window !== 'undefined' ? window.innerWidth : 1280);
  if (deviceWidth < 768) return 640;
  if (deviceWidth < 1024) return 960;
  if (deviceWidth < 1366) return 1280;
  if (deviceWidth < 1920) return 1600;
  if (deviceWidth < 2560) return 1920;
  return 2560;
};

// Phase 1: CRITICAL - Block loading screen until these load (~500KB, 2-3s)
// Only what's absolutely necessary before user can interact
export const CRITICAL_PRELOAD_IMAGES: string[] = [
  // Loading screen background (user sees immediately)
  `${BASE_PATH}/loading-bg.jpg`,
];

// Helper function to generate high-priority images based on viewport
export const getHighPriorityImages = (): string[] => {
  const optimalWidth = getOptimalImageVariant();
  return [
    // About section (user will scroll to this first after hero)
    `${BASE_PATH}/optimized/about--${optimalWidth}.avif`,
    `${BASE_PATH}/optimized/about--${optimalWidth}.webp`,
  ];
};

// Helper function to generate medium-priority images (load in background)
// NOTE: Does NOT include about images (those are in Phase 2 high-priority)
export const getMediumPriorityImages = (): string[] => {
  const optimalWidth = getOptimalImageVariant();
  return [
    // Team sections (adjacent to About)
    `${BASE_PATH}/optimized/team1--${optimalWidth}.avif`,
    `${BASE_PATH}/optimized/team1--${optimalWidth}.webp`,
    `${BASE_PATH}/optimized/team2--${optimalWidth}.avif`,
    `${BASE_PATH}/optimized/team2--${optimalWidth}.webp`,
    // Offer section (next in scroll order)
    `${BASE_PATH}/optimized/offer--${optimalWidth}.avif`,
    `${BASE_PATH}/optimized/offer--${optimalWidth}.webp`,
    // Partners section
    `${BASE_PATH}/optimized/partners--${optimalWidth}.avif`,
    `${BASE_PATH}/optimized/partners--${optimalWidth}.webp`,
  ];
};

// Phase 3: LOW PRIORITY - Lazy load on-demand
// Load only when user scrolls near the section (via IntersectionObserver)
export const LOW_PRIORITY_PRELOAD_IMAGES = {
  // Cases section - load all case card images when user scrolls to Cases
  cases: [
    `${BASE_PATH}/cases-bg.png`,
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
  ],
};

// DEPRECATED: Use phase-based approach instead
// This is kept for backward compatibility
export const HOME_PRELOAD_IMAGE_PATHS: string[] = [
  // Loading screen + global background assets
  `${BASE_PATH}/loading-bg.jpg`,

  // Static sections backgrounds (optimized) - ALL WIDTHS
  // Old behavior: preload all 7 widths of each image
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

  // Cases cards
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
