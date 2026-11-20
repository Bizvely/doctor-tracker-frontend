import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Doctor Tracker | Care Guide BD",
    template: "%s | Doctor Tracker",
  },
  description: "Secure admin portal to manage doctors and their patients.",
  icons: { icon: "/favicon.svg" },
  // এটা প্রাইভেট admin portal, তাই search engine-এ আসার দরকার নেই
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
