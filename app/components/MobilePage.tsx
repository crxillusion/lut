'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BASE_PATH } from '../constants/config';
import { assetUrl } from '../utils/assetUrl';
import { ContactForm } from './ContactForm';

// ─── Cases data ────────────────────────────────────────────────────────────────
type CaseItem = {
  desc: string;
  title: string;
  img: string;
  openIn: 'popup' | 'newtab';
  url: string;
};

const CASES: CaseItem[] = [
  {
    title: 'TESTING [HOME]',
    desc: 'Testing [Home] is a audiovisual live performance project produced by LUT Studios. The project included a full marketing campaign and a live concert, where artists Daao and Ayvazovsky collaborated to merge sound and visual art.',
    img: '/cases/5f74027c328b57bc4440ab05dfa0115e909245e3.png',
    openIn: 'popup',
    url: 'https://vimeo.com/1161472471?fl=tl&fe=ec',
  },
  {
    title: 'SHELL NEW YEAR',
    desc: "For Shell's New Year campaign, LUT Studios created a festive CG and photography-based project that captured the holiday spirit through vibrant visuals and storytelling.",
    img: '/cases/f7f9a59fb629bc50bd16b0d625b4121f2ced0c0c.png',
    openIn: 'newtab',
    url: 'https://www.instagram.com/p/DEiMdBYsTA8/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
  },
  {
    title: 'MERCEDES BENZ X WHOODEEN',
    desc: 'In collaboration with Whooden Studios, we created stunning CG images featuring various Mercedes Benz models in diverse environments.',
    img: '/cases/f52f8354b0cae68738cfcd2bfd7e2f28c24e56eb.png',
    openIn: 'newtab',
    url: 'https://www.instagram.com/p/Cfepr6HK6gF/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==',
  },
  {
    title: 'AMIO',
    desc: "AMIO bank's commercial was built around the contrast between chaos and clarity, using stickers as a concept.",
    img: '/cases/7a43535bda67a565f92d4c59b40208caca25857c.jpg',
    openIn: 'popup',
    url: 'https://vimeo.com/1161465970?fl=pl&fe=sh',
  },
  {
    title: 'OVIO AND ORBI',
    desc: "Animation following Orbi's digital journey, created to communicate Ovio's three-month free package as a real, accessible offer.",
    img: '/cases/9cb8ae990c7485afbbdad3534bbb2fb9f0b95ba0.png',
    openIn: 'popup',
    url: 'https://vimeo.com/1161430945?fl=pl&fe=sh',
  },
  {
    title: 'Avanta',
    desc: "Brand film centered on a family's journey to Avanta Medical Center, highlighting care, trust, and a positive treatment experience.",
    img: '/cases/a947072b922f94c359fe8d47a6f82546cd6251ba.png',
    openIn: 'popup',
    url: 'https://vimeo.com/1161424100?fl=pl&fe=sh',
  },
  {
    title: 'SHOONCH',
    desc: 'A minimal, fluid CG animation developed around the idea of transformation, starting from a single water droplet and evolving into the final product.',
    img: '/cases/614242dcf847675c792606557d89585df622ca2d.png',
    openIn: 'popup',
    url: 'https://vimeo.com/1161406195?fl=ip&fe=ec',
  },
  {
    title: 'VIVA',
    desc: 'Over the course of one year, LUT Studios provided creative services for Viva, delivering design, motion graphics, and animation-driven video content.',
    img: '/cases/d7546950bcd3ab692d9d95cf48dbf1f4b49d65ca.jpg',
    openIn: 'newtab',
    url: 'https://www.viva.am/',
  },
  {
    title: 'MAJOR HOUSE',
    desc: 'A lifestyle-focused shoot driven by vibrant tones and natural energy. Warm daylight lighting defined the atmosphere.',
    img: '/cases/9534b83aa66ccdd7e8f10bcea0eeaea278cf4554.jpg',
    openIn: 'newtab',
    url: 'https://www.instagram.com/majorhousehotels/?hl=en',
  },
  {
    title: 'VIMPEL',
    desc: "Over a six-month collaboration, LUT Studios led the planning and execution of Vimpel's marketing and creative content.",
    img: '/cases/d95f75bea90f42feb2c769a38b8c30a17d48bca5.png',
    openIn: 'newtab',
    url: 'https://www.instagram.com/vimpelofficial/?hl=en',
  },
];

// ─── Partners data ─────────────────────────────────────────────────────────────
const PARTNERS = [
  { name: 'OVIO', img: '/partners/ovio.png' },
  { name: 'IDBank', img: '/partners/id_bank.png' },
  { name: 'Avanta', img: '/partners/avanta.png' },
  { name: 'Ameriabank', img: '/partners/ameriabank.png' },
  { name: 'Ararat', img: '/partners/ararat.png' },
  { name: 'Vimpel', img: '/partners/vimpel.png' },
  { name: 'The Bird Cage', img: '/partners/the_bird_cage.png' },
  { name: 'Bar Phoenix', img: '/partners/bar_phoenix.png' },
  { name: 'Mov', img: '/partners/mov.png' },
  { name: 'Cofix', img: '/partners/cofix.png' },
  { name: 'Shell', img: '/partners/shell.png' },
  { name: 'Mercedes-Benz', img: '/partners/mercedes-benz.png' },
  { name: 'Viva', img: '/partners/viva.png' },
  { name: 'Yerevan Mall', img: '/partners/yerevan_mall.png' },
];

// ─── Shared card style object ──────────────────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
  border: '0.5px solid #FFFFFF',
  boxShadow: '7px 9px 14.4px 0px #00000047',
  background:
    'radial-gradient(66.79% 318.35% at 34.13% -210.76%, rgba(185, 176, 155, 0.2) 0%, rgba(240, 240, 240, 0.2) 100%)',
  backdropFilter: 'blur(1.44px)',
  borderRadius: '20px',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toVimeoEmbedUrl(url: string) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (!m) return url;
  return `https://player.vimeo.com/video/${m[1]}?autoplay=1&title=0&byline=0&portrait=0`;
}

// ─── Section title with split-blur effect ─────────────────────────────────────
function SectionTitle({ text, size = 'large' }: { text: string; size?: 'large' | 'medium' }) {
  const cls =
    size === 'large'
      ? 'font-outfit font-bold text-white leading-none tracking-[0.28em] text-[clamp(48px,18vw,96px)]'
      : 'font-outfit font-bold text-white leading-none tracking-[0.28em] text-[clamp(36px,13vw,72px)]';

  return (
    <motion.div
      className="relative mb-[-20px] mx-auto w-fit"
      initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
    >
      <h2 className={cls}>{text}</h2>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 blur-[3px] [clip-path:inset(65%_0_0_0)] ${cls}`}
      >
        {text}
      </span>
    </motion.div>
  );
}

// ─── Video popup ───────────────────────────────────────────────────────────────
function MobileVideoPopup({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <motion.div
        className="w-full max-w-lg rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.94, filter: 'blur(14px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 24, scale: 0.94, filter: 'blur(14px)' }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
          <div className="text-white font-outfit font-medium text-sm opacity-80 truncate pr-4">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="relative w-full aspect-video bg-black">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={toVimeoEmbedUrl(url)}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={title}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Case card ────────────────────────────────────────────────────────────────
function MobileCaseCard({ item }: { item: CaseItem }) {
  const [popup, setPopup] = useState<{ title: string; url: string } | null>(null);

  const handleAction = () => {
    if (item.openIn === 'popup') {
      setPopup({ title: item.title, url: item.url });
    } else {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <motion.div
        className="relative w-full min-h-[220px] cursor-pointer overflow-hidden"
        style={{
          borderRadius: 20,
          border: '0.5px solid rgba(255,255,255,0.4)',
          boxShadow: '7px 9px 14.4px 0px #00000047',
        }}
        onClick={handleAction}
        initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BASE_PATH}${item.img})` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[220px] px-5 py-6 text-center text-white">
          <p className="font-outfit font-bold text-[16px] tracking-[0.4em] uppercase mb-2">{item.title}</p>
          <p className="font-outfit font-medium text-[12px] leading-[150%] opacity-90 line-clamp-3">{item.desc}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-black/30 px-5 py-2 font-outfit font-semibold text-[11px] tracking-[0.22em] uppercase">
            {item.openIn === 'popup' ? (
              <>
                <span>PLAY</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              </>
            ) : (
              <>
                <span>OPEN</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z" />
                  <path d="M5 5h6v2H7v10h10v-4h2v6H5V5z" />
                </svg>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {popup && (
          <MobileVideoPopup title={popup.title} url={popup.url} onClose={() => setPopup(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Top banner ────────────────────────────────────────────────────────────────
function DesktopBanner() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center py-3 px-6 pointer-events-none"
      initial={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
      animate={{ opacity: scrolled ? 0.35 : 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <span
        className="font-outfit font-medium text-[13px] tracking-[0.12em] text-white/90 text-center"
        style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}
      >
        * For full experience use desktop
      </span>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function MobilePage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // globals.css sets overflow:hidden + height:100vh on body (desktop requirement).
  // Inject a style tag that overrides it with !important so mobile can scroll.
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-mobile-scroll', 'true');
    style.textContent = 'html, body { overflow: auto !important; height: auto !important; }';
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    const play = () => v.play().catch(() => {});
    if (v.readyState >= 2) {
      play();
    } else {
      v.addEventListener('canplay', play, { once: true });
    }
  }, []);

  return (
    <div className="relative bg-black">
      {/* Fixed video background */}
      <video
        ref={videoRef}
        src={assetUrl('/videos/Contact_loop.mp4')}
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
        muted
        playsInline
        loop
        autoPlay
        aria-hidden="true"
      />

      {/* Dark scrim — pointer-events-none so touches pass through to scrollable content */}
      <div className="fixed inset-0 z-[1] bg-black/40 pointer-events-none" aria-hidden />

      {/* Fixed top banner */}
      <DesktopBanner />

      {/* Scrollable content — sits above fixed layers in z-order */}
      <div className="relative z-10 flex flex-col">

        {/* ── 1. ABOUT ── */}
        <section className="relative flex items-center justify-center px-5 min-h-[100vh]">
          <motion.div
            className="relative z-10 w-full max-w-sm px-6 py-35 overflow-hidden"
            style={CARD_STYLE}
            initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Rotated background image — scoped to the card */}
            <div className="absolute pointer-events-none w-full h-full left-0 top-0" aria-hidden>
              <div
                className="bg-center absolute bg-contain bg-no-repeat top-0"
                style={{
                  backgroundImage: `url(${BASE_PATH}/about-bg.png)`,
                  transform: 'rotate(90deg) translate(20%, 70%)',
                  width: '100cqh',
                  height: '100cqw'
                }}
              />
            </div>
            {/* Gradient + dark overlay on top of the rotated bg */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(66.79% 318.35% at 34.13% -210.76%, rgba(185, 176, 155, 0.2) 0%, rgba(240, 240, 240, 0.2) 100%)',
              }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-black/45 pointer-events-none" aria-hidden />

            {/* Text — sits above the bg layers */}
            <p
              className="relative z-10 font-outfit font-medium text-white text-center"
              style={{ fontSize: 30, lineHeight: '150%', letterSpacing: '-0.011em' }}
            >
              Founded in 2022 by a group of creative individuals, LUT Studios is a team of innovative thinkers
              who thrive on turning challenges into opportunities. Our mission is to create extraordinary outcomes
              by finding creative solutions to every problem we encounter.
            </p>
          </motion.div>
        </section>

        {/* ── 2. CASES ── */}
        <section className="relative px-4">
          <SectionTitle text="CASES" />

          <motion.div
            className="px-5 py-5 mb-6"
            style={CARD_STYLE}
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          >
            <p className="font-outfit font-medium text-white text-[13px] leading-[170%] text-center">
              Our portfolio features a blend of client collaborations and our own creative explorations. Each project,
              whether commercial or personal, reflects our passion for visual storytelling and experimentation.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {CASES.map((item, idx) => (
              <MobileCaseCard key={`${item.title}-${idx}`} item={item} />
            ))}
          </div>
        </section>

        {/* ── 3. PARTNERS ── */}
        <section className="relative px-4 py-16">
          <SectionTitle text="PARTNERS" size="medium" />

          <div className="grid grid-cols-2 gap-3">
            {PARTNERS.map((partner, idx) => (
              <motion.div
                key={partner.name}
                className="flex items-center justify-center py-6 px-[30px]"
                style={CARD_STYLE}
                initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(0.3, idx * 0.04),
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                <img
                  src={`${BASE_PATH}${partner.img}`}
                  alt={partner.name}
                  className="w-full max-h-[60px] object-contain"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 4. CONTACT ── */}
        <section className="relative px-4 pt-8 pb-16">
          <SectionTitle text="READY?" />

          <motion.div
            className="px-5 py-5 mb-5"
            style={CARD_STYLE}
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          >
            <h3 className="font-outfit font-bold tracking-[0.5em] text-center text-white mb-3 text-[16px]">
              CONTACT US
            </h3>
            <p className="font-outfit font-medium text-center text-white text-[13px] leading-[160%] mb-3">
              If you&apos;d like to discuss a potential project and partnership, please email{' '}
              <a className="underline hover:opacity-70 transition-opacity" href="mailto:info@lutstudios.com">
                info@lutstudios.com
              </a>
              <br />or contact via phone number
            </p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="font-outfit font-medium text-white text-[12px] leading-[160%]">
                  Los Angeles studio<br />
                  <span suppressHydrationWarning>+1 (424) 3030572</span>
                </p>
              </div>
              <div>
                <p className="font-outfit font-medium text-white text-[12px] leading-[160%]">
                  Yerevan studio<br />
                  <span suppressHydrationWarning>+374 (99) 499838</span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
          >
            <ContactForm />
          </motion.div>
        </section>

      </div>
    </div>
  );
}
