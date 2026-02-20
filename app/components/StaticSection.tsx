import { RefObject, useEffect, useRef, useState } from 'react';
import { videoLogger } from '../utils/logger';

interface StaticSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  title?: string;
  content?: string;
  onBackClick?: () => void;
  frameOffsetFromEnd?: number; // Custom offset in seconds from video end (default: 0.05)
}

export function StaticSection({ 
  videoRef, 
  videoSrc, 
  isVisible,
  title,
  content,
  frameOffsetFromEnd = 0.05 // Default to 50ms before end
}: StaticSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFrameCaptured, setIsFrameCaptured] = useState(false);
  const captureAttemptedRef = useRef(false);
  const targetTimeRef = useRef<number>(0);

  // Parallax hover state
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetOffsetRef = useRef({ x: 0, y: 0 });

  const applyParallax = () => {
    rafRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = targetOffsetRef.current;
    // Translate opposite to cursor direction, plus a slight scale to avoid edge gaps.
    canvas.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.03)`;
  };

  useEffect(() => {
    if (!isVisible) {
      // Reset transforms when hidden.
      targetOffsetRef.current = { x: 0, y: 0 };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (canvasRef.current) canvasRef.current.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
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
      if (canvasRef.current) canvasRef.current.style.transform = 'translate3d(0px, 0px, 0) scale(1.03)';
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
          if (canvasRef.current) canvasRef.current.style.transform = 'translate3d(0px, 0px, 0) scale(1.03)';
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

  // Capture the last frame to canvas
  useEffect(() => {
    if (videoRef.current && canvasRef.current && !captureAttemptedRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      let seekTimeout: NodeJS.Timeout | null = null;
      
      const captureFrame = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          // Keep original framing: match the canvas coordinate space to the video frame.
          // Improve sharpness on retina by scaling the backing store by DPR.
          const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;

          canvas.width = Math.round(video.videoWidth * dpr);
          canvas.height = Math.round(video.videoHeight * dpr);

          // Draw in "video pixel" units; DPR scaling is handled by the transform.
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

          setIsFrameCaptured(true);
          captureAttemptedRef.current = true;
          
          videoLogger.debug(
            `[StaticSection ${videoSrc.split('/').pop()}] Frame captured at ${video.currentTime.toFixed(3)}s / ${video.duration.toFixed(3)}s`,
            {
              video: { w: video.videoWidth, h: video.videoHeight },
              canvas: { w: canvas.width, h: canvas.height, dpr },
            }
          );
        }
      };
      
      const seekToLastFrame = () => {
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          targetTimeRef.current = video.duration - frameOffsetFromEnd;
          video.currentTime = targetTimeRef.current;
          
          videoLogger.debug(
            `[StaticSection ${videoSrc.split('/').pop()}] Seeking to ${targetTimeRef.current.toFixed(3)}s (offset: ${frameOffsetFromEnd}s)`
          );
          
          // Fallback: if seeked event doesn't fire within 500ms, try capturing anyway
          seekTimeout = setTimeout(() => {
            videoLogger.debug(
              `[StaticSection ${videoSrc.split('/').pop()}] Seek timeout; capturing current frame`
            );
            captureFrame();
          }, 500);
        }
      };
      
      const handleSeeked = () => {
        if (seekTimeout) {
          clearTimeout(seekTimeout);
          seekTimeout = null;
        }
        
        videoLogger.debug(
          `[StaticSection ${videoSrc.split('/').pop()}] Seeked currentTime=${video.currentTime.toFixed(3)}s target=${targetTimeRef.current.toFixed(3)}s`
        );
        
        // Verify we're at the right time
        const timeDiff = Math.abs(video.currentTime - targetTimeRef.current);
        if (timeDiff > 0.1) {
          videoLogger.debug(
            `[StaticSection ${videoSrc.split('/').pop()}] Seek mismatch; retrying`
          );
          // Try seeking again
          video.currentTime = targetTimeRef.current;
          return;
        }
        
        // Wait a frame to ensure the video frame is actually rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            captureFrame();
          });
        });
      };
      
      const handleLoadedMetadata = () => {
        videoLogger.debug(
          `[StaticSection ${videoSrc.split('/').pop()}] Metadata loaded, duration=${video.duration.toFixed(3)}s`
        );
        if (video.duration) {
          seekToLastFrame();
        }
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('seeked', handleSeeked);
      
      // Check if already loaded
      if (video.readyState >= 1 && video.duration && !captureAttemptedRef.current) {
        videoLogger.debug(
          `[StaticSection ${videoSrc.split('/').pop()}] Video already loaded`
        );
        seekToLastFrame();
      } else if (video.readyState === 0) {
        video.load();
      }
      
      return () => {
        if (seekTimeout) clearTimeout(seekTimeout);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
      };
    }
  }, [videoRef, videoSrc, frameOffsetFromEnd]);
  
  // Reset capture state when video source changes
  useEffect(() => {
    captureAttemptedRef.current = false;
    // Use setTimeout to avoid setState during render
    const timer = setTimeout(() => {
      setIsFrameCaptured(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [videoSrc]);

  // When the canvas becomes visible, animate a subtle scale-in even before mouse move.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!isVisible) return;

    const isMobile =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches;

    if (isMobile) {
      // No scaling/tilt on mobile.
      canvas.style.transition = 'opacity 300ms ease';
      canvas.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
      return;
    }

    if (isFrameCaptured) {
      // Start slightly smaller, then animate up to the base scale.
      canvas.style.transition = 'transform 520ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms ease';
      canvas.style.transform = 'translate3d(0px, 0px, 0) scale(1.01)';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Base state for parallax (with slight overscale to avoid edges)
          canvas.style.transform = 'translate3d(0px, 0px, 0) scale(1.03)';
        });
      });
    } else {
      // While not captured yet, keep at neutral.
      canvas.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
    }
  }, [isFrameCaptured, isVisible]);

  return (
    <section 
      ref={sectionRef as any}
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      {/* Hidden video for frame extraction */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        playsInline
        muted
        preload="auto"
      />

      {/* Canvas showing the last frame */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isFrameCaptured ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          objectFit: 'cover',
          willChange: 'transform, opacity',
          // Default base transform (desktop can override via effects; mobile stays neutral)
          transform: 'translate3d(0px, 0px, 0) scale(1)',
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 h-full">
        {/* Optional Content - Centered */}
        {(title || content) && (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="max-w-4xl text-center text-white">
              {title && (
                <h1 className="text-5xl md:text-7xl font-outfit font-bold mb-8">
                  {title}
                </h1>
              )}
              {content && (
                <p className="font-outfit font-medium text-[18px] leading-[150%] tracking-[-0.011em]">
                  {content}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
