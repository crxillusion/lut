import type { Section } from '../constants/config';

interface NavigationProps {
  currentSection: Section;
  onShowreelClick?: () => void;
  onAboutClick?: () => void;
  onCasesClick?: () => void;
  onContactClick?: () => void;
}

export function Navigation({ 
  currentSection, 
  onShowreelClick,
  onAboutClick,
  onCasesClick,
  onContactClick
}: NavigationProps) {
  return (
    <nav className="flex justify-center items-center gap-12 -mt-30">
      <button 
        onClick={onShowreelClick}
        className={`font-outfit font-bold text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity`}
      >
        SHOWREEL
      </button>
      <button 
        onClick={onAboutClick}
        className={`font-outfit font-bold text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity`}
      >
        ABOUT
      </button>
      <button 
        onClick={onCasesClick}
        className="font-outfit font-bold text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity"
      >
        CASES
      </button>
      <button 
        onClick={onContactClick}
        className="font-outfit font-bold text-[18px] leading-[100%] tracking-[0.28em] text-center align-middle text-white hover:opacity-70 transition-opacity"
      >
        CONTACT
      </button>
    </nav>
  );
}
