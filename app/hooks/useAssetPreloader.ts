import { useEffect, useMemo, useRef, useState } from 'react';
import { createLogger } from '../utils/logger';

const assetLogger = createLogger('Assets');

type AssetPreloaderOptions = {
  /**
   * If true, the hook preloads `immediate` assets and then schedules `background` assets.
   * If false, nothing is loaded.
   */
  enabled: boolean;

  /**
   * Assets that must be requested during the loading screen.
   */
  immediate: string[];

  /**
   * Assets to request after the UI is already interactive.
   */
  background?: string[];

  /** Max number of concurrent immediate requests. Defaults to 6. */
  immediateConcurrency?: number;

  /** Per-asset timeout (ms) for immediate assets. Defaults to 15000. */
  immediateTimeoutMs?: number;
};

export function useAssetPreloader({
  enabled,
  immediate,
  background = [],
  immediateConcurrency = 6,
  immediateTimeoutMs = 15000,
}: AssetPreloaderOptions) {
  const [immediateDone, setImmediateDone] = useState(false);

  // Normalize arrays so dependency changes are based on content, not identity.
  const uniqueImmediate = useMemo(
    () => Array.from(new Set(immediate)).filter(Boolean),
    [immediate]
  );
  const uniqueBg = useMemo(
    () => Array.from(new Set(background)).filter(Boolean),
    [background]
  );

  // Ensure background warm only runs once per distinct list.
  const lastBgKeyRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    let isCancelled = false;

    assetLogger.info(`Immediate image preload: ${uniqueImmediate.length} asset(s)`);

    const total = uniqueImmediate.length;

    if (total === 0) {
      assetLogger.debug('Immediate image preload: nothing to do');
      setImmediateDone(true);
      return;
    }

    const startAt = performance.now();

    let resolvedCount = 0;
    let cursor = 0;

    const timers: number[] = [];

    const resolveOne = (ok: boolean, src: string, reason?: string) => {
      resolvedCount += 1;
      assetLogger.debug(
        `${ok ? '✅' : '❌'} immediate ${resolvedCount}/${total}: ${src}${reason ? ` (${reason})` : ''}`
      );

      if (!isCancelled && resolvedCount >= total) {
        const ms = Math.round(performance.now() - startAt);
        assetLogger.info(`Immediate image preload complete in ${ms}ms`);
        setImmediateDone(true);
      }
    };

    const runNext = () => {
      if (isCancelled) return;
      if (cursor >= total) return;

      const src = uniqueImmediate[cursor++];

      // Use fetch first to get bytes flowing ASAP (doesn't wait for decode).
      // Then also create an Image() to populate the image cache.
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

      let settled = false;
      const settle = (ok: boolean, reason?: string) => {
        if (settled) return;
        settled = true;
        resolveOne(ok, src, reason);
        runNext();
      };

      const timeoutId = window.setTimeout(() => {
        try {
          controller?.abort();
        } catch {
          // ignore
        }
        settle(false, 'timeout');
      }, immediateTimeoutMs);
      timers.push(timeoutId);

      // Kick off request
      fetch(src, {
        cache: 'force-cache',
        signal: controller?.signal,
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          // Read the body so the browser actually downloads it.
          return r.blob();
        })
        .then(() => {
          // Also warm the image decode/cache path.
          const img = new Image();
          img.decoding = 'async';
          img.loading = 'eager';

          const isCriticalOverlay = /\/((Cases|Showreel)_png_transparent)\.png$/i.test(src);
          const isOptimizedStaticBg = /\/optimized\/.+--\d+\.(avif|webp)$/i.test(src);

          return new Promise<void>((resolve) => {
            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              resolve();
            };

            // Safety timeout so preloading can't hang forever.
            const decodeTimeout = window.setTimeout(() => finish(), 2500);

            const warmRaster = () => {
              // Try to force a raster/upload by drawing once.
              // This helps avoid a black blip when the image is first painted full-screen.
              try {
                const w = (img as any).naturalWidth || 0;
                const h = (img as any).naturalHeight || 0;
                if (w > 0 && h > 0) {
                  const canvas = document.createElement('canvas');
                  canvas.width = Math.min(64, w);
                  canvas.height = Math.min(64, h);
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
              } catch {
                // ignore
              }
            };

            img.onload = async () => {
              window.clearTimeout(decodeTimeout);
              const shouldDecode =
                (isCriticalOverlay || isOptimizedStaticBg) && typeof (img as any).decode === 'function';
              if (shouldDecode) {
                try {
                  await (img as any).decode();
                } catch {
                  // ignore decode errors
                }
              }

              if (isCriticalOverlay || isOptimizedStaticBg) {
                warmRaster();
              }

              finish();
            };
            img.onerror = () => {
              window.clearTimeout(decodeTimeout);
              finish();
            };

            img.src = src;
          });
        })
        .then(() => {
          // Consider it done once bytes are fetched (and for critical overlays, decoded).
          settle(true);
        })
        .catch((e) => {
          assetLogger.warn(`Immediate fetch failed: ${src}`, e);
          settle(false, 'fetch_error');
        })
        .finally(() => {
          window.clearTimeout(timeoutId);
        });
    };

    const initial = Math.max(1, Math.min(immediateConcurrency, total));
    assetLogger.debug(`Immediate image preload: starting with concurrency=${initial}`);
    for (let i = 0; i < initial; i += 1) runNext();

    return () => {
      isCancelled = true;
      timers.forEach(t => window.clearTimeout(t));
    };
  }, [
    enabled,
    uniqueImmediate,
    immediateConcurrency,
    immediateTimeoutMs,
  ]);

  // Fire-and-forget background warm.
  // IMPORTANT: No cleanup/cancellation — these are intentional fire-and-forget requests.
  // Cancelling them on re-render is what caused images to never load (stagger timers
  // were wiped before they fired, and the dedup guard then blocked re-scheduling).
  useEffect(() => {
    if (!enabled) return;
    if (!immediateDone) return;

    const bgKey = uniqueBg.join('|');
    if (bgKey && lastBgKeyRef.current === bgKey) {
      assetLogger.debug('Background image warm: skipping (already requested this set)');
      return;
    }
    lastBgKeyRef.current = bgKey;

    assetLogger.info(`Background image warm: ${uniqueBg.length} asset(s)`);
    if (uniqueBg.length === 0) return;

    // Fire all requests immediately — no stagger. The browser manages its own
    // connection pool (typically 6 concurrent per host), so there's no benefit
    // to artificial staggering, and it risks images not loading before the user
    // reaches the section if the component re-renders and cleanup fires.
    uniqueBg.forEach((src) => {
      assetLogger.debug(`↪️ background request: ${src}`);
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = src;
    });

    // No cleanup — these Image() loads are fire-and-forget and must not be
    // cancelled when the component re-renders.
  }, [enabled, immediateDone, uniqueBg]);

  return { immediateDone };
}
