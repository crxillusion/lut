'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_PATH } from '../constants/config';

interface ShowreelSectionProps {
  isVisible: boolean;
  onBackClick?: () => void;
}

function toVimeoId(url: string) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1];
}

function vimeoEmbedUrl(id: string, { autoplay }: { autoplay: boolean }) {
  const auto = autoplay ? '1' : '0';
  // Always allow sound in Vimeo; we manage site music separately.
  return `https://player.vimeo.com/video/${id}?autoplay=${auto}&title=0&byline=0&portrait=0`;
}

type AudioSnapshot = { el: HTMLAudioElement; paused: boolean; volume: number };

export function ShowreelSection({ isVisible, onBackClick }: ShowreelSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const frameOverlayRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = useRef(false);

  // Frame readiness: keep mounted early, but only fade in once we're sure it has painted.
  const [frameReady, setFrameReady] = useState(false);

  // Vimeo: do not autoplay; user must press play.
  const [userStarted, setUserStarted] = useState(false);

  const audioSnapshotRef = useRef<AudioSnapshot[] | null>(null);

  // Window rect is calculated dynamically based on how the PNG renders
  // The calculation adapts to all viewport sizes and aspect ratios
  const [windowRect, setWindowRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const everReadyRef = useRef(false);

  // Start decoding the frame PNG immediately (not tied to visibility) so it's ready before navigation.
  // This matches StaticSection's approach for seamless transitions.
  useEffect(() => {
    const el = frameImgRef.current;
    if (!el) return;

    // If already loaded, mark ready immediately
    if (everReadyRef.current) {
      // Use microtask to avoid flushSync in effect error
      queueMicrotask(() => setFrameReady(true));
      return;
    }

    let cancelled = false;

    const decodeFrame = async () => {
      try {
        if (typeof (el as any).decode === 'function') {
          await (el as any).decode();
        }
      } catch {
        // ignore
      }

      // Wait 2 frames for paint
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      await new Promise<void>(r => requestAnimationFrame(() => r()));

      if (!cancelled) {
        everReadyRef.current = true;
        // Use microtask to avoid flushSync in effect error
        queueMicrotask(() => setFrameReady(true));
      }
    };

    // Start decoding if image is already loaded
    if (el.complete && el.naturalWidth > 0) {
      void decodeFrame();
    } else {
      // Wait for image to load first
      const onLoad = () => {
        void decodeFrame();
        el.removeEventListener('load', onLoad);
      };
      el.addEventListener('load', onLoad);
      return () => {
        el.removeEventListener('load', onLoad);
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Show the frame immediately when section becomes visible (seamless transition from video)
  useEffect(() => {
    if (!isVisible) {
      setFrameReady(false);
    } else if (everReadyRef.current) {
      // Frame is already decoded, show immediately
      // Use microtask to avoid flushSync in effect error
      queueMicrotask(() => setFrameReady(true));
    }
  }, [isVisible]);

  // Derive the iframe window rect from the *rendered* frame image.
  useEffect(() => {
    if (!isVisible) return;
    const img = frameImgRef.current;
    if (!img) return;

    const update = () => {
      const r = img.getBoundingClientRect();
      const pngNaturalWidth = (img as any).naturalWidth;
      const pngNaturalHeight = (img as any).naturalHeight;
      
      // For object-fit: cover, calculate the actual scale and offset
      const containerAR = r.width / r.height;
      const pngAR = pngNaturalWidth / pngNaturalHeight; // 1920/1920 = 1
      
      let imgDisplayWidth: number;
      let imgDisplayHeight: number;
      let imgOffsetX: number;
      let imgOffsetY: number;
      
      if (containerAR > pngAR) {
        // Container is wider than PNG (in aspect ratio) - scale to width
        imgDisplayWidth = r.width;
        imgDisplayHeight = r.width / pngAR;
        imgOffsetX = 0;
        imgOffsetY = (r.height - imgDisplayHeight) / 2; // center vertically
      } else {
        // Container is taller than PNG (in aspect ratio) - scale to height
        imgDisplayHeight = r.height;
        imgDisplayWidth = r.height * pngAR;
        imgOffsetX = (r.width - imgDisplayWidth) / 2; // center horizontally
        imgOffsetY = 0;
      }
      
      // PNG transparent area in PNG space
      const pngTransparent = {
        left: 397,
        top: 645,
        width: 1126,
        height: 633,
      };
      
      // Calculate where the transparent area appears on screen
      // The transparent area is at (397, 645) in the PNG
      // When the PNG is displayed at imgDisplaySize starting at imgOffset, the transparent area maps to:
      const scale = imgDisplayWidth / pngNaturalWidth; // or imgDisplayHeight / pngNaturalHeight, should be same
      
      const transparentScreenX = r.left + imgOffsetX + pngTransparent.left * scale;
      const transparentScreenY = r.top + imgOffsetY + pngTransparent.top * scale;
      const transparentScreenWidth = pngTransparent.width * scale;
      const transparentScreenHeight = pngTransparent.height * scale;
      
      // Calculate aspect-ratio-aware insets for the video window
      // These insets define how much padding to leave around the video within the transparent area
      // Calibrated to produce perfect fit: left: 360px, top: 43px, width: 1200px, height: 632px for 1920x720
      const videoContainerAR = r.width / r.height;
      
      let containerInsets = {
        left: -0.0328,  // Expand left by ~37px
        right: -0.0329, // Expand right by ~37px
        top: -0.0032,   // Shift up by ~2px
        bottom: 0.0048, // Minimal bottom padding
      };
      
      // For ultrawide, reduce insets to maximize video size
      if (videoContainerAR > 2.5) {
        containerInsets.left *= 0.5;
        containerInsets.right *= 0.5;
      } else if (videoContainerAR > 1.9) {
        containerInsets.left *= 0.7;
        containerInsets.right *= 0.7;
      }
      
      // Apply insets within the transparent area to get the video window
      const windowScreenX = transparentScreenX + transparentScreenWidth * containerInsets.left;
      const windowScreenY = transparentScreenY + transparentScreenHeight * containerInsets.top;
      const windowScreenWidth = transparentScreenWidth * (1 - containerInsets.left - containerInsets.right);
      const windowScreenHeight = transparentScreenHeight * (1 - containerInsets.top - containerInsets.bottom);
      
      // Convert to local section coordinates
      const section = sectionRef.current;
      const sr = section?.getBoundingClientRect();
      
      let local = {
        left: Math.round(windowScreenX - (sr?.left || 0)),
        top: Math.round(windowScreenY - (sr?.top || 0)),
        width: Math.round(windowScreenWidth),
        height: Math.round(windowScreenHeight),
      };
      
      setWindowRect(local);
    };

    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(() => update());
    ro.observe(img);

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [isVisible]);

  // Reset play state when leaving the showreel section.
  useEffect(() => {
    if (isVisible) return;
    setUserStarted(false);
    setFrameReady(false);

    // If we had muted site audio, restore it.
    const snapshots = audioSnapshotRef.current;
    if (snapshots) {
      snapshots.forEach(({ el, paused, volume }) => {
        try {
          el.volume = volume;
          if (!paused) void el.play().catch(() => {});
        } catch {
          // ignore
        }
      });
    }
    audioSnapshotRef.current = null;
  }, [isVisible]);

  const vimeoId = useMemo(() => toVimeoId('https://vimeo.com/1164666738?fl=pl&fe=sh'), []);
  const vimeoSrc = useMemo(() => {
    if (!vimeoId) return '';
    return vimeoEmbedUrl(vimeoId, { autoplay: userStarted });
  }, [userStarted, vimeoId]);

  const muteSiteAudio = () => {
    if (typeof document === 'undefined') return;
    const audios = Array.from(document.querySelectorAll<HTMLAudioElement>('audio[data-bg-audio="true"]'));
    audioSnapshotRef.current = audios.map(a => ({ el: a, paused: a.paused, volume: a.volume }));

    audios.forEach(a => {
      try {
        a.volume = 0;
        a.pause();
      } catch {
        // ignore
      }
    });
  };

  const handleStart = () => {
    // User intent to play the showreel: mute site music now.
    if (!userStarted) {
      muteSiteAudio();
      setUserStarted(true);
    }
  };

  return (
    <section
      ref={sectionRef as any}
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      {/* Always-painted fallback behind the frame (prevents 1-frame flash on first paint). */}
      <div className="absolute inset-0 bg-black" aria-hidden />

      {/* Vimeo constrained to the frame window */}
      <div className="absolute inset-0">
        {vimeoSrc && windowRect && (
          <div
            className="absolute overflow-hidden"
            style={{
              left: windowRect.left,
              top: windowRect.top,
              width: windowRect.width,
              height: windowRect.height,
            }}
          >
            <iframe
              className="absolute inset-0 w-full h-full"
              src={vimeoSrc}
              allow="autoplay; fullscreen; picture-in-picture"
              title="Showreel"
            />
          </div>
        )}
        <AnimatePresence>
          {isVisible && !userStarted && (
            <motion.button
              type="button"
              onClick={handleStart}
              className="absolute inset-0 z-[5] flex items-center justify-center bg-black/20 backdrop-blur-[0.5px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              aria-label="Play showreel"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-[82px] h-[82px] rounded-full border border-white/70 bg-black/25 flex items-center justify-center">
                  <div
                    className="ml-[5px]"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: '14px solid transparent',
                      borderBottom: '14px solid transparent',
                      borderLeft: '22px solid rgba(255,255,255,0.92)',
                    }}
                  />
                </div>
                <div className="font-outfit font-bold text-white tracking-[0.35em] text-[12px] md:text-[13px]">
                  PLAY SHOWREEL
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/*
        Frame overlay is ALWAYS mounted so it can be painted/ready before the
        section becomes visible. Shows immediately when visible (no fade).
      */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div
          ref={frameOverlayRef}
          className="absolute inset-0"
          style={{
            // Show immediately when section is visible - frameReady gate is just for appearance quality
            opacity: isVisible ? 1 : 0,
            filter: isVisible ? 'blur(0px)' : 'blur(10px)',
            // No transition: image appears immediately
            transition: 'none',
          }}
        >
          <Image
            ref={frameImgRef as any}
            src={`${BASE_PATH}/Showreel_png_transparent.png`}
            alt="Showreel frame"
            fill
            priority
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>
      </div>

      {/* Optional back click area (if you want an in-screen back besides overlay UI) */}
      {onBackClick && (
        <button
          type="button"
          aria-label="Back"
          onClick={onBackClick}
          className="absolute top-4 left-4 z-20 text-white/0"
        />
      )}
    </section>
  );
}
