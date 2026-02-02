'use client';

import { RefObject } from 'react';
import Image from 'next/image';
import { BASE_PATH } from '../constants/config';
import styles from './CasesSection.module.css';

interface CasesSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  onBackClick?: () => void;
}

export function CasesSection({ 
  videoRef, 
  videoSrc, 
  isVisible,
  onBackClick
}: CasesSectionProps) {
  // No need for showImage state - just use isVisible directly to prevent black flash
  // The transition video is handled by the TransitionVideo component in page.tsx

  return (
    <section 
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      {/* Image Layer - shown immediately when section is visible */}
      {isVisible && (
        <div className={styles.container}>
          <div className={styles.imageWrapper}>
            {/* Background Image - matches video object-cover behavior exactly */}
            <Image
              src={`${BASE_PATH}/Cases_png_transparent.png`}
              alt="Cases"
              fill
              className={styles.backgroundImage}
              priority
              sizes="100vw"
              quality={100}
            />

            {/* Interactive Transparent Area - positioned over the transparent part */}
            <div className={styles.interactiveArea}>
              <div className={styles.contentBox}>
                {/* Placeholder content - replace with your actual content */}
                <div className={styles.placeholderContent}>
                  <p className={styles.placeholderTitle}>Interactive Content Area</p>
                  <p className={styles.placeholderSubtitle}>
                    This is where your cases content will be placed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
