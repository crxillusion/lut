import { RefObject } from 'react';
import { VideoBackground } from './VideoBackground';
import { BASE_PATH } from '../constants/config';
import Image from 'next/image';

interface ContactSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
}

export function ContactSection({ 
  videoRef, 
  videoSrc, 
  isVisible
}: ContactSectionProps) {
  return (
    <section 
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground 
        videoRef={videoRef}
        src={videoSrc}
        loop
        autoPlay
      />

      {/* Content Overlay */}
      <div className="relative z-10 h-full">
        {/* Contact Content - Centered */}
        <div className="absolute inset-0 flex items-center justify-center px-8">
          <div className="max-w-4xl text-center text-white">
            <h1 className="text-5xl md:text-7xl font-outfit font-bold mb-8">
              Get in Touch
            </h1>
            <p className="font-outfit font-medium text-[18px] leading-[150%] tracking-[-0.011em] mb-8">
              Let's create something extraordinary together.
            </p>
            <a 
              href="mailto:hello@lutstudios.com"
              className="font-outfit font-bold text-[18px] tracking-[0.28em] text-white hover:opacity-70 transition-opacity"
            >
              HELLO@LUTSTUDIOS.COM
            </a>
          </div>
        </div>

        {/* Bottom Section - Social Links Only */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
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
      </div>
    </section>
  );
}
