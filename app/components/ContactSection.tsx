import { RefObject, useState } from 'react';
import { motion } from 'framer-motion';
import { VideoBackground } from './VideoBackground';
import styles from './ContactSection.module.css';
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
  showUI
}: ContactSectionProps) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    message: ''
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
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section 
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        shouldShow ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      <VideoBackground 
        videoRef={videoRef}
        src={videoSrc}
        loop
        autoPlay
      />

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-[961px]">
          {/* Title with blur effect container */}
          <motion.div 
            className={styles.titleContainer}
            initial={{
              filter: 'blur(10px)',
              opacity: 0,
              y: 20,
            }}
            animate={{
              filter: showUI ? 'blur(0px)' : 'blur(10px)',
              opacity: showUI ? 1 : 0,
              y: showUI ? 0 : 20,
            }}
            transition={{
              duration: showUI ? 0.6 : 0.4,
              delay: showUI ? 0 : 0,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <h1 className={styles.title}>
            </h1>
            {/* Blur overlay - creates the blur effect on bottom half */}
            <div className={styles.blurOverlay}></div>
          </motion.div>

          {/* Contact Us Card */}
          <motion.div 
            className={styles.contactCard}
            initial={{
              filter: 'blur(10px)',
              opacity: 0,
              y: 20,
            }}
            animate={{
              filter: showUI ? 'blur(0px)' : 'blur(10px)',
              opacity: showUI ? 1 : 0,
              y: showUI ? 0 : 20,
            }}
            transition={{
              duration: showUI ? 0.6 : 0.4,
              delay: showUI ? 0.2 : 0,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            {/* Contact Us Header */}
            <h2 className={styles.contactHeader}>
              CONTACT US
            </h2>
            
            {/* Description */}
            <p className={styles.contactDescription}>
              If you&apos;d like to discuss a potential projects and partnership, please email{' '}
              <a href="mailto:info@lutstudios.com">
                info@lutstudios.com
              </a>
              <br />
              or contact via phone number
            </p>

            {/* Studio Contact Info */}
            <div className={styles.studioInfo}>
              <div className="text-center">
                <p className={styles.studioText}>
                  Los Angeles studio
                  <br />
                  +1 (424) 3030572
                </p>
              </div>
              <div className="text-center">
                <p className={styles.studioText}>
                  Yerevan studio
                  <br />
                  +374 (99) 499838
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form Container - No background, just container */}
          <motion.div 
            className={styles.formContainer}
            initial={{
              filter: 'blur(10px)',
              opacity: 0,
              y: 20,
            }}
            animate={{
              filter: showUI ? 'blur(0px)' : 'blur(10px)',
              opacity: showUI ? 1 : 0,
              y: showUI ? 0 : 20,
            }}
            transition={{
              duration: showUI ? 0.6 : 0.4,
              delay: showUI ? 0.4 : 0,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Email and Phone Row */}
              <div className={styles.inputRow}>
                <div className={styles.inputWrapper}>
                  <label htmlFor="email" className={styles.labelInside}>Email:</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.inputWrapper}>
                  <label htmlFor="phone" className={styles.labelInside}>Phone:</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Name */}
              <div className={styles.inputWrapper}>
                <label htmlFor="name" className={styles.labelInside}>Name:</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.inputFullWidth}`}
                  required
                />
              </div>

              {/* Message */}
              <div className={styles.inputWrapper}>
                <label htmlFor="message" className={styles.labelInside}>Message:</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={1}
                  className={styles.textarea}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitButton}
              >
                SUBMIT
              </button>

              {/* Schedule Meeting Button */}
              <button
                type="button"
                className={styles.scheduleButton}
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
