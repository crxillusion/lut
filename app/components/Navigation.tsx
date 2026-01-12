import type { Section } from '../constants/config';

interface NavigationProps {
  currentSection: Section;
  onAboutClick?: () => void;
  onHeroClick?: () => void;
}

export function Navigation({ currentSection, onAboutClick, onHeroClick }: NavigationProps) {
  return (
    <nav className="flex justify-center items-center gap-12 pt-8 md:pt-12">
      <button 
        onClick={onHeroClick}
        className={`text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity ${
          currentSection === 'hero' ? 'opacity-100 border-b-2 border-white' : ''
        }`}
      >
        SHOWREEL
      </button>
      <button 
        onClick={onAboutClick}
        className={`text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity ${
          currentSection === 'about' ? 'opacity-100 border-b-2 border-white' : ''
        }`}
      >
        ABOUT
      </button>
      <button className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity">
        CASES
      </button>
      <button className="text-white text-sm md:text-base tracking-[0.3em] hover:opacity-70 transition-opacity">
        CONTACT
      </button>
    </nav>
  );
}
