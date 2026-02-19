import { BASE_PATH } from '@/app/constants/config';

/**
 * Builds a URL for static assets.
 * - If NEXT_PUBLIC_ASSET_PREFIX is set (e.g. an R2 public domain), assets load from there.
 * - Otherwise falls back to Next's basePath + local /public.
 */

function normalizePrefix(prefix: string) {
  // Trim whitespace and trailing slashes for stable URL joining.
  return prefix.trim().replace(/\/+$/, '');
}

export function assetUrl(p: string): string {
  const rawPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX;
  const isLocalhost =
    process.env.NODE_ENV === 'development' &&
    (process.env.NEXT_PUBLIC_VERCEL_ENV === undefined || process.env.NEXT_PUBLIC_VERCEL_ENV === 'development');

  // In local dev, default to R2 if no explicit prefix is set.
  // This prevents having to keep large videos in /public/videos during development.
  const effectivePrefix = rawPrefix || (isLocalhost ? 'https://pub-d2e341ccd5fc4ac59f6cce5ff14c3ead.r2.dev' : '');
  const prefix = effectivePrefix ? normalizePrefix(effectivePrefix) : '';
  const normalizedPath = p.startsWith('/') ? p : `/${p}`;

  if (prefix) {
    return `${prefix}${normalizedPath}`;
  }

  return `${BASE_PATH}${normalizedPath}`;
}
