import type { Metadata } from "next";
import Image from "next/image";
import { Check, Download, Mail, Newspaper, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";
import { ContactCta } from "@/components/landing/contact-cta";
import {
  Band,
  BandHeading,
  Card,
  PageHero,
  PageShell,
} from "@/components/marketing/page-shell";
import {
  BOILERPLATE_LONG,
  BOILERPLATE_SHORT,
  BRAND_ASSETS,
  BRAND_COLORS,
  FACTS,
  PRESS_INBOX,
  TYPEFACE,
  USAGE_RULES,
  type BrandAsset,
} from "@/components/press/data";
import { CopyBlock } from "@/components/press/copy-block";

const STAGGER = 60;

export const metadata: Metadata = {
  title: "Press Kit · BlackQuant",
  description:
    "Brand assets, company boilerplate, key facts and media contact for BlackQuant — non-custodial execution infrastructure for on-chain markets.",
  alternates: { canonical: "/press" },
};

export default function PressPage() {
  return (
    <PageShell>
      <PageHero
        icon={Newspaper}
        eyebrow="Press kit"
        title="Everything you need to write about us"
        subtitle="Logos, boilerplate, facts and a named contact. Take what you need — no form, no email gate."
      />

      <Band>
        <Reveal>
          <BandHeading sub="Copy these rather than paraphrasing. A paraphrase is how “non-custodial execution infrastructure” becomes “crypto trading bot” in print.">
            Boilerplate
          </BandHeading>
        </Reveal>
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <Reveal className="h-full">
            <CopyBlock label="One sentence" text={BOILERPLATE_SHORT} className="h-full" />
          </Reveal>
          <Reveal delay={STAGGER} className="h-full">
            <CopyBlock label="Full paragraph" text={BOILERPLATE_LONG} className="h-full" />
          </Reveal>
        </div>
      </Band>

      <Band divider className="bg-bq-overlay/[0.01]">
        <Reveal>
          <BandHeading>Key facts</BandHeading>
        </Reveal>
        <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-bq-border bg-bq-border sm:grid-cols-2 lg:grid-cols-3">
          {FACTS.map((fact, i) => (
            <Reveal key={fact.label} delay={i * STAGGER}>
              <div className="h-full bg-bq-card p-5">
                <dt className="font-plex text-[10px] uppercase tracking-[1.5px] text-bq-dim">
                  {fact.label}
                </dt>
                <dd className="mt-2 text-[14px] font-bold leading-[1.5] text-bq-heading">
                  {fact.value}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Band>

      <Band divider>
        <Reveal>
          <BandHeading sub="SVG, so they stay sharp at any size. Right-click to save, or use the download link on each.">
            Brand assets
          </BandHeading>
        </Reveal>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRAND_ASSETS.map((asset, i) => (
            <Reveal key={asset.name} delay={i * STAGGER} className="h-full">
              <AssetCard asset={asset} />
            </Reveal>
          ))}
        </div>
      </Band>

      <Band divider className="bg-bq-overlay/[0.01]">
        <Reveal>
          <BandHeading>Colour &amp; type</BandHeading>
        </Reveal>
        <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="h-full">
            <Card className="flex flex-col gap-3">
              {BRAND_COLORS.map((color) => (
                <div key={color.hex} className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="size-9 shrink-0 rounded-lg border border-bq-border"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-bq-heading">{color.name}</p>
                    <p className="text-[11px] leading-[1.5] text-bq-muted">{color.use}</p>
                  </div>
                  <code className="shrink-0 font-plex text-[11px] text-bq-dim">
                    {color.hex}
                  </code>
                </div>
              ))}
            </Card>
          </Reveal>

          <Reveal delay={STAGGER} className="h-full">
            <Card>
              <p className="font-plex text-[10px] uppercase tracking-[2px] text-bq-dim">
                Typeface
              </p>
              <p className="mt-3 font-satoshi text-[32px] font-bold leading-none tracking-tight text-bq-heading">
                {TYPEFACE.name}
              </p>
              <p className="mt-1.5 text-[12px] text-bq-green">{TYPEFACE.weight}</p>
              <p className="mt-4 text-[12px] leading-[1.7] text-bq-muted">
                {TYPEFACE.note}
              </p>
            </Card>
          </Reveal>
        </div>
      </Band>

      <Band divider>
        <Reveal>
          <BandHeading>Using the marks</BandHeading>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <Reveal className="h-full">
            <RuleList tone="do" items={USAGE_RULES.do} />
          </Reveal>
          <Reveal delay={STAGGER} className="h-full">
            <RuleList tone="dont" items={USAGE_RULES.dont} />
          </Reveal>
        </div>
      </Band>

      <Band divider className="py-10 md:py-12">
        <Reveal>
          <ContactCta
            title="Working on a story?"
            body="Interviews, technical detail, audit reports or a figure you want checked before it goes to print. We answer press within one working day."
            actions={[
              { icon: Newspaper, label: "Read the blog", href: "/blog" },
              {
                icon: Mail,
                prefix: "Email ",
                label: "press",
                href: `mailto:${PRESS_INBOX}`,
                primary: true,
              },
            ]}
          />
        </Reveal>
      </Band>
    </PageShell>
  );
}

function AssetCard({ asset }: { asset: BrandAsset }) {
  return (
    <Card className="flex flex-col p-0">
      {/* The preview sits on a plate matched to the variant, because a white
          mark on the light theme's card is otherwise an empty box. Both plates
          are fixed values rather than theme tokens: they demonstrate the
          background each variant is *for*, so they must not follow the reader's
          theme. #18181b rather than the palette's near-black, which is the card
          colour in dark mode and would make the swatch edge disappear. */}
      <div
        className={cn(
          "flex h-[132px] items-center justify-center rounded-t-2xl border-b border-bq-border",
          asset.preview === "white" ? "bg-[#18181b]" : "bg-[#f6f6f7]",
        )}
      >
        {/* `unoptimized` because the optimizer refuses SVG unless
            `dangerouslyAllowSVG` is set globally — which would apply to every
            image on the site to serve five static marks. These are a few
            hundred bytes each and want no processing anyway. */}
        <Image
          src={asset.href}
          alt=""
          aria-hidden
          unoptimized
          width={asset.kind === "wordmark" ? 200 : 56}
          height={asset.kind === "wordmark" ? 47 : 56}
          className={asset.kind === "wordmark" ? "w-[200px]" : "size-14"}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-satoshi text-[14px] font-bold text-bq-heading">{asset.name}</h3>
        <p className="mt-1.5 flex-1 text-[12px] leading-[1.6] text-bq-muted">
          {asset.description}
        </p>
        <a
          href={asset.href}
          download
          className="mt-4 flex w-fit items-center gap-2 rounded-full border border-bq-border px-3 py-1.5 text-[11px] font-bold text-bq-heading transition-colors hover:border-bq-green/30 hover:text-bq-green"
        >
          <Download className="size-3" />
          SVG
        </a>
      </div>
    </Card>
  );
}

function RuleList({ tone, items }: { tone: "do" | "dont"; items: readonly string[] }) {
  const isDo = tone === "do";
  const Icon = isDo ? Check : X;
  return (
    <Card>
      <p
        className={cn(
          "font-plex text-[10px] uppercase tracking-[2px]",
          isDo ? "text-bq-green" : "text-bq-loss-text",
        )}
      >
        {isDo ? "Please do" : "Please don't"}
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <Icon
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                isDo ? "text-bq-green" : "text-bq-loss-text",
              )}
            />
            <span className="text-[13px] leading-[1.65] text-bq-muted">{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
