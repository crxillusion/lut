import { BASE_PATH } from '../constants/config';
import Image from 'next/image';

export function SocialLinks() {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
      <a 
        href="https://instagram.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-white hover:opacity-70 transition-opacity"
        aria-label="Instagram"
      >
        <Image src={`${BASE_PATH}/instagram.svg`} alt="Instagram" width={24} height={24} />
      </a>
      <a 
        href="https://linkedin.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-white hover:opacity-70 transition-opacity"
        aria-label="LinkedIn"
      >
        <Image src={`${BASE_PATH}/linkedin.svg`} alt="LinkedIn" width={24} height={24} />
      </a>
    </div>
  );
}
