import { Button } from '@/components/ui';
import type { PublicSection } from '../../site.types';

interface HeroContent {
  headline?: string;
  subheadline?: string;
  backgroundImageUrl?: string;
  overlayOpacity?: number;
  ctaText?: string;
  ctaUrl?: string;
}

interface HeroSectionProps {
  section: PublicSection;
}

const parseContent = (raw: unknown): HeroContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as HeroContent;
};

export const HeroSection = ({ section }: HeroSectionProps) => {
  const content = parseContent(section.content);
  const overlayOpacity = content.overlayOpacity ?? 0.5;

  return (
    <section
      id={`section-${section.id}`}
      className="relative flex min-h-[60vh] items-center justify-center overflow-hidden"
    >
      {content.backgroundImageUrl && (
        <>
          <img
            src={content.backgroundImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        </>
      )}

      {!content.backgroundImageUrl && (
        <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="site-heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          {content.headline ?? section.title ?? 'Welcome'}
        </h1>
        {(content.subheadline ?? section.subtitle) && (
          <p className="mt-4 text-lg text-white/90 sm:text-xl">
            {content.subheadline ?? section.subtitle}
          </p>
        )}
        {content.ctaText && (
          <div className="mt-8">
            <Button
              size="lg"
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
              onClick={() => {
                if (content.ctaUrl) {
                  if (content.ctaUrl.startsWith('#')) {
                    const el = document.querySelector(content.ctaUrl);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.open(content.ctaUrl, '_blank');
                  }
                }
              }}
            >
              {content.ctaText}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
