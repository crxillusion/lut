import { RefObject } from 'react';
import { VideoBackground } from './VideoBackground';
import { AnimatedText } from './AnimatedText';
import { useManagedVideoPlayback } from '../hooks/useManagedVideoPlayback';

interface AboutStartSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  showUI: boolean; // Controls text visibility for fade out during transitions
  onHeroClick?: () => void;
}

export function AboutStartSection({ 
  videoRef, 
  videoSrc, 
  isVisible,
  showUI
}: AboutStartSectionProps) {
  useManagedVideoPlayback(videoRef, {
    enabled: isVisible,
    name: 'AboutStartLoop',
    preloadFirstFrame: true,
  });

  return (
    <section 
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground 
        videoRef={videoRef}
        src={videoSrc}
        autoPlay
        loop
      />

      {/* Content Overlay */}
      <div className="relative z-10 h-full">
        {/* About Content - 500px width, left-aligned, starting from center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-[500px] ml-[50%] mb-50">
            <AnimatedText
              text="What sets us apart is our belief that every project is like a painting, where every frame is crafted with care and precision."
              className="text-left text-white font-outfit font-medium text-[18px] leading-[150%] tracking-[-0.011em]"
              delay={0.3}
              duration={0.6}
              shouldAnimate={showUI}
              splitByWords={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
