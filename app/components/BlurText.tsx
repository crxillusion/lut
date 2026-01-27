'use client';

import { motion, Variants } from 'framer-motion';
import { memo } from 'react';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  shouldAnimate?: boolean;
}

const BlurTextComponent = ({ 
  text, 
  className = '', 
  delay = 0,
  duration = 0.5,
  shouldAnimate = false
}: BlurTextProps) => {
  // Directly use shouldAnimate prop instead of local state
  const isVisible = shouldAnimate;
  const words = text.split(' ');

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: isVisible ? delay : 0,
      },
    },
  };

  const item: Variants = {
    hidden: {
      filter: 'blur(10px)',
      opacity: 0,
      y: 20,
    },
    visible: {
      filter: 'blur(0px)',
      opacity: 1,
      y: 0,
      transition: {
        duration: isVisible ? duration : 0.4,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  };

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      style={{ display: 'inline-block' }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          variants={item}
          style={{ 
            display: 'inline-block',
            whiteSpace: 'pre',
          }}
        >
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const BlurText = memo(BlurTextComponent);
