'use client';

import { BASE_PATH } from '../constants/config';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface SocialLinksProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
  iconSize?: number;
  isVisible?: boolean;
}

export function SocialLinks({ 
  showBackButton = false, 
  onBackClick, 
  iconSize = 45,
  isVisible = true 
}: SocialLinksProps) {
  console.log('[SocialLinks] Rendered with:', { 
    showBackButton, 
    isVisible,
    timestamp: new Date().toISOString()
  });

  return (
    <motion.div 
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4"
      initial={{
        filter: 'blur(10px)',
        opacity: 0,
        y: 20,
      }}
      animate={{
        filter: isVisible ? 'blur(0px)' : 'blur(10px)',
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 20,
      }}
      transition={{
        duration: isVisible ? 0.6 : 0.4,
        delay: isVisible ? 0.85 : 0,
        ease: [0.23, 1, 0.32, 1],
      }}
      onAnimationStart={() => {
        console.log('[SocialLinks] Animation started:', { 
          isVisible,
          direction: isVisible ? 'fade-in' : 'fade-out',
          showBackButton
        });
      }}
      onAnimationComplete={() => {
        console.log('[SocialLinks] Animation completed:', { 
          isVisible,
          direction: isVisible ? 'fade-in' : 'fade-out',
          showBackButton
        });
      }}
    >
      {showBackButton && onBackClick && (
        <>
          {/* Back Button */}
          <button
            onClick={onBackClick}
            className="text-white hover:opacity-70 transition-opacity"
            aria-label="Go back"
          >
            <Image src={`${BASE_PATH}/back-arrow.svg`} alt="Back" width={iconSize} height={iconSize} />
          </button>
          
          {/* Divider */}
          <div className="w-px h-6 bg-white opacity-30"></div>
        </>
      )}
      
      {/* Social Links */}
      <a 
        href="https://www.instagram.com/lutstudios" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-white hover:opacity-70 transition-opacity"
        aria-label="Instagram"
      >
        <Image src={`${BASE_PATH}/instagram.svg`} alt="Instagram" width={iconSize} height={iconSize} />
      </a>
      <a 
        href="https://www.linkedin.com/company/lutstudios/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-white hover:opacity-70 transition-opacity"
        aria-label="LinkedIn"
      >
        <Image src={`${BASE_PATH}/linkedin.svg`} alt="LinkedIn" width={iconSize} height={iconSize} />
      </a>
    </motion.div>
  );
}
