import type { Metadata, Viewport } from "next";
import { Baloo_2, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const balooTitle = Baloo_2({
  variable: "--font-title",
  subsets: ["vietnamese"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Dưa Béo",
  description: "Cute meal ideas with toddler-sized portions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fff4f8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${balooTitle.variable}`}>
      <body>{children}</body>
    </html>
  );
}
