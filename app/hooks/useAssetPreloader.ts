import { useEffect, useState } from 'react';
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

  /** Optional per-asset delay for background assets (ms). */
  backgroundStaggerMs?: number;
};

export function useAssetPreloader({
  enabled,
  immediate,
  background = [],
  backgroundStaggerMs = 250,
}: AssetPreloaderOptions) {
  const [immediateDone, setImmediateDone] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let isCancelled = false;

    const uniqueImmediate = Array.from(new Set(immediate)).filter(Boolean);
    assetLogger.info(`Immediate image preload: ${uniqueImmediate.length} asset(s)`);

    let resolvedCount = 0;
    const total = uniqueImmediate.length;

    if (total === 0) {
      assetLogger.debug('Immediate image preload: nothing to do');
      setImmediateDone(true);
      return;
    }

    const startAt = performance.now();

    const imgEls: HTMLImageElement[] = [];

    uniqueImmediate.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';

      const done = (ok: boolean) => {
        resolvedCount += 1;
        assetLogger.debug(
          `${ok ? '✅' : '❌'} immediate ${resolvedCount}/${total}: ${src}`
        );

        if (!isCancelled && resolvedCount >= total) {
          const ms = Math.round(performance.now() - startAt);
          assetLogger.info(`Immediate image preload complete in ${ms}ms`);
          setImmediateDone(true);
        }
        cleanup();
      };

      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => done(true);
      img.onerror = () => done(false);
      img.src = src;
      imgEls.push(img);
    });

    return () => {
      isCancelled = true;
      imgEls.length = 0;
    };
  }, [enabled, immediate]);

  // Fire-and-forget background warm.
  useEffect(() => {
    if (!enabled) return;
    if (!immediateDone) return;

    const uniqueBg = Array.from(new Set(background)).filter(Boolean);
    assetLogger.info(`Background image warm: ${uniqueBg.length} asset(s)`);
    if (uniqueBg.length === 0) return;

    const timers: number[] = [];
    const imgEls: HTMLImageElement[] = [];

    uniqueBg.forEach((src, idx) => {
      const t = window.setTimeout(() => {
        assetLogger.debug(`↪️ background request: ${src}`);
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = src;
        imgEls.push(img);
      }, idx * backgroundStaggerMs);
      timers.push(t);
    });

    return () => {
      timers.forEach(t => window.clearTimeout(t));
      imgEls.length = 0;
    };
  }, [enabled, immediateDone, background, backgroundStaggerMs]);

  return { immediateDone };
}
