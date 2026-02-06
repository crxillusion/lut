'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface CasesSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  isVisible: boolean;
  onBackClick?: () => void;
}

type CaseItem = {
  desc: string;
  title: string;
  img: string;
  openIn: 'popup' | 'newtab';
  url: string;
  wide?: boolean;
};

const CASES: CaseItem[] = [
  {
    title: 'TESTING [HOME]',
    desc:
      'Testing [Home] is a audiovisual live performance project produced by LUT Studios. The project included a full marketing campaign and a live concert, where artists Daao and Ayvazovsky collaborated to merge sound and visual art. Featuring a cloth art installation at HAyart and an immersive live music performance, the event explored the intersection of emotion, space, and digital expression.',
    img: '/cases/5f74027c328b57bc4440ab05dfa0115e909245e3.png',
    openIn: 'popup',
    url: 'https://vimeo.com/1161472471?fl=tl&fe=ec',
  },
  {
    title: 'SHELL NEW YEAR',
    desc:
      'For Shell’s New Year campaign, LUT Studios created a festive CG and photography-based project that captured the holiday spirit through vibrant visuals and storytelling. The campaign featured a custom photoshoot and CG  built around a unique tagline concept. A creative experience that combined elegance, innovation, and seasonal warmth to reflect Shell’s brand in a fresh, memorable way.',
    img: '/cases/f7f9a59fb629bc50bd16b0d625b4121f2ced0c0c.png',
    openIn: 'newtab',
    url: 'https://www.instagram.com/p/DEiMdBYsTA8/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
  },
  {
    title: 'MERCEDES BENZ X WHOODEEN',
    desc:
      'In collaboration with Whooden Studios, we created stunning CG images featuring various Mercedes Benz models in diverse environments. This project involved partnerships with fashion brands and virtual influencers, Ria and Zinn.  The concept centered on blending real and computer-generated imagery, drawing inspiration from the photography style of Alex Webb. The result is a captivating fusion of reality and digital art, showcasing the elegance of Mercedes Benz vehicles in an innovative light.',
    img: '/cases/f52f8354b0cae68738cfcd2bfd7e2f28c24e56eb.png',
    openIn: 'newtab',
    url: 'https://www.instagram.com/p/Cfepr6HK6gF/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==',
  },
  {
    title: 'AMIO',
    desc:
      "AMIO bank's commercial was built around the contrast between chaos and clarity, using stickers as a concept. The project relied on close collaboration between directing and VFX supervision from the earliest stages, with the set carefully hand-crafted and adjusted before filming to support seamless integration.",
    img: '/cases/7a43535bda67a565f92d4c59b40208caca25857c.jpg',
    openIn: 'popup',
    url: 'https://vimeo.com/1161465970?fl=pl&fe=sh',
  },
  {
    title: 'OVIO AND ORBI',
    desc:
      "Animation following Orbi's digital journey, created to communicate Ovio's three-month free package as a real, accessible offer. The film builds a cohesive digital world through carefully designed color, motion, and visual detail, translating the product message into a clear and engaging story. The project was crafted through close collaboration to bring animation into a unified brand experience.",
    img: '/cases/9cb8ae990c7485afbbdad3534bbb2fb9f0b95ba0.png',
    openIn: 'popup',
    url: 'https://vimeo.com/1161430945?fl=pl&fe=sh',
    wide: true,
  },
  {
    title: 'Avanta',
    desc:
      'Brand film centered on a family’s journey to Avanta Medical Center, highlighting care, trust, and a positive treatment experience. The film uses stylized VFX, where sound design, and visual rhythm work in harmony to shape emotion and atmosphere. Every sound layer was carefully crafted to add depth and texture, supporting the narrative and enhancing each scene.',
    img: '/cases/a947072b922f94c359fe8d47a6f82546cd6251ba.png',
    openIn: 'popup',
    url: 'https://vimeo.com/1161424100?fl=pl&fe=sh',
  },
  {
    title: 'SHOONCH',
    desc:
      'A minimal, fluid CG animation developed around the idea of transformation, starting from a single water droplet and evolving into the final product. The project focuses on precise motion, clean transitions, and subtle sound integration to express the purity and calm character of the Shoonch brand.',
    img: '/cases/614242dcf847675c792606557d89585df622ca2d.png',
    openIn: 'popup',
    url: 'https://vimeo.com/1161406195?fl=ip&fe=ec',
  },
  {
    title: 'VIVA',
    desc:
      'Over the course of one year, LUT Studios provided creative services for Viva, delivering design, motion graphics, and animation-driven video content. A key highlight of the collaboration was the development of Viva’s 5G+ campaign, where we led the visual design and creative execution to communicate speed, innovation, and technological advancement. \n The partnership focused on consistent visual identity, dynamic motion language, and impactful campaign storytelling.',
    img: '/cases/d7546950bcd3ab692d9d95cf48dbf1f4b49d65ca.jpg',
    openIn: 'newtab',
    url: 'https://www.viva.am/',
  },
  {
    title: 'MAJOR HOUSE',
    desc:
      'A lifestyle-focused shoot driven by vibrant tones and natural energy. Warm daylight lighting defined the atmosphere, enhancing color, depth, and an effortless, lived-in feel throughout the space.',
    img: '/cases/9534b83aa66ccdd7e8f10bcea0eeaea278cf4554.jpg',
    openIn: 'newtab',
    url: 'https://www.instagram.com/majorhousehotels/?hl=en',
  },
  {
    title: 'VIMPEL',
    desc:
      'Over a six-month collaboration, LUT Studios led the planning and execution of Vimpel’s marketing and creative content. The scope included concept development, creative direction, and full content production  spanning video, photography, animation, and graphic design.\n In addition to ongoing digital content, we also produced and supported two key brand events: Beer Days and LUT Studios’ anniversary, both sponsored by Vimpel. The collaboration focused on building consistent brand presence, engaging visuals, and long-term creative strategy.',
    img: '/cases/d95f75bea90f42feb2c769a38b8c30a17d48bca5.png',
    openIn: 'newtab',
    url: 'https://www.instagram.com/vimpelofficial/?hl=en',
    wide: true,
  },
];

function toVimeoEmbedUrl(url: string) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (!m) return url;
  return `https://player.vimeo.com/video/${m[1]}?autoplay=1&title=0&byline=0&portrait=0`;
}

const BG_GRADIENT =
  'bg-[radial-gradient(266.84%_474.58%_at_-81.46%_103.52%,_#392947_6.73%,_#CC927C_27.62%,_#834418_52.88%,_#291B3E_76.92%,_#010103_100%)]';

const INTRO_CARD_CLASS =
  "relative w-full rounded-[20px] border border-white/60 bg-[length:770px,100%] bg-bottom bg-no-repeat bg-[url('/cases-bg.png'),radial-gradient(66.79%_318.35%_at_34.13%_-210.76%,rgba(185,176,155,0.20)_0%,rgba(240,240,240,0.20)_100%)] shadow-[7px_9px_14.4px_0px_rgba(0,0,0,0.28)] backdrop-blur-[1.44px] px-[18px] py-[22px] md:px-[50px] md:py-[42px] md:pb-[20rem]";

const GRID_CARD_CLASS =
  'relative w-full h-full rounded-[20px] border-[0.5px] border-white/40 shadow-[7px_9px_14.4px_0px_#00000047] overflow-hidden';

function VideoPopup({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/15">
          <div className="text-white font-outfit font-medium text-sm opacity-80">Video</div>
          <button
            type="button"
            className="text-white/80 hover:text-white transition-colors"
            onClick={onClose}
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
            title="Vimeo video"
          />
        </div>
      </div>
    </div>
  );
}

function CaseCard({ item }: { item: CaseItem }) {
  return (
    <div className={GRID_CARD_CLASS}>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.img})` }} />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-[1] h-full w-full flex flex-col items-center justify-center px-8 py-25 text-white">
        <h3 className="font-outfit font-bold text-[24px] leading-[150%] tracking-[0.5em] text-center uppercase">
          {item.title}
        </h3>
        <p className="mt-4 font-outfit font-medium text-[15px] leading-[150%] tracking-[-0.011em] text-center">
          {item.desc}
        </p>
      </div>
    </div>
  );
}

export function CasesSection({
  videoRef,
  videoSrc,
  isVisible,
  onBackClick,
}: CasesSectionProps) {
  void videoRef;
  void videoSrc;
  void onBackClick;

  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // While building Cases, keep scrolling inside this screen only.
  useEffect(() => {
    if (!isVisible) return;
    const el = sectionRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const sc = scrollContainerRef.current;
      if (!sc) return;

      const canScroll = sc.scrollHeight > sc.clientHeight + 1;
      if (!canScroll) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const atTop = sc.scrollTop <= 0;
      const atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1;
      const goingDown = e.deltaY > 0;
      const goingUp = e.deltaY < 0;

      const shouldStayOnThisScreen = (goingDown && !atBottom) || (goingUp && !atTop);

      if (shouldStayOnThisScreen) {
        e.stopPropagation();
        return;
      }

      // At edges, prevent leaving the screen for now.
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isVisible]);

  const [popupUrl, setPopupUrl] = useState<string | null>(null);

  const motionCommon = {
    initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
    animate: {
      filter: isVisible ? 'blur(0px)' : 'blur(10px)',
      opacity: isVisible ? 1 : 0,
      y: isVisible ? 0 : 20,
    },
    transitionBase: { duration: isVisible ? 0.6 : 0.4, ease: [0.23, 1, 0.32, 1] as const },
  };

  return (
    <section
      ref={sectionRef}
      className={`fixed inset-0 w-full h-screen transition-opacity duration-0 ${
        isVisible ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'
      }`}
    >
      {isVisible && (
        <div
          ref={scrollContainerRef}
          className={`absolute inset-0 w-full h-full overflow-y-auto [scrollbar-gutter:stable] ${BG_GRADIENT} px-4 md:px-8 py-25`}
        >
          <div className="mx-auto w-[85%] max-w-[961px]">
            {/* Title (layered/blurred effect) */}
            <motion.div
              className="relative mb-[-2.5rem] md:mb-[-4rem] max-h-[885px]:hidden mx-auto w-[90%]"
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

            {/* Intro card */}
            <motion.div
              className={INTRO_CARD_CLASS}
              initial={motionCommon.initial}
              animate={motionCommon.animate}
              transition={{ ...motionCommon.transitionBase, delay: 0.2 }}
            >
              <p className="m-0 font-outfit font-medium text-center text-white text-[clamp(14px,1.35vw,20px)] leading-[150%] tracking-[-0.011em]">
                Our portfolio features a blend of client collaborations and our own creative explorations. Each project,
                whether commercial or personal, reflects our passion for visual storytelling and experimentation.
              </p>
            </motion.div>

            {/* Grid */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 pb-16">
              {CASES.map((item, idx) => {
                const wrapperClass = item.wide ? 'md:col-span-2 min-h-[320px]' : 'min-h-[320px]';

                if (item.openIn === 'newtab') {
                  return (
                    <a
                      key={`${item.title}-${idx}`}
                      className={wrapperClass}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <CaseCard item={item} />
                    </a>
                  );
                }

                return (
                  <button
                    key={`${item.title}-${idx}`}
                    type="button"
                    className={`${wrapperClass} text-left cursor-pointer`}
                    onClick={() => setPopupUrl(item.url)}
                  >
                    <CaseCard item={item} />
                  </button>
                );
              })}
            </div>
          </div>

          {popupUrl && <VideoPopup url={popupUrl} onClose={() => setPopupUrl(null)} />}
        </div>
      )}
    </section>
  );
}
