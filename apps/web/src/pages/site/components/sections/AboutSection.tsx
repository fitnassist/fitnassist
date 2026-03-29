import type { PublicSection, PublicTrainer } from '../../site.types';

interface AboutContent {
  text?: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right';
}

interface AboutSectionProps {
  section: PublicSection;
  trainer: PublicTrainer;
}

const parseContent = (raw: unknown): AboutContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as AboutContent;
};

export const AboutSection = ({ section, trainer }: AboutSectionProps) => {
  const content = parseContent(section.content);
  const imagePosition = content.imagePosition ?? 'right';
  const imageUrl = content.imageUrl ?? trainer.profileImageUrl;
  const text = content.text ?? trainer.bio ?? '';

  return (
    <section id={`section-${section.id}`} className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="site-heading mb-4 text-3xl font-bold text-[hsl(var(--foreground))]">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="mb-8 text-lg text-[hsl(var(--muted-foreground))]">
            {section.subtitle}
          </p>
        )}

        <div
          className={`flex flex-col items-center gap-8 lg:flex-row ${
            imagePosition === 'left' ? 'lg:flex-row-reverse' : ''
          }`}
        >
          <div className="flex-1">
            <div
              className="prose max-w-none text-[hsl(var(--foreground))]"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          </div>

          {imageUrl && (
            <div className="w-full flex-shrink-0 lg:w-2/5">
              <img
                src={imageUrl}
                alt={trainer.displayName}
                className="w-full rounded-lg object-cover shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
