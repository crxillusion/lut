import { RefObject } from 'react';
import { VideoBackground } from './VideoBackground';
import { RotateCcw, Instagram, Linkedin } from 'lucide-react';

interface AboutStartSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  onHeroClick: () => void;
}

export function AboutStartSection({ 
  videoRef, 
  videoSrc, 
  isVisible,
  onHeroClick 
}: AboutStartSectionProps) {
  return (
    <section 
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground 
        videoRef={videoRef}
        src={videoSrc}
        loop
      />

      {/* Content Overlay */}
      <div className="relative z-10 h-full">
        {/* About Content - 500px width, left-aligned, starting from center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-[500px] ml-[50%] mb-50">
            <p className="text-left text-white font-outfit font-medium text-[18px] leading-[150%] tracking-[-0.011em]">
              What sets us apart is our belief that every project is like a painting, where every frame is crafted with care and precision.
            </p>
          </div>
        </div>

        {/* Bottom Section - Back Button and Social Links */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={onHeroClick}
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
