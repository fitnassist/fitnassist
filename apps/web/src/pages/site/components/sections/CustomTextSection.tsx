import type { PublicSection } from '../../site.types';

interface CustomTextContent {
  richText?: string;
  html?: string;
  title?: string;
}

interface CustomTextSectionProps {
  section: PublicSection;
}

const parseContent = (raw: unknown): CustomTextContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as CustomTextContent;
};

export const CustomTextSection = ({ section }: CustomTextSectionProps) => {
  const content = parseContent(section.content);

  return (
    <section id={`section-${section.id}`} className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {(content.title ?? section.title) && (
          <h2 className="site-heading mb-4 text-3xl font-bold text-[hsl(var(--foreground))]">
            {content.title ?? section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="mb-8 text-lg text-[hsl(var(--muted-foreground))]">
            {section.subtitle}
          </p>
        )}

        {(content.richText ?? content.html) && (
          <div
            className="prose max-w-none text-[hsl(var(--foreground))]"
            dangerouslySetInnerHTML={{ __html: (content.richText ?? content.html)! }}
          />
        )}
      </div>
    </section>
  );
};
