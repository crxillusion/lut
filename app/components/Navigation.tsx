import type { Section } from '../constants/config';
import { BlurText } from './BlurText';

interface NavigationProps {
  currentSection?: Section;
  onShowreelClick?: () => void;
  onAboutClick?: () => void;
  onCasesClick?: () => void;
  onContactClick?: () => void;
  isVisible?: boolean;
}

const NAV_ITEM_CLASS =
  'font-outfit font-bold text-[20px] sm:text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity';

export function Navigation({ 
  onShowreelClick,
  onAboutClick,
  onCasesClick,
  onContactClick,
  isVisible = true
}: NavigationProps) {
  return (
    <nav className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 -mt-30">
      <button onClick={onShowreelClick} className={NAV_ITEM_CLASS}>
        <BlurText text="SHOWREEL" delay={0.2} duration={0.6} shouldAnimate={isVisible} />
      </button>
      <button onClick={onAboutClick} className={NAV_ITEM_CLASS}>
        <BlurText text="ABOUT" delay={0.3} duration={0.6} shouldAnimate={isVisible} />
      </button>
      <button onClick={onCasesClick} className={NAV_ITEM_CLASS}>
        <BlurText text="CASES" delay={0.4} duration={0.6} shouldAnimate={isVisible} />
      </button>
      <button onClick={onContactClick} className={NAV_ITEM_CLASS}>
        <BlurText text="CONTACT" delay={0.5} duration={0.6} shouldAnimate={isVisible} />
      </button>
    </nav>
  );
}
