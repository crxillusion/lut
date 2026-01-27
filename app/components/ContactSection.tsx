import { RefObject, useState } from 'react';
import { VideoBackground } from './VideoBackground';
import styles from './ContactSection.module.css';

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
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form submitted:', formData);
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
      <div className="relative z-10 h-full flex items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-[961px]">
          {/* Title */}
          <h1 className={styles.title}>
            READY?
          </h1>

          {/* Contact Us Card */}
          <div className={styles.contactCard}>
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
          </div>

          {/* Form Container - No background, just container */}
          <div className={styles.formContainer}>
            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Email and Phone Row */}
              <div className={styles.inputRow}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email:"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone:"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              {/* Name */}
              <input
                type="text"
                name="name"
                placeholder="Name:"
                value={formData.name}
                onChange={handleChange}
                className={`${styles.input} ${styles.inputFullWidth}`}
                required
              />

              {/* Message */}
              <textarea
                name="message"
                placeholder="Message:"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className={styles.textarea}
              />

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

            {/* Social Media Links */}
            <div className={styles.socialLinks}>
              <a 
                href="https://skype.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.5 3.5C7.25 3.5 3 7.75 3 13c0 2.38.92 4.55 2.42 6.19-.05.38-.08.76-.08 1.15 0 2.5 2 4.5 4.5 4.5.38 0 .76-.03 1.13-.08C12.61 26.08 14.78 27 17.13 27c5.25 0 9.5-4.25 9.5-9.5S22.38 8 17.13 8c-2.35 0-4.52.92-6.13 2.42C10.62 10.03 10.24 10 9.87 10c-2.5 0-4.5 2-4.5 4.5 0 .38.03.76.08 1.13C3.92 14.05 3 11.88 3 9.5 3 4.25 7.25 0 12.5 0S22 4.25 22 9.5c0 2.38-.92 4.55-2.42 6.19.05.38.08.76.08 1.15 0 2.5-2 4.5-4.5 4.5-.38 0-.76-.03-1.13-.08-1.64 1.5-3.81 2.42-6.16 2.42-5.25 0-9.5-4.25-9.5-9.5S3.62 5 8.87 5c2.35 0 4.52.92 6.13 2.42C15.38 7.03 15.76 7 16.13 7c2.5 0 4.5 2 4.5 4.5 0 .38-.03.76-.08 1.13C22.08 11.05 23 8.88 23 6.5 23 1.25 18.75-3 13.5-3S4 1.25 4 6.5c0 2.38.92 4.55 2.42 6.19-.05.38-.08.76-.08 1.15 0 2.5 2 4.5 4.5 4.5.38 0 .76-.03 1.13-.08C13.61 19.08 15.78 20 18.13 20c5.25 0 9.5-4.25 9.5-9.5S23.38 1 18.13 1c-2.35 0-4.52.92-6.13 2.42C11.62 3.03 11.24 3 10.87 3c-2.5 0-4.5 2-4.5 4.5z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
