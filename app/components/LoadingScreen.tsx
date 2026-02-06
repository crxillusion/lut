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
      <Image
        src={`${BASE_PATH}/logo-animation.gif`}
        alt="LUT Studios"
        width={384}
        height={384}
        unoptimized
        priority
        loading="eager"
        className="w-48 h-48 md:w-96 md:h-96 object-contain"
      />
    </div>
  );
}
