/**
 * AudioPool — module-level singleton
 *
 * Creates real HTMLAudioElement instances and calls .load() immediately so
 * the browser buffers the audio bytes into the element's own media cache.
 *
 * Mute state is controlled explicitly via audioPool.setMuted() — called only
 * when the user deliberately toggles the SoundToggle. On page load the pool
 * starts unmuted so navigation sounds play normally from the first scroll.
 */

const pool = new Map<string, HTMLAudioElement>();

// Starts false — sounds play until the user explicitly mutes.
let _muted = false;

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
  setMuted(muted: boolean, reason = 'unknown'): void {
    console.log(`[AudioPool] setMuted(${muted}) reason="${reason}" — was: ${_muted}`);
    _muted = muted;
  },

  isMuted(): boolean {
    return _muted;
  },

  prime(srcs: string[]): void {
    for (const src of srcs) {
      if (src) getOrCreate(src);
    }
  },

  play(src: string, volume = 0.5): void {
    if (typeof window === 'undefined') return;
    console.log(`[AudioPool] play() _muted=${_muted} src="${src.split('/').pop()}"`);
    if (_muted) return;

    const el = getOrCreate(src);
    el.volume = volume;

    const target: HTMLAudioElement =
      !el.paused && !el.ended ? (el.cloneNode() as HTMLAudioElement) : el;

    target.currentTime = 0;

    const promise = target.play();
    if (promise) {
      promise.catch((err: Error) => {
        console.warn(`[AudioPool] Could not play "${src}":`, err.message);
      });
    }
  },
};
