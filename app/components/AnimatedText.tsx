'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, memo } from 'react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  shouldAnimate?: boolean;
  splitByWords?: boolean;
}

const AnimatedTextComponent = ({ 
  text, 
  className = '', 
  delay = 0,
  duration = 0.5,
  shouldAnimate = false,
  splitByWords = true
}: AnimatedTextProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (shouldAnimate) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [shouldAnimate, text]);

  if (splitByWords) {
    const words = text.split(' ');
    
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ 
          duration: isVisible ? 0.3 : 0.4,
          delay: isVisible ? 0 : 0 
        }}
        style={{ display: 'inline-block' }}
      >
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
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
              duration: isVisible ? duration : 0.4,
              delay: isVisible ? delay + (index * 0.03) : 0,
              ease: [0.23, 1, 0.32, 1],
            }}
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
  }

  // Simple fade animation without word splitting
  return (
    <motion.p
      className={className}
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
        duration: isVisible ? duration : 0.4,
        delay: isVisible ? delay : 0,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      {text}
    </motion.p>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const AnimatedText = memo(AnimatedTextComponent);
