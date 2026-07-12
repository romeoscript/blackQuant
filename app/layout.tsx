import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { auth } from "@/auth";
import { Providers } from "@/providers";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemePicker } from "@/components/theme-picker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${plexMono.variable} antialiased`}
      >
        <Providers session={session}>
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <ThemePicker />
            <ModeToggle />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
