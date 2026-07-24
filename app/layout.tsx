import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { auth } from "@/auth";
import { Providers } from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

// Satoshi / Clash are self-hosted rather than pulled from api.fontshare.com:
// a third-party @import inside globals.css is render-blocking and adds a
// CSS→CSS→font request chain in front of the LCP text. next/font inlines the
// @font-face rules and emits a same-origin <link rel=preload> for each file.
const satoshi = localFont({
  variable: "--font-satoshi-local",
  display: "swap",
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Satoshi-Black.woff2", weight: "900", style: "normal" },
  ],
});

const clashDisplay = localFont({
  variable: "--font-clash-local",
  display: "swap",
  src: [
    { path: "./fonts/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "BlackQuant",
  description: "BlackQuant — quantitative trading platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const palette = (await cookies()).get("palette")?.value;

  return (
    <html
      lang="en"
      className={palette ? `theme-${palette}` : undefined}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${plexMono.variable} ${satoshi.variable} ${clashDisplay.variable} antialiased`}
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
