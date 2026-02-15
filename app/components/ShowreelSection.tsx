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
  const frameImgRef = useRef<HTMLImageElement | null>(null);

  // Frame readiness: keep mounted early, but only fade in once we're sure it has painted.
  const [frameReady, setFrameReady] = useState(false);

  // Vimeo: do not autoplay; user must press play.
  const [userStarted, setUserStarted] = useState(false);

  const audioSnapshotRef = useRef<AudioSnapshot[] | null>(null);

  // When section is shown, wait until the frame image has loaded+decoded
  // and has had a chance to paint before animating its opacity.
  useEffect(() => {
    if (!isVisible) return;

    setFrameReady(false);

    const el = frameImgRef.current;
    if (!el) return;

    let cancelled = false;

    const markReadyAfterPaint = async () => {
      // If possible, wait for image decode, then wait 2 rAFs for paint.
      try {
        if (typeof (el as any).decode === 'function') {
          await (el as any).decode();
        }
      } catch {
        // ignore
      }

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      if (!cancelled) setFrameReady(true);
    };

    const onLoad = () => void markReadyAfterPaint();

    if (el.complete && el.naturalWidth > 0) {
      void markReadyAfterPaint();
    } else {
      el.addEventListener('load', onLoad);
    }

    return () => {
      cancelled = true;
      el.removeEventListener('load', onLoad);
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
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      {/* Vimeo background */}
      <div className="absolute inset-0">
        {vimeoSrc && (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={vimeoSrc}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Showreel"
          />
        )}

        {/* Click overlay to start playback (no autoplay). */}
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
        section becomes visible. We only animate opacity when `isVisible` AND
        the underlying <img> has loaded/decoded and had time to paint.
      */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={
            isVisible && frameReady
              ? { opacity: 1, filter: 'blur(0px)' }
              : { opacity: 0, filter: 'blur(10px)' }
          }
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
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
        </motion.div>
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
