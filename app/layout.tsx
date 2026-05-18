import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { BASE_PATH } from "./constants/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "LUT - Let Us Transform",
  description: "Motion design and content creation agency transforming businesses through creative excellence",
  icons: {
    icon: [{ url: `${BASE_PATH}/favicon.png`, type: 'image/png' }],
  },
  // Preload critical resources as early as possible
  other: {
    'x-ua-compatible': 'IE=edge',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head suppressHydrationWarning>
        {/* Disable zoom on keyboard shortcuts */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
                  e.preventDefault();
                }
              }, false);
              document.addEventListener('wheel', (e) => {
                if ((e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                }
              }, { passive: false });
            `,
          }}
        />
        {/* UI icons (overlay) */}
        <link rel="preload" as="image" href={`${BASE_PATH}/back-arrow.svg`} type="image/svg+xml" />
        <link rel="preload" as="image" href={`${BASE_PATH}/instagram.svg`} type="image/svg+xml" />
        <link rel="preload" as="image" href={`${BASE_PATH}/linkedin.svg`} type="image/svg+xml" />
        <link rel="preload" as="image" href={`${BASE_PATH}/sound.svg`} type="image/svg+xml" />

        {/* Background audio */}
        <link
          rel="preload"
          as="audio"
          href={`${BASE_PATH}/Jesse Gillis - Time to Meditate - Soothing Eternal Synth Pads Soft High Bells.wav`}
          type="audio/wav"
          crossOrigin="anonymous"
        />

        {/* Navigation transition sounds */}
        <link
          rel="preload"
          as="audio"
          href={`${BASE_PATH}/Forward.wav`}
          type="audio/wav"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="audio"
          href={`${BASE_PATH}/Backward.wav`}
          type="audio/wav"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
