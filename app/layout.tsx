import type { Metadata, Viewport } from "next";
import "@/styles/theme.scss";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "DayReady — Get set for your day",
  description:
    "Plan your tasks, schedule your day, and log meals with a photo — one calm place to get ready for the day ahead.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B2247",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Sora:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
