import { RefObject, useEffect } from 'react';
import { RotateCcw, Instagram, Linkedin } from 'lucide-react';

interface StaticSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  title?: string;
  content?: string;
  onBackClick: () => void;
}

export function StaticSection({ 
  videoRef, 
  videoSrc, 
  isVisible,
  title,
  content,
  onBackClick 
}: StaticSectionProps) {
  // Load video and seek to last frame when component mounts
  useEffect(() => {
    if (videoRef.current && isVisible) {
      const video = videoRef.current;
      
      const seekToEnd = () => {
        if (video.duration && !isNaN(video.duration)) {
          // Seek to last frame (duration - 0.001 seconds)
          video.currentTime = video.duration - 0.001;
        }
      };
      
      const handleLoadedMetadata = () => {
        seekToEnd();
      };
      
      const handleSeeked = () => {
        video.pause(); // Ensure it stays paused after seeking
      };
      
      // Load the video
      video.load();
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('seeked', handleSeeked);
      
      // If metadata is already loaded
      if (video.readyState >= 1) {
        seekToEnd();
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
      };
    }
  }, [videoRef, isVisible, videoSrc]);

  return (
    <section 
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      {/* Video Background - paused at last frame */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
        autoPlay={false}
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
            <RotateCcw size={24} strokeWidth={1.5} />
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
            <Instagram size={24} />
          </a>
          <a 
            href="https://linkedin.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:opacity-70 transition-opacity"
            aria-label="LinkedIn"
          >
            <Linkedin size={24} />
          </a>
        </div>
      </div>
    </section>
  );
}
