import type { Metadata } from "next";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href={`${BASE_PATH}/logo-animation.gif`} />
        <link rel="preload" as="image" href={`${BASE_PATH}/loading-bg.jpg`} />

        {/* UI icons (overlay) */}
        <link rel="preload" as="image" href={`${BASE_PATH}/back-arrow.svg`} />
        <link rel="preload" as="image" href={`${BASE_PATH}/instagram.svg`} />
        <link rel="preload" as="image" href={`${BASE_PATH}/linkedin.svg`} />
        <link rel="preload" as="image" href={`${BASE_PATH}/sound.svg`} />
        <link rel="preload" as="image" href={`${BASE_PATH}/email.svg`} />

        {/* Background audio */}
        <link
          rel="preload"
          as="audio"
          href={`${BASE_PATH}/Jesse Gillis - Time to Meditate - Soothing Eternal Synth Pads Soft High Bells.wav`}
          type="audio/wav"
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
