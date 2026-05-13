'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ContactFormProps {
  /** When true, field animations and opacity follow the showUI flag */
  showUI?: boolean;
  /** Extra className for the outer wrapper */
  className?: string;
}

export function ContactForm({ showUI = true, className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    message: '',
  });

  const [touched, setTouched] = useState<{ [K in keyof typeof formData]?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    const v = value.trim();
    if (!v) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email.';
    if (v.length > 254) return 'Email is too long.';
    return null;
  };

  const validateName = (value: string) => {
    const v = value.trim();
    if (!v) return 'Name is required.';
    if (v.length < 2) return 'Name must be at least 2 characters.';
    if (v.length > 100) return 'Name is too long (max 100 characters).';
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
    if (!/^[0-9+()\-\s]{7,20}$/.test(v)) return 'Please enter a valid phone number.';
    return null;
  };

  const sanitizeInput = (value: string): string => {
    return value.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, 2000);
  };

  const fieldErrors = useMemo(() => ({
    email: validateEmail(formData.email),
    phone: validatePhone(formData.phone),
    name: validateName(formData.name),
    message: validateMessage(formData.message),
  }), [formData.email, formData.phone, formData.name, formData.message]);

  const isFormValid = useMemo(
    () => !fieldErrors.email && !fieldErrors.phone && !fieldErrors.name && !fieldErrors.message,
    [fieldErrors],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, phone: true, name: true, message: true });
    if (!isFormValid) return;
    setIsSubmitting(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    fd.set('email', sanitizeInput(formData.email));
    fd.set('phone', sanitizeInput(formData.phone));
    fd.set('name', sanitizeInput(formData.name));
    fd.set('message', sanitizeInput(formData.message));
    fd.set('form-name', 'contact');

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(
          Array.from(fd.entries()).map(([k, v]) => [k, String(v)] as [string, string])
        ).toString(),
      });
      if (!response.ok) throw new Error('Form submission failed');
      setIsSubmitted(true);
      setFormData({ email: '', phone: '', name: '', message: '' });
      setTouched({});
      window.setTimeout(() => setIsSubmitted(false), 3500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const inputErrorClass = (hasError: boolean) =>
    hasError ? 'border-red-300/90 focus:border-red-200' : 'focus:border-white';

  const tooltipMotion = {
    initial: { opacity: 0, y: 6, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: 6, filter: 'blur(6px)' },
    transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] as const },
  };

  const BASE_INPUT =
    'w-full h-[46px] md:h-[53px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)] focus:outline-none transition-[border-color,opacity]';

  const LABEL_CLASS =
    'absolute left-4 md:left-6 z-[1] pointer-events-none font-outfit font-medium text-white tracking-[-0.011em] text-[clamp(14px,1.35vw,16px)]';

  function Tooltip({ message }: { message: string }) {
    return (
      <motion.div
        className="pointer-events-none absolute right-3 top-[-30px] z-30"
        initial={tooltipMotion.initial}
        animate={tooltipMotion.animate}
        exit={tooltipMotion.exit}
        transition={tooltipMotion.transition}
      >
        <div className="relative rounded-[14px] border border-red-200/40 bg-[#70343b] px-3 py-2 shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)]">
          <span className="absolute left-6 -bottom-[6px] w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#70343b]" />
          <span className="absolute left-6 -bottom-[7px] w-0 h-0 border-x-[7px] border-x-transparent border-t-[7px] border-t-red-200/40" />
          <p className="font-outfit font-medium text-[12px] leading-[140%] tracking-[-0.011em] text-red-100 whitespace-nowrap">
            {message}
          </p>
        </div>
      </motion.div>
    );
  }

  void error; // consumed below if needed

  return (
    <div className={className}>
      {/* Success modal */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[6px]" onClick={() => setIsSubmitted(false)} />
            <motion.div
              className="relative w-full max-w-[720px] rounded-[24px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.22)_0%,rgba(240,240,240,0.22)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.35)] backdrop-blur-[1.72px] px-6 py-7"
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)', scale: 0.98 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, y: 10, filter: 'blur(10px)', scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-outfit font-bold text-white tracking-[0.18em] text-[14px]">MESSAGE SENT</p>
                  <p className="mt-2 font-outfit font-medium text-white/90 text-[14px] leading-[150%] tracking-[-0.011em]">
                    Thank you — we received your message and will be in touch shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="shrink-0 h-[42px] rounded-[18px] border border-white/60 px-5 font-outfit font-semibold text-white tracking-[0.22em] text-[12px] hover:opacity-80 transition-opacity"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        name="contact"
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        className={`flex flex-col gap-4 transition-[filter,opacity] duration-300 ${isSubmitted ? 'blur-[6px] opacity-60 pointer-events-none' : ''}`}
        noValidate
      >
        <input type="hidden" name="form-name" value="contact" />
        <p className="hidden"><label>Don&apos;t fill this out if you&apos;re human: <input name="bot-field" /></label></p>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <label htmlFor="cf-email" className={LABEL_CLASS}>Email:</label>
              <input
                id="cf-email" type="email" name="email"
                value={formData.email} onChange={handleChange} onBlur={handleBlur}
                autoComplete="email" inputMode="email" maxLength={254}
                className={`${BASE_INPUT} pl-[70px] ${inputErrorClass(!!(touched.email && fieldErrors.email))}`}
                required
              />
              <AnimatePresence>
                {touched.email && fieldErrors.email && <Tooltip message={fieldErrors.email} />}
              </AnimatePresence>
            </div>
          </div>

          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <label htmlFor="cf-phone" className={LABEL_CLASS}>Phone:</label>
              <input
                id="cf-phone" type="tel" name="phone"
                value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                autoComplete="tel" inputMode="tel" maxLength={20}
                className={`${BASE_INPUT} pl-[75px] ${inputErrorClass(!!(touched.phone && fieldErrors.phone))}`}
                required
              />
              <AnimatePresence>
                {touched.phone && fieldErrors.phone && <Tooltip message={fieldErrors.phone} />}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="relative flex items-center">
          <label htmlFor="cf-name" className={LABEL_CLASS}>Name:</label>
          <input
            id="cf-name" type="text" name="name"
            value={formData.name} onChange={handleChange} onBlur={handleBlur}
            autoComplete="name" maxLength={100}
            className={`${BASE_INPUT} pl-[75px] ${inputErrorClass(!!(touched.name && fieldErrors.name))}`}
            required
          />
          <AnimatePresence>
            {touched.name && fieldErrors.name && <Tooltip message={fieldErrors.name} />}
          </AnimatePresence>
        </div>

        {/* Message */}
        <div className="relative flex items-center">
          <label htmlFor="cf-message" className={LABEL_CLASS}>Message:</label>
          <textarea
            id="cf-message" name="message"
            value={formData.message} onChange={handleChange} onBlur={handleBlur}
            rows={1} maxLength={2000}
            className={`${BASE_INPUT} resize-none pl-[95px] pt-[13px] h-[46px] ${inputErrorClass(!!(touched.message && fieldErrors.message))}`}
            required
          />
          <AnimatePresence>
            {touched.message && fieldErrors.message && <Tooltip message={fieldErrors.message} />}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full h-[46px] rounded-[20px] border border-white/60 bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] font-outfit font-semibold text-white tracking-[0.22em] text-[14px] text-center transition-opacity ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'}`}
        >
          {isSubmitting ? 'SENDING…' : 'SUBMIT'}
        </button>

        {/* Schedule */}
        <a
          href="https://calendly.com/lutstudios-info/30min"
          target="_blank" rel="noopener noreferrer"
          className="w-full h-[46px] flex items-center justify-center rounded-[20px] border border-white/60 shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] font-outfit font-bold text-white tracking-[0.22em] text-[14px] text-center bg-[radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%),linear-gradient(0deg,rgba(0,108,253,0.54),rgba(0,108,253,0.54))] hover:opacity-90 transition-opacity"
        >
          SCHEDULE A MEETING
        </a>
      </form>
    </div>
  );
}
