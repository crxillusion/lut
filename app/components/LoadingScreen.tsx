import { BASE_PATH } from '../constants/config';

interface LoadingScreenProps {
  progress: number;
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundImage: `url(${BASE_PATH}/loading-bg.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Logo Animation - Centered */}
      <img 
        src={`${BASE_PATH}/logo-animation.gif`}
        alt="LUT Studios" 
        className="w-48 h-48 md:w-64 md:h-64 object-contain"
      />
    </div>
  );
}
