import { BASE_PATH } from '../constants/config';

interface LoadingScreenProps {
  progress: number;
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${BASE_PATH}/loading-bg.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-center">
        {/* Logo Animation */}
        <div className="mb-8 flex justify-center">
          <img 
            src={`${BASE_PATH}/logo-animation.gif`}
            alt="LUT Studios" 
            className="w-48 h-48 md:w-128 md:h-128 object-contain"
          />
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 bg-opacity-30 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress Text */}
        <p className="text-white text-sm mt-4 tracking-wider opacity-70">
          Loading {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
