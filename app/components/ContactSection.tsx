import { RefObject, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { VideoBackground } from './VideoBackground';
import { useManagedVideoPlayback } from '../hooks/useManagedVideoPlayback';

interface ContactSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  isTransitioning?: boolean;
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

  // Track touched fields for better validation UX
  const [touched, setTouched] = useState<{ [K in keyof typeof formData]?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shouldShow = isVisible && !isTransitioning;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useManagedVideoPlayback(videoRef, {
    enabled: shouldShow,
    name: 'ContactLoop',
    preloadFirstFrame: true,
  });

  const validateEmail = (value: string) => {
    const v = value.trim();
    if (!v) return 'Email is required.';
    // Simple, pragmatic email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email.';
    return null;
  };

  const validateName = (value: string) => {
    const v = value.trim();
    if (!v) return 'Name is required.';
    if (v.length < 2) return 'Name must be at least 2 characters.';
    return null;
  };

  const validateMessage = (value: string) => {
    const v = value.trim();
    if (!v) return 'Message is required.';
    if (v.length < 10) return 'Message must be at least 10 characters.';
    if (v.length > 2000) return 'Message is too long (max 2000 characters).';
    return null;
  };

  const validatePhone = (value: string) => {
    const v = value.trim();
    if (!v) return 'Phone is required.';
    // Allow digits, spaces, parentheses, +, -
    if (!/^[0-9+()\-\s]{7,20}$/.test(v)) return 'Please enter a valid phone number.';
    return null;
  };

  const fieldErrors = useMemo(() => {
    return {
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      name: validateName(formData.name),
      message: validateMessage(formData.message),
    };
  }, [formData.email, formData.phone, formData.name, formData.message]);

  const isFormValid = useMemo(() => {
    return !fieldErrors.email && !fieldErrors.phone && !fieldErrors.name && !fieldErrors.message;
  }, [fieldErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark everything as touched to reveal validation messages
    setTouched({ email: true, phone: true, name: true, message: true });

    if (!isFormValid) {
      // no general error message; tooltips will guide the user
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    fd.set('form-name', 'contact');

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(fd as any).toString(),
      });

      if (!response.ok) throw new Error('Form submission failed');

      setIsSubmitted(true);
      setFormData({ email: '', phone: '', name: '', message: '' });
      setTouched({});

      // Auto-hide the popup after a moment
      window.setTimeout(() => setIsSubmitted(false), 3500);
    } catch (err: any) {
      // avoid showing a general error message per UX request
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const inputErrorClass = (hasError: boolean) =>
    hasError
      ? 'border-red-300/90 focus:border-red-200'
      : 'focus:border-white';

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

  const tooltipMotion = {
    initial: { opacity: 0, y: 6, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: 6, filter: 'blur(6px)' },
    transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] as const },
  };

  return (
    <section
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        shouldShow ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground videoRef={videoRef} src={videoSrc} loop autoPlay />

      {/* Centered submission modal */}
      <motion.div
        aria-live="polite"
        className="fixed inset-0 z-[70] flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={isSubmitted ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        style={{ pointerEvents: isSubmitted ? 'auto' : 'none' }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[6px]" onClick={() => setIsSubmitted(false)} />

        {/* Modal card */}
        <motion.div
          className="relative w-full max-w-[720px] rounded-[24px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.22)_0%,rgba(240,240,240,0.22)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.35)] backdrop-blur-[1.72px] px-6 py-7 md:px-10 md:py-9"
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)', scale: 0.98 }}
          animate={isSubmitted ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : { opacity: 0, y: 10, filter: 'blur(10px)', scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-outfit font-bold text-white tracking-[0.18em] text-[14px] md:text-[16px]">
                MESSAGE SENT
              </p>
              <p className="mt-2 font-outfit font-medium text-white/90 text-[14px] md:text-[16px] leading-[150%] tracking-[-0.011em]">
                Thank you — we received your message and will be in touch shortly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="shrink-0 h-[42px] md:h-[46px] rounded-[18px] border border-white/60 px-5 font-outfit font-semibold text-white tracking-[0.22em] text-[12px] md:text-[13px] hover:opacity-80 transition-opacity"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full px-4 md:px-8 overflow-y-auto [scrollbar-gutter:stable]">
        <style>{`@media (max-height: 885px){ .contact-ready-title { display:none !important; } }`}</style>

        <div className="min-h-full flex items-center justify-center py-5 max-h-[885px]:py-6 max-h-[700px]:py-4">
          <div className="w-full max-w-[845px] pb-24 max-h-[885px]:pb-28">
            {/* Title (layered/blurred effect) */}
            <motion.div
              className="contact-ready-title relative mb-[-2.5rem] md:mb-[-4rem] max-h-[885px]:mb-0 z-[1] max-h-[885px]:hidden"
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
              className="relative z-[2] w-full max-w-[845px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] px-[18px] py-[18px] md:px-[20px] md:py-[42px] max-h-[885px]:py-[18px] mb-9 xl:mb-5 max-h-[885px]:mb-4"
              initial={motionCommon.initial}
              animate={motionCommon.animate}
              transition={{ ...motionCommon.transitionBase, delay: 0.2 }}
            >
              <h2 className="font-outfit font-bold tracking-[0.5em] text-center text-white mb-2 text-[clamp(14px,1.4vw,20px)]">
                CONTACT US
              </h2>

              <p className="font-outfit font-medium text-center text-white mb-2 text-[clamp(14px,1.35vw,16px)] leading-[150%] tracking-[-0.011em]">
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
              className={`w-full max-w-[845px] mx-auto transition-[filter,opacity] duration-300 ${
                isSubmitted ? 'blur-[6px] opacity-60' : 'blur-0 opacity-100'
              }`}
              initial={motionCommon.initial}
              animate={motionCommon.animate}
              transition={{ ...motionCommon.transitionBase, delay: 0.4 }}
              style={{ pointerEvents: isSubmitted ? 'none' : 'auto' }}
            >
              <form
                name="contact"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 md:gap-5 xl:gap-[30px] max-h-[885px]:gap-3"
                noValidate
              >
                <input type="hidden" name="form-name" value="contact" />
                <p className="hidden">
                  <label>
                    Don’t fill this out if you’re human: <input name="bot-field" />
                  </label>
                </p>
                {/* Email and Phone Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 xl:gap-[30px] max-h-[885px]:gap-3">
                  <div className="relative flex flex-col">
                    <div className="relative flex items-center">
                      <label
                        htmlFor="email"
                        className="absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)]"
                      >
                        Email:
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="email"
                        inputMode="email"
                        className={`w-full h-[46px] md:h-[53px] max-[885px]:h-[42px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)] px-4 md:px-6 pl-[70px] md:pl-[70px] focus:outline-none transition-[border-color,opacity] ${inputErrorClass(!!(touched.email && fieldErrors.email))}`}
                        required
                      />

                      <AnimatePresence>
                        {touched.email && fieldErrors.email && (
                          <motion.div
                            className="pointer-events-none absolute right-3 top-[-30px] z-30"
                            initial={tooltipMotion.initial}
                            animate={tooltipMotion.animate}
                            exit={tooltipMotion.exit}
                            transition={tooltipMotion.transition}
                          >
                            <div className="relative rounded-[14px] border border-red-200/40 bg-[#70343b] px-3 py-2 shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)]">
                              {/* arrow (down) */}
                              <span className="absolute left-6 -bottom-[6px] w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#70343b]" />
                              <span className="absolute left-6 -bottom-[7px] w-0 h-0 border-x-[7px] border-x-transparent border-t-[7px] border-t-red-200/40" />
                              <p className="font-outfit font-medium text-[12px] leading-[140%] tracking-[-0.011em] text-red-100 whitespace-nowrap">
                                {fieldErrors.email}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="relative flex flex-col">
                    <div className="relative flex items-center">
                      <label
                        htmlFor="phone"
                        className="absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)]"
                      >
                        Phone:
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="tel"
                        inputMode="tel"
                        className={`w-full h-[46px] md:h-[53px] max-[885px]:h-[42px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)] px-4 md:px-6 pl-[75px] md:pl-[75px] focus:outline-none transition-[border-color,opacity] ${inputErrorClass(!!(touched.phone && fieldErrors.phone))}`}
                        required
                      />

                      <AnimatePresence>
                        {touched.phone && fieldErrors.phone && (
                          <motion.div
                            className="pointer-events-none absolute right-3 top-[-30px] z-30"
                            initial={tooltipMotion.initial}
                            animate={tooltipMotion.animate}
                            exit={tooltipMotion.exit}
                            transition={tooltipMotion.transition}
                          >
                            <div className="relative rounded-[14px] border border-red-200/40 bg-[#70343b] px-3 py-2 shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)]">
                              {/* arrow (down) */}
                              <span className="absolute left-6 -bottom-[6px] w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#70343b]" />
                              <span className="absolute left-6 -bottom-[7px] w-0 h-0 border-x-[7px] border-x-transparent border-t-[7px] border-t-red-200/40" />
                              <p className="font-outfit font-medium text-[12px] leading-[140%] tracking-[-0.011em] text-red-100 whitespace-nowrap">
                                {fieldErrors.phone}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="relative flex flex-col">
                  <div className="relative flex items-center">
                    <label
                      htmlFor="name"
                      className="absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)]"
                    >
                      Name:
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="name"
                      className={`w-full h-[46px] md:h-[53px] max-[885px]:h-[42px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)] px-4 md:px-6 pl-[75px] md:pl-[75px] focus:outline-none transition-[border-color,opacity] ${inputErrorClass(!!(touched.name && fieldErrors.name))}`}
                      required
                    />

                    <AnimatePresence>
                      {touched.name && fieldErrors.name && (
                        <motion.div
                          className="pointer-events-none absolute right-3 top-[-30px] z-30"
                          initial={tooltipMotion.initial}
                          animate={tooltipMotion.animate}
                          exit={tooltipMotion.exit}
                          transition={tooltipMotion.transition}
                        >
                          <div className="relative rounded-[14px] border border-red-200/40 bg-[#70343b] px-3 py-2 shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)]">
                            {/* arrow (down) */}
                            <span className="absolute left-6 -bottom-[6px] w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#70343b]" />
                            <span className="absolute left-6 -bottom-[7px] w-0 h-0 border-x-[7px] border-x-transparent border-t-[7px] border-t-red-200/40" />
                            <p className="font-outfit font-medium text-[12px] leading-[140%] tracking-[-0.011em] text-red-100 whitespace-nowrap">
                              {fieldErrors.name}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Message */}
                <div className="relative flex flex-col">
                  <div className="relative flex items-center">
                    <label
                      htmlFor="message"
                      className="absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)]"
                    >
                      Message:
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={1}
                      className={`w-full h-[46px] md:h-[53px] max-[885px]:h-[42px] resize-none rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)] px-4 md:px-6 pl-[88px] md:pl-[95px] pt-[15px] max-[885px]:pt-[8px] focus:outline-none transition-[border-color,opacity] ${inputErrorClass(!!(touched.message && fieldErrors.message))}`}
                      required
                    />

                    <AnimatePresence>
                      {touched.message && fieldErrors.message && (
                        <motion.div
                          className="pointer-events-none absolute right-3 top-[-30px] z-30"
                          initial={tooltipMotion.initial}
                          animate={tooltipMotion.animate}
                          exit={tooltipMotion.exit}
                          transition={tooltipMotion.transition}
                        >
                          <div className="relative rounded-[14px] border border-red-200/40 bg-[#70343b] px-3 py-2 shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)]">
                            {/* arrow (down) */}
                            <span className="absolute left-6 -bottom-[6px] w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#70343b]" />
                            <span className="absolute left-6 -bottom-[7px] w-0 h-0 border-x-[7px] border-x-transparent border-t-[7px] border-t-red-200/40" />
                            <p className="font-outfit font-medium text-[12px] leading-[140%] tracking-[-0.011em] text-red-100 whitespace-nowrap">
                              {fieldErrors.message}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-[46px] md:h-[53px] max-[885px]:h-[42px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-semibold text-white tracking-[0.22em] md:tracking-[0.28em] text-[clamp(14px,1.35vw,16px)] text-center transition-opacity ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'}`}
                >
                  {isSubmitting ? 'SENDING…' : 'SUBMIT'}
                </button>

                {/* Schedule Meeting Button */}
                <a
                  href="https://calendly.com/lutstudios-info/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-[46px] md:h-[53px] max-[885px]:h-[42px] rounded-[20px] border border-white/60 shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] font-outfit font-bold text-white tracking-[0.22em] md:tracking-[0.28em] text-[clamp(14px,1.35vw,16px)] text-center bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%),linear-gradient(0deg,rgba(0,108,253,0.54),rgba(0,108,253,0.54))] hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  SCHEDULE A MEETING
                </a>

              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
