'use client';

import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createLogger, videoLogger } from '../utils/logger';
import { BASE_PATH } from '@/app/constants/config';

const staticLogger = createLogger('Static');

interface StaticSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  isTransitioning?: boolean; // Hide image while transition video is playing
  transitionVideoRef?: RefObject<HTMLVideoElement | null>;
  title?: string;
  content?: string;
  onBackClick?: () => void;
  frameOffsetFromEnd?: number; // Custom offset in seconds from video end (default: 0.05)
  imageSrc?: string;
}

export function StaticSection({
  videoRef,
  videoSrc,
  isVisible,
  isTransitioning = false,
  transitionVideoRef,
  title,
  content,
  onBackClick,
  frameOffsetFromEnd = 0.05, // Default to 50ms before end
  imageSrc,
}: StaticSectionProps) {
  // Prefer explicit `imageSrc`, otherwise fall back to a mapping based on the videoSrc.
  const resolvedImageSrc = useMemo(() => {
    if (imageSrc) return imageSrc;

    // NOTE: These matches are against the actual video filenames (lowercase).
    const byVideo: Array<{ match: string; img: string }> = [
      { match: 'aboutstarttoabout', img: '/about' },
      { match: 'abouttoteam', img: '/team1' },
      { match: 'teamtoteam', img: '/team2' },
      { match: 'teamtooffer', img: '/offer' },
      { match: 'offertopartner', img: '/partners' },
    ];

    const hay = (videoSrc || '').toLowerCase();
    const hit = byVideo.find(x => hay.includes(x.match));
    return hit?.img;
  }, [imageSrc, videoSrc]);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isBgReady, setIsBgReady] = useState(false);
  const [bgPainted, setBgPainted] = useState(false);
  const [imgShown, setImgShown] = useState(false);

  const srcBase = resolvedImageSrc; // e.g. "/about" or "/optimized/about"
  const isOptimizedBase = !!srcBase && srcBase.startsWith('/optimized/');

  const widths = [640, 960, 1280, 1600, 1920, 2560, 2920];
  const avifSrcSet = useMemo(() => {
    if (!srcBase) return '';
    const base = isOptimizedBase ? srcBase : `/optimized${srcBase}`;
    const basePath = `${BASE_PATH}${base}`;
    return widths.map(w => `${basePath}--${w}.avif ${w}w`).join(', ');
  }, [srcBase, isOptimizedBase]);

  const webpSrcSet = useMemo(() => {
    if (!srcBase) return '';
    const base = isOptimizedBase ? srcBase : `/optimized${srcBase}`;
    const basePath = `${BASE_PATH}${base}`;
    return widths.map(w => `${basePath}--${w}.webp ${w}w`).join(', ');
  }, [srcBase, isOptimizedBase]);

  // Track if the optimized image has been loaded at least once.
  const everReadyRef = useRef(false);

  const sectionName = useMemo(() => {
    const file = (videoSrc || '').split('/').pop() || 'unknown';
    return file;
  }, [videoSrc]);

  // Log visibility transitions and what asset we think we should show.
  useEffect(() => {
    staticLogger.debug(`[StaticSection ${sectionName}] visibility=${isVisible}`, {
      videoSrc,
      srcBase,
      isOptimizedBase,
      bgPainted,
    });
  }, [isVisible, sectionName, videoSrc, srcBase, isOptimizedBase, bgPainted]);

  // When becoming visible, snapshot the DOM so we can see if the <picture>/<img> exists.
  useEffect(() => {
    if (!isVisible) return;
    const pic = sectionRef.current?.querySelector('picture');
    const img = imgRef.current;
    const cs = img ? window.getComputedStyle(img) : null;

    staticLogger.debug(`[StaticSection ${sectionName}] enter snapshot`, {
      isTransitioning,
      imgShown,
      bgPainted,
      expectedOpacity: (imgShown && bgPainted) ? 1 : 0,
      hasPicture: !!pic,
      hasImg: !!img,
      imgSrc: img?.currentSrc || img?.getAttribute('src') || null,
      imgComplete: img ? img.complete : null,
      natural: img ? { w: img.naturalWidth, h: img.naturalHeight } : null,
      opacity: cs?.opacity ?? 'NULL',
      inlineOpacity: img?.style.opacity ?? 'NOT_SET',
      display: cs?.display ?? null,
      visibility: cs?.visibility ?? null,
      sectionClass: sectionRef.current?.getAttribute('class') ?? null,
    });

    // Also log one frame later.
    requestAnimationFrame(() => {
      const img2 = imgRef.current;
      const cs2 = img2 ? window.getComputedStyle(img2) : null;
      staticLogger.debug(`[StaticSection ${sectionName}] enter +1raf`, {
        isTransitioning,
        imgShown,
        bgPainted,
        expectedOpacity: (imgShown && bgPainted) ? 1 : 0,
        imgSrc: img2?.currentSrc || img2?.getAttribute('src') || null,
        imgComplete: img2 ? img2.complete : null,
        natural: img2 ? { w: img2.naturalWidth, h: img2.naturalHeight } : null,
        opacity: cs2?.opacity ?? 'NULL',
        inlineOpacity: img2?.style.opacity ?? 'NOT_SET',
      });
    });
  }, [isVisible, sectionName, isTransitioning, imgShown, bgPainted]);

  // Start image decoding immediately (not tied to visibility) so it's ready when the section becomes visible.
  // This eliminates the black blip when transitioning between sections.
  useEffect(() => {
    if (!srcBase) return;

    // Check if this image was already loaded before resetting state
    const wasAlreadyLoaded = everReadyRef.current;

    // Reset when changing to a new image (different srcBase) UNLESS it was already cached
    if (!wasAlreadyLoaded) {
      setBgPainted(false);
      setImgShown(false);
    }

    // If already loaded, show instantly and skip decode
    if (wasAlreadyLoaded) {
      // Use flushSync to ensure opacity is updated immediately before returning
      // This prevents a black flash when navigating to a cached image
      staticLogger.debug(`[StaticSection ${sectionName}] cache hit - flushing state`, { srcBase });
      flushSync(() => {
        setIsBgReady(true);
        setBgPainted(true);
        setImgShown(true);
      });
      staticLogger.debug(`[StaticSection ${sectionName}] cache hit - flushed`, { srcBase });
      return;
    }

    let cancelled = false;

    const url = `${BASE_PATH}${(isOptimizedBase ? srcBase : `/optimized${srcBase}`) + '--1280.webp'}`;
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

    const run = async () => {
      try {
        const pre = new Image();
        pre.decoding = 'async';
        pre.src = url;

        if (!pre.complete) {
          await new Promise<void>((resolve, reject) => {
            pre.onload = () => resolve();
            pre.onerror = () => reject(new Error('img load error'));
          });
        }

        if (typeof (pre as any).decode === 'function') {
          try {
            await (pre as any).decode();
          } catch {
            // ignore
          }
        }

        if (cancelled) return;

        // Give browser 2 frames to actually paint the decoded image.
        await new Promise<void>(r => requestAnimationFrame(() => r()));
        await new Promise<void>(r => requestAnimationFrame(() => r()));

        if (cancelled) return;

        everReadyRef.current = true;
        // Use flushSync to ensure opacity updates immediately after decode
        flushSync(() => {
          setIsBgReady(true);
          setBgPainted(true);
          setImgShown(true);
        });

        const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : 0) - t0);
        staticLogger.debug(`[StaticSection ${sectionName}] bg ready (+${ms}ms)`, { url });
      } catch {
        // On any error, just show what we have.
        if (cancelled) return;
        everReadyRef.current = true;
        flushSync(() => {
          setIsBgReady(true);
          setBgPainted(true);
          setImgShown(true);
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [srcBase, isOptimizedBase, sectionName]);

  // Parallax hover state
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetOffsetRef = useRef({ x: 0, y: 0 });

  const applyParallax = () => {
    rafRef.current = null;
    const el = imgRef.current;
    if (!el) return;

    const { x, y } = targetOffsetRef.current;
    // Translate opposite to cursor direction, plus a slight scale to avoid edge gaps.
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.03)`;
  };

  useEffect(() => {
    if (!isVisible) {
      // Reset transforms when hidden.
      targetOffsetRef.current = { x: 0, y: 0 };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (imgRef.current) imgRef.current.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
      return;
    }

    // Disable tilt/parallax on mobile screens.
    const isMobile =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches;

    if (isMobile) {
      // Ensure neutral transform on mobile.
      targetOffsetRef.current = { x: 0, y: 0 };
      if (imgRef.current) imgRef.current.style.transform = 'translate3d(0px, 0px, 0) scale(1.03)';
      return;
    }

    const el = sectionRef.current;
    if (!el) return;

    const MAX_PX = 14; // overall strength

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = rect.width ? (e.clientX - rect.left) / rect.width : 0.5; // 0..1
      const ny = rect.height ? (e.clientY - rect.top) / rect.height : 0.5;

      // Convert to -1..1, then invert so motion is opposite to cursor.
      const dx = (nx - 0.5) * 2;
      const dy = (ny - 0.5) * 2;

      const x = Math.max(-MAX_PX, Math.min(MAX_PX, -dx * MAX_PX));
      const y = Math.max(-MAX_PX, Math.min(MAX_PX, -dy * MAX_PX));

      targetOffsetRef.current = { x, y };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(applyParallax);
      }
    };

    const onLeave = () => {
      targetOffsetRef.current = { x: 0, y: 0 };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          if (imgRef.current) imgRef.current.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
        });
      }
    };

    // --- Mobile / tablet tilt support via DeviceOrientation ---
    // (Only enabled on non-mobile viewports; see gate above.)
    let orientationActive = false;
    let orientationCleanup: (() => void) | null = null;

    const installOrientation = () => {
      if (orientationActive) return;
      if (typeof window === 'undefined') return;
      if (typeof (window as any).DeviceOrientationEvent === 'undefined') return;

      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

      const onOrientation = (e: DeviceOrientationEvent) => {
        // gamma: left/right (-90..90)
        // beta: front/back (-180..180)
        const gamma = typeof e.gamma === 'number' ? e.gamma : 0;
        const beta = typeof e.beta === 'number' ? e.beta : 0;

        // Map to -1..1 range (cap to typical usable range)
        const nx = clamp(gamma / 25, -1, 1);
        const ny = clamp(beta / 25, -1, 1);

        // Opposite direction feel (same as cursor)
        const x = clamp(-nx * MAX_PX, -MAX_PX, MAX_PX);
        const y = clamp(-ny * MAX_PX, -MAX_PX, MAX_PX);

        targetOffsetRef.current = { x, y };
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(applyParallax);
        }
      };

      window.addEventListener('deviceorientation', onOrientation, true);
      orientationActive = true;
      orientationCleanup = () => {
        window.removeEventListener('deviceorientation', onOrientation, true);
      };
    };

    // iOS requires a user gesture to request permission.
    const tryEnableOrientationFromGesture = async () => {
      try {
        const DOE: any = (window as any).DeviceOrientationEvent;
        if (DOE && typeof DOE.requestPermission === 'function') {
          const res = await DOE.requestPermission();
          if (res === 'granted') installOrientation();
        } else {
          // Non-iOS: no permission API
          installOrientation();
        }
      } catch {
        // ignore
      }
    };

    // Try enabling immediately (Android/most browsers). If permission is required, it will no-op.
    installOrientation();

    // One-time gesture hook to enable orientation on iOS.
    let gestureBound = false;
    const bindGesture = () => {
      if (gestureBound) return;
      gestureBound = true;
      const onFirstTouch = () => {
        void tryEnableOrientationFromGesture();
        window.removeEventListener('touchstart', onFirstTouch);
      };
      window.addEventListener('touchstart', onFirstTouch, { passive: true });
    };
    bindGesture();

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (orientationCleanup) orientationCleanup();
      orientationCleanup = null;
    };
  }, [isVisible]);

  // Keep the hidden video for compatibility, but it should NOT control background visibility.
  // Video metadata/seek can be delayed during transitions, which caused a black screen.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      videoLogger.debug(
        `[StaticSection ${videoSrc.split('/').pop()}] Metadata loaded (image bg), duration=${video.duration.toFixed(3)}s`
      );

      // Best-effort seek so that leaving the section still has a stable last frame if anything references it.
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        const target = Math.max(0, video.duration - frameOffsetFromEnd);
        try {
          video.currentTime = target;
        } catch {
          // ignore
        }
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (video.readyState === 0) {
      try {
        video.load();
      } catch {
        // ignore
      }
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoRef, videoSrc, frameOffsetFromEnd]);

  // When the background becomes visible, animate a subtle scale-in even before mouse move.
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (!isVisible) return;

    const isMobile =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches;

    if (isMobile) {
      el.style.transition = 'opacity 300ms ease';
      el.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
      return;
    }

    if (isBgReady) {
      el.style.transition = 'transform 520ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms ease';
      el.style.transform = 'translate3d(0px, 0px, 0) scale(1.01)';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transform = 'translate3d(0px, 0px, 0) scale(1.03)';
        });
      });
    } else {
      el.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
    }
  }, [isBgReady, isVisible]);

  return (
    <section
      ref={sectionRef as any}
      className={`fixed inset-0 w-full h-screen ${
        isVisible ? 'z-20' : 'pointer-events-none z-0'
      }`}
    >
      {/* Deterministic base layer so we never flash a previous video frame.
          Use a subtle branded gradient instead of pure black to avoid a 'black blip' feel. */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(120% 120% at 20% 15%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.0) 42%), radial-gradient(110% 110% at 80% 85%, rgba(185,176,155,0.10) 0%, rgba(0,0,0,0.0) 48%), linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.86) 100%)',
          zIndex: 1,
        }}
      />

      {/* Very subtle noise to make the fallback read as intentional (optional). */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          opacity: 0.09,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2770%27 height=%2770%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%2770%27 height=%2770%27 filter=%27url(%23n)%27 opacity=%270.55%27/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/*
        Keep the transition video mounted for compatibility, but don't let it be visible.
        We use it only as a timing/seek target now.
      */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        playsInline
        muted
        preload="auto"
      />

      {/* Static background image (optimized AVIF/WebP)
          Keep it mounted even when section is hidden so it can load/finish decoding off-screen. */}
      {srcBase && (
        <picture className="absolute inset-0" style={{ pointerEvents: 'none', zIndex: 3 }}>
          <source type="image/avif" srcSet={avifSrcSet} sizes="100vw" />
          <source type="image/webp" srcSet={webpSrcSet} sizes="100vw" />
          <img
            ref={imgRef}
            alt=""
            decoding="async"
            loading="eager"
            fetchPriority="high"
            data-debug-visible={isVisible}
            data-debug-shown={imgShown}
            data-debug-painted={bgPainted}
            data-debug-opacity={isVisible && imgShown && bgPainted ? 1 : 0}
            src={`${BASE_PATH}${(isOptimizedBase ? srcBase : `/optimized${srcBase}`) + '--1280.webp'}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectFit: 'cover',
              willChange: 'transform, opacity',
              transform: 'translate3d(0px, 0px, 0) scale(1)',
              // Always show image once painted/shown - TransitionVideo covers it during transitions
              opacity: (imgShown && bgPainted) ? 1 : 0,
              transition: 'none',
            }}
            onLoad={() => {
              // If browser loads via cache and our decode gate hasn't run, still mark as ready.
              staticLogger.debug(`[StaticSection ${sectionName}] img onLoad`, { isVisible, imgShown, bgPainted, srcBase, avifSrcSetLength: avifSrcSet.length, webpSrcSetLength: webpSrcSet.length });
              everReadyRef.current = true;
              setIsBgReady(true);
            }}
            onError={() => {
              staticLogger.debug(`[StaticSection ${sectionName}] img onError`, { srcBase });
              everReadyRef.current = true;
              setIsBgReady(true);
            }}
          />
        </picture>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 h-full">
        {/* Optional Content - Centered */}
        {(title || content) && (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="max-w-4xl text-center text-white">
              {title && <h1 className="text-5xl md:text-7xl font-outfit font-bold mb-8">{title}</h1>}
              {content && (
                <p className="font-outfit font-medium text-[18px] leading-[150%] tracking-[-0.011em]">{content}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
