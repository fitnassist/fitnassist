import { Button } from '@/components/ui';
import type { PublicSection } from '../../site.types';

interface CtaContent {
  headline?: string;
  subheadline?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundImageUrl?: string;
}

interface CtaSectionProps {
  section: PublicSection;
}

const parseContent = (raw: unknown): CtaContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as CtaContent;
};

export const CtaSection = ({ section }: CtaSectionProps) => {
  const content = parseContent(section.content);

  return (
    <section
      id={`section-${section.id}`}
      className="relative overflow-hidden bg-[hsl(var(--primary))] py-16 sm:py-20"
    >
      {content.backgroundImageUrl && (
        <>
          <img
            src={content.backgroundImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[hsl(var(--primary))]/80" />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="site-heading text-3xl font-bold text-[hsl(var(--primary-foreground))] sm:text-4xl">
          {content.headline ?? section.title ?? 'Ready to get started?'}
        </h2>
        {(content.subheadline ?? content.description ?? section.subtitle) && (
          <p className="mt-4 text-lg text-[hsl(var(--primary-foreground))]/90">
            {content.subheadline ?? content.description ?? section.subtitle}
          </p>
        )}
        {(content.ctaText ?? content.buttonText) && (
          <div className="mt-8">
            <Button
              size="lg"
              variant="secondary"
              className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))]/90"
              onClick={() => {
                const url = content.ctaLink ?? content.buttonUrl;
                if (url) {
                  if (url.startsWith('#')) {
                    const el = document.querySelector(url);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.open(url, '_blank');
                  }
                }
              }}
            >
              {content.ctaText ?? content.buttonText}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
