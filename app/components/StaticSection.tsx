import { RefObject, useEffect, useRef, useState } from 'react';
import { BASE_PATH } from '../constants/config';
import Image from 'next/image';

interface StaticSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  title?: string;
  content?: string;
  onBackClick: () => void;
  frameOffsetFromEnd?: number; // Custom offset in seconds from video end (default: 0.05)
}

export function StaticSection({ 
  videoRef, 
  videoSrc, 
  isVisible,
  title,
  content,
  onBackClick,
  frameOffsetFromEnd = 0.05 // Default to 50ms before end
}: StaticSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFrameCaptured, setIsFrameCaptured] = useState(false);
  const captureAttemptedRef = useRef(false);
  const targetTimeRef = useRef<number>(0);
  
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
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the current frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setIsFrameCaptured(true);
          captureAttemptedRef.current = true;
          
          console.log(`[StaticSection ${videoSrc.split('/').pop()}] ✅ Frame captured at ${video.currentTime.toFixed(3)}s / ${video.duration.toFixed(3)}s`);
        }
      };
      
      const seekToLastFrame = () => {
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          targetTimeRef.current = video.duration - frameOffsetFromEnd;
          video.currentTime = targetTimeRef.current;
          
          console.log(`[StaticSection ${videoSrc.split('/').pop()}] 🎯 Seeking to ${targetTimeRef.current.toFixed(3)}s (offset: ${frameOffsetFromEnd}s)`);
          
          // Fallback: if seeked event doesn't fire within 500ms, try capturing anyway
          seekTimeout = setTimeout(() => {
            console.log(`[StaticSection ${videoSrc.split('/').pop()}] ⚠️ Seeked event timeout, capturing current frame`);
            captureFrame();
          }, 500);
        }
      };
      
      const handleSeeked = () => {
        if (seekTimeout) {
          clearTimeout(seekTimeout);
          seekTimeout = null;
        }
        
        console.log(`[StaticSection ${videoSrc.split('/').pop()}] 📍 Seeked event fired, currentTime: ${video.currentTime.toFixed(3)}s, target: ${targetTimeRef.current.toFixed(3)}s`);
        
        // Verify we're at the right time
        const timeDiff = Math.abs(video.currentTime - targetTimeRef.current);
        if (timeDiff > 0.1) {
          console.log(`[StaticSection ${videoSrc.split('/').pop()}] ⚠️ Seek mismatch! Retrying...`);
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
        console.log(`[StaticSection ${videoSrc.split('/').pop()}] 📊 Metadata loaded, duration: ${video.duration.toFixed(3)}s`);
        if (video.duration) {
          seekToLastFrame();
        }
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('seeked', handleSeeked);
      
      // Check if already loaded
      if (video.readyState >= 1 && video.duration && !captureAttemptedRef.current) {
        console.log(`[StaticSection ${videoSrc.split('/').pop()}] 📺 Video already loaded`);
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
    setIsFrameCaptured(false);
  }, [videoSrc]);

  return (
    <section 
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
        style={{ objectFit: 'cover' }}
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

        {/* Bottom Section - Back Button and Social Links */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={onBackClick}
            className="text-white hover:opacity-70 transition-opacity"
            aria-label="Go back"
          >
            <Image src={`${BASE_PATH}/back-arrow.svg`} alt="Back" width={24} height={24} />
          </button>
          
          {/* Divider */}
          <div className="w-px h-6 bg-white opacity-30"></div>
          
          {/* Social Links Inline */}
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:opacity-70 transition-opacity"
            aria-label="Instagram"
          >
            <Image src={`${BASE_PATH}/instagram.svg`} alt="Instagram" width={24} height={24} />
          </a>
          <a 
            href="https://linkedin.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:opacity-70 transition-opacity"
            aria-label="LinkedIn"
          >
            <Image src={`${BASE_PATH}/linkedin.svg`} alt="LinkedIn" width={24} height={24} />
          </a>
        </div>
      </div>
    </section>
  );
}
