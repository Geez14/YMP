import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { PwaRegisterServiceWorker } from "@/components/pwa/pwa-register-service-worker";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "YMP";

export const metadata: Metadata = {
  title: appName,
  description: "Private OAuth music player",
  manifest: "/manifest.json",
  icons: {
    icon: "/ymp-icon.svg",
    shortcut: "/ymp-icon.svg",
    apple: "/ymp-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${jakarta.variable} font-jakarta`}>
        {children}
        <PwaRegisterServiceWorker />
        <SpeedInsights />
      </body>
    </html>
  );
}
