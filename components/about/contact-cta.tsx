import { ContactCta } from "@/components/landing/contact-cta";
import { Reveal } from "@/components/landing/reveal";
import { CONTACT_ACTIONS } from "./data";
import { AboutSection } from "./section";

export function AboutContactCta() {
  return (
    <AboutSection>
      <Reveal>
        <ContactCta
          title="Have a question or feedback?"
          body="Reach out through the Help Desk — our team typically responds within 2 hours. For partnership enquiries, use the dedicated form in the Knowledge Base."
          actions={CONTACT_ACTIONS}
        />
      </Reveal>
    </AboutSection>
  );
}
