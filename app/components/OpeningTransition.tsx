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
    if (isPlaying) {
      console.log('[OpeningTransition] isPlaying is true, rendering component');
      setShouldRender(true);
      setIsVisible(true); // Set visible immediately, no requestAnimationFrame delay
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && shouldRender && videoRef.current) {
      const video = videoRef.current;
      
      console.log('[OpeningTransition] Starting opening animation, video element ready');
      console.log('[OpeningTransition] Video state:', {
        duration: video.duration,
        currentTime: video.currentTime,
        readyState: video.readyState,
        paused: video.paused,
        ended: video.ended
      });
      
      let hasCompleted = false;
      let startTime = 0;
      
      const completeTransition = () => {
        if (hasCompleted) return;
        hasCompleted = true;
        
        console.log('[OpeningTransition] Animation complete, fading out');
        console.log('[OpeningTransition] Video ended at:', video.currentTime, 'duration:', video.duration);
        
        // Fade out before calling onComplete
        setIsVisible(false);
        // Wait for fade animation to complete
        setTimeout(() => {
          setShouldRender(false);
          onComplete();
        }, 150);
      };
      
      const handleTimeUpdate = () => {
        const currentTime = video.currentTime;
        const duration = video.duration;
        
        // Log progress every 100ms of video time
        if (Math.floor(currentTime * 10) !== Math.floor(startTime * 10)) {
          console.log('[OpeningTransition] Playing:', currentTime.toFixed(3), '/', duration.toFixed(3));
          startTime = currentTime;
        }
        
        // Complete when we're within 50ms of the end
        if (currentTime >= duration - 0.05) {
          completeTransition();
        }
      };
      
      const handleEnded = () => {
        console.log('[OpeningTransition] Ended event fired at:', video.currentTime);
        completeTransition();
      };
      
      const startPlayback = () => {
        console.log('[OpeningTransition] Video ready, starting playback');
        console.log('[OpeningTransition] Before reset - currentTime:', video.currentTime, 'ended:', video.ended);
        
        // Reset video completely
        video.currentTime = 0;
        video.playbackRate = 1.0;
        
        console.log('[OpeningTransition] After reset - currentTime:', video.currentTime, 'ended:', video.ended);
        
        // Add listeners
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        
        // Small delay to ensure currentTime reset has taken effect
        setTimeout(() => {
          video.play()
            .then(() => {
              console.log('[OpeningTransition] Video play() promise resolved, video is playing');
              console.log('[OpeningTransition] Playing state - currentTime:', video.currentTime, 'paused:', video.paused, 'ended:', video.ended);
            })
            .catch(err => {
              console.error('[OpeningTransition] Failed to play:', err);
              onComplete();
            });
        }, 10);
      };
      
      // Check if video is already loaded
      if (video.readyState >= 3) {
        // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
        console.log('[OpeningTransition] Video already loaded, playing immediately');
        startPlayback();
      } else {
        // Wait for video to be ready
        console.log('[OpeningTransition] Waiting for video to load...');
        const handleCanPlay = () => {
          console.log('[OpeningTransition] Video can play now');
          startPlayback();
        };
        video.addEventListener('canplay', handleCanPlay, { once: true });
        
        // Also try to load the video if it hasn't started
        if (video.readyState === 0) {
          video.load();
        }
      }
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      };
    } else if (isPlaying && shouldRender && !videoRef.current) {
      console.warn('[OpeningTransition] Waiting for video element to mount...');
    }
  }, [isPlaying, shouldRender, onComplete]);

  if (!shouldRender) {
    console.log('[OpeningTransition] Not rendering (shouldRender is false)');
    return null;
  }

  console.log('[OpeningTransition] Rendering, isVisible:', isVisible);

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
