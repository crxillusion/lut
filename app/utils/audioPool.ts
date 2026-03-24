/**
 * AudioPool — module-level singleton
 *
 * Creates real HTMLAudioElement instances and calls .load() immediately so
 * the browser buffers the audio bytes into the element's own media cache.
 * This avoids the CDN round-trip that `new Audio(src).play()` would incur at
 * click time (fetch() only warms the HTTP cache, which is NOT shared with
 * HTMLAudioElement's internal media pipeline).
 *
 * Usage:
 *   audioPool.prime(['url1', 'url2'])   — call once during preload
 *   audioPool.play('url1')              — call at click time; plays immediately
 */

const pool = new Map<string, HTMLAudioElement>();

function getOrCreate(src: string): HTMLAudioElement {
  let el = pool.get(src);
  if (!el) {
    el = new Audio(src);
    el.preload = 'auto';
    el.volume = 0.5;
    el.load();
    pool.set(src, el);
  }
  return el;
}

export const audioPool = {
  /**
   * Prime one or more audio URLs. Safe to call multiple times — already-primed
   * URLs are no-ops.
   */
  prime(srcs: string[]): void {
    for (const src of srcs) {
      if (src) getOrCreate(src);
    }
  },

  /**
   * Play a previously-primed audio URL.
   *
   * If the element is already playing (e.g. rapid double-click) we clone it so
   * both instances play concurrently without interrupting each other. The clone
   * is discarded after playback ends.
   *
   * Falls back to creating a fresh element if the URL was never primed.
   */
  play(src: string, volume = 0.5): void {
    if (typeof window === 'undefined') return;

    const el = getOrCreate(src);
    el.volume = volume;

    // If the element is not yet ended/paused, clone it for concurrent playback.
    const target: HTMLAudioElement =
      !el.paused && !el.ended ? (el.cloneNode() as HTMLAudioElement) : el;

    // Rewind so it plays from the start each time.
    target.currentTime = 0;

    const promise = target.play();
    if (promise) {
      promise.catch((err: Error) => {
        // Autoplay policy or network error — non-fatal
        console.warn(`[AudioPool] Could not play "${src}":`, err.message);
      });
    }
  },
};
