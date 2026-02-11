import Image from 'next/image';
import { BASE_PATH } from '../constants/config';

interface LoadingScreenProps {
  progress?: number;
  isVisible: boolean;
}

export function LoadingScreen({ isVisible, progress = 0 }: LoadingScreenProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-cover bg-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundImage: `url(${BASE_PATH}/loading-bg.jpg)`,
      }}
    >
      <div className="flex flex-col items-center">
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

        {/* Progress bar */}
        <div className="mt-6 w-[220px] md:w-[420px] h-[14px] rounded-[999px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.18)_0%,rgba(240,240,240,0.18)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.22)] backdrop-blur-[1.44px] overflow-hidden">
          <div
            className="h-full bg-white/95 transition-[width] duration-300 ease-out rounded-[999px]"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}
