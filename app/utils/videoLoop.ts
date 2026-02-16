// Video loop speed-up utility (DEPRECATED)
//
// This project previously used loop speed-up + loop-complete detection to delay
// transitions until a looped background video ended. That behavior has been
// removed in favor of immediate transitions.
//
// Kept as a backwards-compatible no-op stub for any stale imports.
import { RefObject } from 'react';

export interface LoopSpeedUpConfig {
  videoRef: RefObject<HTMLVideoElement | null>;
  speedMultiplier?: number;
  onLoopComplete: () => void;
  onProgress?: (current: number, duration: number) => void;
  earlyCompleteSeconds?: number;
}

export function speedUpVideoLoop({ onLoopComplete }: LoopSpeedUpConfig): () => void {
  // Immediately signal completion. No speed changes.
  try {
    onLoopComplete();
  } catch {
    // ignore
  }

  return () => {};
}
