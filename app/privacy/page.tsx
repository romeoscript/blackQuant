import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY } from "@/components/legal/privacy-doc";

export const metadata: Metadata = {
  title: "Privacy Policy · BlackQuant",
  description:
    "How BlackQuant collects, uses, and protects your personal data — encryption, your privacy rights, retention, and GDPR compliance.",
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
