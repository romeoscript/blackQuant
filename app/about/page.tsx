import type { Metadata } from "next";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Nav } from "@/components/landing/nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { AboutHero } from "@/components/about/hero";
import { AboutStats } from "@/components/about/stats";
import { AboutMission } from "@/components/about/mission";
import { AboutCoreValues } from "@/components/about/core-values";
import { AboutJourney } from "@/components/about/journey";
import { AboutFaq } from "@/components/about/faq";
import { AboutContactCta } from "@/components/about/contact-cta";

export const metadata: Metadata = {
  title: "About Us · BlackQuant",
  description:
    "BlackQuant builds institutional-grade signal intelligence for independent traders — systematic edge, no guesswork.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bq-bg font-satoshi text-bq-heading">
      <ScrollProgress />
      <Nav />
      <AboutHero />
      <AboutStats />
      <AboutMission />
      <AboutCoreValues />
      <AboutJourney />
      <AboutFaq />
      <AboutContactCta />
      <SiteFooter />
      <AssistantWidget />
    </main>
  );
}
