/**
 * Builds a URL for static assets.
 *
 * R2 bucket key structure (mirrors upload scripts):
 *   videos/*   → uploaded by upload-r2-videos.mjs  → CDN: <prefix>/videos/*
 *   audios/*   → uploaded by upload-r2-audios.mjs  → CDN: <prefix>/audios/*
 *   everything else → upload-r2-images.mjs         → CDN: <prefix>/images/*
 *
 * In local dev (no NEXT_PUBLIC_ASSET_PREFIX set) images/SVGs are served from
 * /public directly, so no sub-prefix is added.
 *
 * Note: <img>, <video>, <audio> src and new Image() are NOT subject to CORS.
 */

const R2_PUBLIC = 'https://pub-d2e341ccd5fc4ac59f6cce5ff14c3ead.r2.dev';

// Paths served directly from their own R2 prefix (not under /images/)
const NON_IMAGE = /^\/(videos|audios)\//i;

function normalizePrefix(prefix: string) {
  return prefix.trim().replace(/\/+$/, '');
}

export function assetUrl(p: string): string {
  const normalizedPath = p.startsWith('/') ? p : `/${p}`;
  const cdnPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX
    ? normalizePrefix(process.env.NEXT_PUBLIC_ASSET_PREFIX)
    : null;

  if (NON_IMAGE.test(normalizedPath)) {
    // Videos & audio: <cdn>/videos/... or <cdn>/audios/...
    // Always need R2 — they're never in /public
    const base = cdnPrefix ?? normalizePrefix(R2_PUBLIC);
    return `${base}${normalizedPath}`;
  }

  // Images / SVGs / etc.
  if (cdnPrefix) {
    // On CDN they live under the /images/ sub-prefix
    return `${cdnPrefix}/images${normalizedPath}`;
  }

  // Local dev — serve directly from /public (relative path, no prefix)
  return normalizedPath;
}
