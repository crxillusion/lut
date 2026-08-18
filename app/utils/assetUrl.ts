/**
 * Builds a URL for static assets.
 *
 * - Videos (/videos/*) and audio (/audios/*) live exclusively on R2 — always use R2.
 * - All other assets (images, SVGs, etc.) use NEXT_PUBLIC_ASSET_PREFIX if set (CI/Netlify),
 *   otherwise fall back to a relative path so local /public is used in dev.
 *
 * Note: <img>, <video>, <audio> src and new Image() are NOT subject to CORS.
 * Only fetch()/XHR to cross-origin URLs requires CORS headers — we don't use fetch() for assets.
 */

const R2_PUBLIC = 'https://pub-d2e341ccd5fc4ac59f6cce5ff14c3ead.r2.dev';

// Paths that only exist on R2, never in /public
const R2_ONLY = /^\/(videos|audios)\//i;

function normalizePrefix(prefix: string) {
  return prefix.trim().replace(/\/+$/, '');
}

export function assetUrl(p: string): string {
  const normalizedPath = p.startsWith('/') ? p : `/${p}`;

  // Videos & audio always come from R2 regardless of environment
  if (R2_ONLY.test(normalizedPath)) {
    const r2Prefix = normalizePrefix(process.env.NEXT_PUBLIC_ASSET_PREFIX || R2_PUBLIC);
    return `${r2Prefix}${normalizedPath}`;
  }

  // Images/SVGs/etc: use explicit prefix in CI/prod, otherwise serve locally
  const rawPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX;
  if (rawPrefix) {
    return `${normalizePrefix(rawPrefix)}${normalizedPath}`;
  }

  // Local dev — serve from /public directly (no prefix = relative path)
  return normalizedPath;
}
