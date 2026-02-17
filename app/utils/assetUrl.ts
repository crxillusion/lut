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
  const prefix = rawPrefix ? normalizePrefix(rawPrefix) : '';
  const normalizedPath = p.startsWith('/') ? p : `/${p}`;

  if (prefix) {
    return `${prefix}${normalizedPath}`;
  }

  return `${BASE_PATH}${normalizedPath}`;
}
