import { RefObject, useState } from 'react';
import { motion } from 'framer-motion';
import { VideoBackground } from './VideoBackground';
import { useManagedVideoPlayback } from '../hooks/useManagedVideoPlayback';

interface ContactSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  isTransitioning?: boolean; // Hide immediately during transitions
  showUI: boolean; // Controls UI elements visibility for fade out during transitions
}

export function ContactSection({
  videoRef,
  videoSrc,
  isVisible,
  isTransitioning = false,
  showUI,
}: ContactSectionProps) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    message: '',
  });

  const shouldShow = isVisible && !isTransitioning;

  useManagedVideoPlayback(videoRef, {
    enabled: shouldShow,
    name: 'ContactLoop',
    preloadFirstFrame: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const motionCommon = {
    initial: {
      filter: 'blur(10px)',
      opacity: 0,
      y: 20,
    },
    animate: {
      filter: showUI ? 'blur(0px)' : 'blur(10px)',
      opacity: showUI ? 1 : 0,
      y: showUI ? 0 : 20,
    },
    transitionBase: {
      duration: showUI ? 0.6 : 0.4,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  };

  return (
    <section
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        shouldShow ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground videoRef={videoRef} src={videoSrc} loop autoPlay />

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-[961px]">
          {/* Title (layered/blurred effect) */}
          <motion.div
            className="relative mb-[-2.5rem] md:mb-[-4rem] z-[1]"
            initial={motionCommon.initial}
            animate={motionCommon.animate}
            transition={{ ...motionCommon.transitionBase, delay: 0 }}
          >
            <h1 className="relative z-[1] min-h-[110px] md:min-h-[170px] font-outfit font-bold leading-none tracking-[0.28em] text-center text-white text-[clamp(44px,15vw,160px)]">
              {/* Base text */}
              <span className="relative z-[1]">READY?</span>

              {/* Top half (sharp) */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[2] text-white [clip-path:inset(0_0_38%_0)]"
              >
                READY?
              </span>

              {/* Bottom half (blurred) */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[2] text-white blur-[3px] [clip-path:inset(63%_0_0_0)]"
              >
                READY?
              </span>
            </h1>
          </motion.div>

          {/* Contact Us Card */}
          <motion.div
            className="relative z-[2] w-full max-w-[961px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] px-[18px] py-[18px] md:px-[48px] md:py-[32px] mb-6 xl:mb-8"
            initial={motionCommon.initial}
            animate={motionCommon.animate}
            transition={{ ...motionCommon.transitionBase, delay: 0.2 }}
          >
            <h2 className="font-outfit font-bold tracking-[0.5em] text-center text-white mb-4 text-[clamp(14px,1.4vw,20px)]">
              CONTACT US
            </h2>

            <p className="font-outfit font-medium text-center text-white mb-6 text-[clamp(14px,1.35vw,20px)] leading-[150%] tracking-[-0.011em]">
              If you&apos;d like to discuss a potential projects and partnership, please email{' '}
              <a className="underline hover:opacity-70 transition-opacity" href="mailto:info@lutstudios.com">
                info@lutstudios.com
              </a>
              <br />
              or contact via phone number
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="text-center">
                <p className="font-outfit font-medium text-white leading-[150%] tracking-[-0.011em] text-[14px] md:text-[16px]">
                  Los Angeles studio
                  <br />
                  +1 (424) 3030572
                </p>
              </div>
              <div className="text-center">
                <p className="font-outfit font-medium text-white leading-[150%] tracking-[-0.011em] text-[14px] md:text-[16px]">
                  Yerevan studio
                  <br />
                  +374 (99) 499838
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            className="w-full max-w-[961px] mx-auto"
            initial={motionCommon.initial}
            animate={motionCommon.animate}
            transition={{ ...motionCommon.transitionBase, delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6 xl:gap-[30px]">
              {/* Email and Phone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 xl:gap-[30px]">
                <div className="relative flex items-center">
                  <label
                    htmlFor="email"
                    className="absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,20px)]"
                  >
                    Email:
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-[46px] md:h-[53px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,20px)] px-4 md:px-6 pl-[72px] md:pl-[90px] focus:outline-none focus:border-white transition-[border-color,opacity]"
                    required
                  />
                </div>

                <div className="relative flex items-center">
                  <label
                    htmlFor="phone"
                    className="absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,20px)]"
                  >
                    Phone:
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-[46px] md:h-[53px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,20px)] px-4 md:px-6 pl-[72px] md:pl-[90px] focus:outline-none focus:border-white transition-[border-color,opacity]"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="relative flex items-center">
                <label
                  htmlFor="name"
                  className="absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,20px)]"
                >
                  Name:
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-[46px] md:h-[53px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,20px)] px-4 md:px-6 pl-[78px] md:pl-[90px] focus:outline-none focus:border-white transition-[border-color,opacity]"
                  required
                />
              </div>

              {/* Message */}
              <div className="relative flex items-center">
                <label
                  htmlFor="message"
                  className="absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,20px)]"
                >
                  Message:
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={1}
                  className="w-full h-[46px] md:h-[53px] resize-none rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,20px)] px-4 md:px-6 pl-[88px] md:pl-[110px] pt-[10px] focus:outline-none focus:border-white transition-[border-color,opacity]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-[46px] md:h-[53px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-semibold text-white tracking-[0.22em] md:tracking-[0.28em] text-[clamp(14px,1.35vw,20px)] text-center hover:opacity-80 transition-opacity"
              >
                SUBMIT
              </button>

              {/* Schedule Meeting Button */}
              <button
                type="button"
                className="w-full h-[46px] md:h-[53px] rounded-[20px] border border-white/60 shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] font-outfit font-bold text-white tracking-[0.22em] md:tracking-[0.28em] text-[clamp(14px,1.35vw,20px)] text-center bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%),linear-gradient(0deg,rgba(0,108,253,0.54),rgba(0,108,253,0.54))] hover:opacity-90 transition-opacity"
              >
                SCHEDULE A MEETING
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
