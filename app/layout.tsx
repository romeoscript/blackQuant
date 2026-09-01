import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { auth } from "@/auth";
import { SITE_URL } from "@/lib/site";
import { Providers } from "@/providers";
import { BrandLoader } from "@/components/brand-loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});


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
  // Without a base, every relative `alternates`/`openGraph` URL a page declares
  // is emitted as-is — and a crawler or feed reader resolves those against its
  // own host, not ours. Set once here so pages can keep declaring paths.
  metadataBase: new URL(SITE_URL),
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
        <BrandLoader />
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
