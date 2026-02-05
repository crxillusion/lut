'use client';

import { RefObject } from 'react';
import { motion } from 'framer-motion';

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
  onBackClick,
}: CasesSectionProps) {
  // Props are preserved for consistency with other sections
  // They're used by the parent component to manage video state
  void videoRef; // Acknowledge unused
  void videoSrc; // Acknowledge unused
  void onBackClick; // Acknowledge unused

  const motionCommon = {
    initial: {
      filter: 'blur(10px)',
      opacity: 0,
      y: 20,
    },
    animate: {
      filter: isVisible ? 'blur(0px)' : 'blur(10px)',
      opacity: isVisible ? 1 : 0,
      y: isVisible ? 0 : 20,
    },
    transitionBase: {
      duration: isVisible ? 0.6 : 0.4,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  };

  return (
    <section
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      {isVisible && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[radial-gradient(266.84%_474.58%_at_-81.46%_103.52%,_#392947_6.73%,_#CC927C_27.62%,_#834418_52.88%,_#291B3E_76.92%,_#010103_100%)] px-4 md:px-8">
          <div className="w-[85%] max-w-[961px]">
            {/* Title (layered/blurred effect) */}
            <motion.div
              className="relative mb-[-2.5rem] md:mb-[-4rem] max-h-[885px]:hidden mx-auto w-[85%]"
              initial={motionCommon.initial}
              animate={motionCommon.animate}
              transition={{ ...motionCommon.transitionBase, delay: 0 }}
            >
              <h1 className="relative z-[1] min-h-[110px] md:min-h-[170px] font-outfit font-bold leading-none tracking-[0.28em] text-center text-white text-[clamp(44px,15vw,200px)]">
                <span className="relative z-[1]">CASES</span>

                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[2] text-white [clip-path:inset(0_0_31%_0)]"
                >
                  CASES
                </span>

                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[2] text-white blur-[3px] [clip-path:inset(69%_0_0_0)]"
                >
                  CASES
                </span>
              </h1>
            </motion.div>

            {/* Glass card */}
            <motion.div
              className="relative w-full rounded-[20px] border border-white/60 bg-[length:770px,100%]  bg-bottom bg-no-repeat bg-[url('/cases-bg.png'),radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] px-[18px] py-[22px] md:px-[50px] md:py-[42px] md:pb-[20rem]"
              initial={motionCommon.initial}
              animate={motionCommon.animate}
              transition={{ ...motionCommon.transitionBase, delay: 0.2 }}
            >
              <p className="m-0 font-outfit font-medium text-center text-white text-[clamp(14px,1.35vw,20px)] leading-[150%] tracking-[-0.011em]">
                Our portfolio features a blend of client collaborations and our own creative explorations. Each project,
                whether commercial or personal, reflects our passion for visual storytelling and experimentation.
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}
