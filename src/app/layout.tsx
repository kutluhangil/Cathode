import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { InstallHint } from "@/components/InstallHint";

// Geist — premium grotesk arayüz + mono terminal vurguları (spec §4 tipografi).
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cathode.local"),
  title: "Cathode",
  description:
    "Cathode — tarayıcıda çalışan, özgün tasarımlı retro işletim sistemi kabuğu.",
  applicationName: "Cathode",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Cathode", statusBarStyle: "black" },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  openGraph: {
    title: "Cathode",
    description: "Tarayıcıda çalışan, özgün tasarımlı retro işletim sistemi.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cathode",
    description: "Tarayıcıda çalışan, özgün tasarımlı retro işletim sistemi.",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <InstallHint />

        {/* CRT overlay katmanları — her zaman render, görünürlük CSS data-crt'ye bağlı */}
        <div className="crt-layer crt-grille" aria-hidden="true" />
        <div className="crt-layer crt-vignette" aria-hidden="true" />
        <div className="crt-layer crt-grain" aria-hidden="true" />

        {/* Cathode 5100 monitör çerçevesi — görünürlük CSS data-monitor'a bağlı */}
        <div className="monitor-mask" aria-hidden="true" />
        <div className="monitor-glare" aria-hidden="true" />
        <div className="monitor-plate" aria-hidden="true">
          <span>cathode 5100</span>
          <span className="monitor-led" />
        </div>
      </body>
    </html>
  );
}
