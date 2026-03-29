import type { PublicSection, PublicTrainer } from '../../site.types';

interface GalleryImage {
  id?: string;
  url?: string;
  imageUrl?: string;
  caption?: string | null;
}

interface GalleryContent {
  sourceType?: 'profile' | 'custom';
  images?: GalleryImage[];
  columns?: number;
}

interface GallerySectionProps {
  section: PublicSection;
  trainer: PublicTrainer;
}

const parseContent = (raw: unknown): GalleryContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as GalleryContent;
};

export const GallerySection = ({ section, trainer }: GallerySectionProps) => {
  const content = parseContent(section.content);
  const columns = content.columns ?? 3;

  const images: GalleryImage[] =
    content.sourceType === 'profile'
      ? trainer.galleryImages.map((img) => ({
          id: img.id,
          imageUrl: img.url,
        }))
      : content.images ?? [];

  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

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

        <div className={`grid gap-4 ${gridCols}`}>
          {images.map((img, idx) => (
            <div key={img.id ?? idx} className="group relative overflow-hidden rounded-lg">
              <img
                src={img.url ?? img.imageUrl ?? ''}
                alt={img.caption ?? ''}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-sm text-white">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <p className="text-center text-[hsl(var(--muted-foreground))]">
            No images to display.
          </p>
        )}
      </div>
    </section>
  );
};
