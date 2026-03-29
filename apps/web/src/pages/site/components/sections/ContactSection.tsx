import { useState } from 'react';
import { Mail, Phone, ExternalLink } from 'lucide-react';
import { Button, Input, Textarea, Card, CardContent } from '@/components/ui';
import type { PublicSection, PublicTrainer } from '../../site.types';

interface ContactContent {
  showForm?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  bookingUrl?: string;
  bookingLabel?: string;
}

interface ContactSectionProps {
  section: PublicSection;
  trainer: PublicTrainer;
}

const parseContent = (raw: unknown): ContactContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as ContactContent;
};

export const ContactSection = ({ section, trainer }: ContactSectionProps) => {
  const content = parseContent(section.content);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const showForm = content.showForm !== false;
  const showEmail = content.showEmail !== false && trainer.contactEmail;
  const showPhone = content.showPhone !== false && trainer.phoneNumber;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Contact form submission would be handled via a tRPC mutation in production
    setSubmitted(true);
  };

  return (
    <section id={`section-${section.id}`} className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="site-heading mb-4 text-center text-3xl font-bold text-[hsl(var(--foreground))]">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="mb-10 text-center text-lg text-[hsl(var(--muted-foreground))]">
            {section.subtitle}
          </p>
        )}

        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
          {/* Contact info */}
          <div className="flex flex-col gap-4">
            {showEmail && (
              <a
                href={`mailto:${trainer.contactEmail}`}
                className="flex items-center gap-3 text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--primary))]"
              >
                <Mail className="h-5 w-5 text-[hsl(var(--primary))]" />
                <span>{trainer.contactEmail}</span>
              </a>
            )}
            {showPhone && (
              <a
                href={`tel:${trainer.phoneNumber}`}
                className="flex items-center gap-3 text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--primary))]"
              >
                <Phone className="h-5 w-5 text-[hsl(var(--primary))]" />
                <span>{trainer.phoneNumber}</span>
              </a>
            )}
            {content.bookingUrl && (
              <a
                href={content.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--primary))]"
              >
                <ExternalLink className="h-5 w-5 text-[hsl(var(--primary))]" />
                <span>{content.bookingLabel ?? 'Book a session'}</span>
              </a>
            )}
          </div>

          {/* Contact form */}
          {showForm && (
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <CardContent className="p-6">
                {submitted ? (
                  <div className="py-8 text-center">
                    <p className="text-lg font-medium text-[hsl(var(--card-foreground))]">
                      Thank you for your message!
                    </p>
                    <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                      We will get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                      placeholder="Your name"
                      value={formState.name}
                      onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Your email"
                      value={formState.email}
                      onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                      required
                    />
                    <Textarea
                      placeholder="Your message"
                      value={formState.message}
                      onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                      rows={4}
                      required
                    />
                    <Button
                      type="submit"
                      className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
                    >
                      Send message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};
