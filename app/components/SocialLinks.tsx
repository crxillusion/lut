import { BASE_PATH } from '../constants/config';
import Image from 'next/image';

interface SocialLinksProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
  iconSize?: number;
}

export function SocialLinks({ showBackButton = false, onBackClick, iconSize = 45 }: SocialLinksProps) {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
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
        href="https://instagram.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-white hover:opacity-70 transition-opacity"
        aria-label="Instagram"
      >
        <Image src={`${BASE_PATH}/instagram.svg`} alt="Instagram" width={iconSize} height={iconSize} />
      </a>
      <a 
        href="https://linkedin.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-white hover:opacity-70 transition-opacity"
        aria-label="LinkedIn"
      >
        <Image src={`${BASE_PATH}/linkedin.svg`} alt="LinkedIn" width={iconSize} height={iconSize} />
      </a>
    </div>
  );
}
