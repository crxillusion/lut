'use client';

import { BASE_PATH } from '../constants/config';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { memo, useState, useEffect } from 'react';

interface SocialLinksProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
  iconSize?: number;
  isVisible?: boolean;
  animateOnce?: boolean; // If true, animate once and stay visible
}

const SocialLinksComponent = ({ 
  showBackButton = false, 
  onBackClick, 
  iconSize = 45,
  isVisible = true,
  animateOnce = false
}: SocialLinksProps) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Track if we've animated once - use setTimeout to avoid setState during render
  useEffect(() => {
    if (animateOnce && isVisible && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isVisible, animateOnce, hasAnimated]);
  
  // For animateOnce mode: animate in once, then stay visible
  // For normal mode: follow isVisible prop
  const shouldBeVisible = animateOnce ? (hasAnimated || isVisible) : isVisible;
  
  return (
    <motion.div 
      className="absolute bottom-20 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4"
      initial={{
        filter: 'blur(10px)',
        opacity: 0,
        y: 20,
      }}
      animate={{
        filter: shouldBeVisible ? 'blur(0px)' : 'blur(10px)',
        opacity: shouldBeVisible ? 1 : 0,
        y: shouldBeVisible ? 0 : 20,
      }}
      transition={{
        duration: shouldBeVisible ? 0.6 : 0.4,
        delay: shouldBeVisible && !hasAnimated ? 0.85 : 0,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <AnimatePresence mode="wait">
        {showBackButton && onBackClick && (
          <motion.div
            key="back-button-group"
            className="flex items-center gap-4"
            initial={{
              opacity: 0,
              x: -10,
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: 1,
              x: 0,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              x: -10,
              filter: 'blur(8px)',
            }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
      
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
};

// Memoize the component to prevent unnecessary re-renders
export const SocialLinks = memo(SocialLinksComponent);
