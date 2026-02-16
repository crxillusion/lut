import { BASE_PATH } from '@/app/constants/config';

/**
 * Builds a URL for static assets.
 * - If NEXT_PUBLIC_ASSET_PREFIX is set (e.g. an R2 public domain), assets load from there.
 * - Otherwise falls back to Next's basePath + local /public.
 */
export function assetUrl(p: string): string {
  const prefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? '';
  const normalizedPath = p.startsWith('/') ? p : `/${p}`;

  if (prefix) {
    return `${prefix.replace(/\/+$/, '')}${normalizedPath}`;
  }

  return `${BASE_PATH}${normalizedPath}`;
}
