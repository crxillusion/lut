import { useEffect, useRef, useState } from 'react';
import { VIDEO_PATHS } from '../constants/config';

interface OpeningTransitionProps {
  isPlaying: boolean;
  onComplete: () => void;
}

export function OpeningTransition({ isPlaying, onComplete }: OpeningTransitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isPlaying && !shouldRender) {
      const timer = setTimeout(() => {
        setShouldRender(true);
        setIsVisible(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, shouldRender]);

  useEffect(() => {
    if (!isPlaying || !shouldRender || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    let hasCompleted = false;

    const completeTransition = () => {
      if (hasCompleted) return;
      hasCompleted = true;
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
        onComplete();
      }, 150);
    };

    const handleEnded = () => {
      completeTransition();
    };

    const startPlayback = () => {
      video.currentTime = 0;
      video.playbackRate = 1.0;
      video.addEventListener('ended', handleEnded);
      void video.play().catch(() => {
        completeTransition();
      });
    };

    if (video.readyState >= 3) {
      startPlayback();
    } else {
      const handleCanPlay = () => {
        startPlayback();
      };
      video.addEventListener('canplay', handleCanPlay, { once: true });
      if (video.readyState === 0) {
        video.load();
      }
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, shouldRender, onComplete]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[90] bg-black transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <video
        ref={videoRef}
        src={VIDEO_PATHS.opening}
        className="w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
      />
    </div>
  );
}
