import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Integrations } from "@/components/landing/integrations";
import { Infrastructure } from "@/components/landing/infrastructure";
import { Performance } from "@/components/landing/performance";
import { Trust } from "@/components/landing/trust";
import { LuminaryCta } from "@/components/landing/luminary-cta";
import { SiteFooter } from "@/components/landing/site-footer";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

export default function Home() {
  return (
    <main className="min-h-screen bg-bq-bg font-satoshi text-bq-heading">
      <ScrollProgress />
      <Nav />
      <Hero />
      <Integrations />
      <Infrastructure />
      <Performance />
      <Trust />
      <LuminaryCta />
      <SiteFooter />
      <AssistantWidget />
    </main>
  );
}
