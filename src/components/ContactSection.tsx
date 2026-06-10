import { ButtonLink } from "./ButtonLink";
import { contactEmail, contactSection, heroContent } from "../content/site-content";

type ContactSectionProps = {
  onCopyEmail: () => void;
};

export function ContactSection({ onCopyEmail }: ContactSectionProps) {
  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <p className="section-label">{contactSection.label}</p>
      <h2 id="contact-title">{contactSection.title}</h2>
      <p className="contact-body">{contactSection.body}</p>
      <div className="contact-actions">
        <ButtonLink href={heroContent.primaryAction.href} variant="primary">
          {heroContent.primaryAction.label}
        </ButtonLink>
        <button className="copy-email" type="button" onClick={onCopyEmail} aria-label="Copy email address">
          {contactEmail}
          <span aria-hidden="true">⧉</span>
        </button>
      </div>
      <p className="contact-note">{contactSection.note}</p>
    </section>
  );
}
