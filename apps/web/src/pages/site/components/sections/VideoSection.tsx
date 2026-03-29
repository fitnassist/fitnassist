import type { PublicSection } from '../../site.types';

interface VideoContent {
  videoUrl?: string;
  caption?: string;
}

interface VideoSectionProps {
  section: PublicSection;
}

const parseContent = (raw: unknown): VideoContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as VideoContent;
};

const getEmbedUrl = (url: string): string | null => {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
};

export const VideoSection = ({ section }: VideoSectionProps) => {
  const content = parseContent(section.content);
  const embedUrl = content.videoUrl ? getEmbedUrl(content.videoUrl) : null;

  if (!embedUrl) return null;

  return (
    <section id={`section-${section.id}`} className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="site-heading mb-4 text-center text-3xl font-bold text-[hsl(var(--foreground))]">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="mb-8 text-center text-lg text-[hsl(var(--muted-foreground))]">
            {section.subtitle}
          </p>
        )}

        <div className="relative aspect-video overflow-hidden rounded-lg shadow-lg">
          <iframe
            src={embedUrl}
            title={section.title ?? 'Video'}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {content.caption && (
          <p className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
            {content.caption}
          </p>
        )}
      </div>
    </section>
  );
};
