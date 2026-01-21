import type { Section } from '../constants/config';
import { BlurText } from './BlurText';
import { useEffect } from 'react';

interface NavigationProps {
  currentSection: Section;
  onShowreelClick?: () => void;
  onAboutClick?: () => void;
  onCasesClick?: () => void;
  onContactClick?: () => void;
  isVisible?: boolean;
}

export function Navigation({ 
  currentSection, 
  onShowreelClick,
  onAboutClick,
  onCasesClick,
  onContactClick,
  isVisible = true
}: NavigationProps) {
  useEffect(() => {
    console.log('[Navigation] Visibility changed:', { 
      isVisible, 
      currentSection,
      timestamp: new Date().toISOString()
    });
  }, [isVisible, currentSection]);

  return (
    <nav className="flex justify-center items-center gap-12 -mt-30">
      <button 
        onClick={onShowreelClick}
        className={`font-outfit font-bold text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity`}
      >
        <BlurText text="SHOWREEL" delay={0.2} duration={0.6} shouldAnimate={isVisible} />
      </button>
      <button 
        onClick={onAboutClick}
        className={`font-outfit font-bold text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity`}
      >
        <BlurText text="ABOUT" delay={0.3} duration={0.6} shouldAnimate={isVisible} />
      </button>
      <button 
        onClick={onCasesClick}
        className="font-outfit font-bold text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity"
      >
        <BlurText text="CASES" delay={0.4} duration={0.6} shouldAnimate={isVisible} />
      </button>
      <button 
        onClick={onContactClick}
        className="font-outfit font-bold text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity"
      >
        <BlurText text="CONTACT" delay={0.5} duration={0.6} shouldAnimate={isVisible} />
      </button>
    </nav>
  );
}
