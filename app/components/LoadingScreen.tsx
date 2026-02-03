import Image from 'next/image';
import { BASE_PATH } from '../constants/config';

interface LoadingScreenProps {
  progress?: number;
  isVisible: boolean;
}

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-cover bg-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundImage: `url(${BASE_PATH}/loading-bg.jpg)`,
      }}
    >
      <div className="relative w-48 h-48 md:w-96 md:h-96">
        <Image
          src={`${BASE_PATH}/logo-animation.gif`}
          alt="LUT Studios"
          fill
          unoptimized
          priority
          sizes="(min-width: 768px) 384px, 192px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
