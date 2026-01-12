interface LoadingScreenProps {
  progress: number;
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <h1 className="text-white text-6xl md:text-8xl font-bold mb-8">LUT</h1>
        
        {/* Progress Bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
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
