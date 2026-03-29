import { Star } from 'lucide-react';
import { Card, CardContent, Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import type { PublicSection, PublicTrainer } from '../../site.types';

interface Testimonial {
  quote?: string;
  author?: string;
  name?: string;
  text?: string;
  rating?: number;
  image?: string | null;
}

interface TestimonialsContent {
  sourceType?: 'reviews' | 'custom';
  items?: Testimonial[];
}

interface TestimonialsSectionProps {
  section: PublicSection;
  trainer: PublicTrainer;
}

const parseContent = (raw: unknown): TestimonialsContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as TestimonialsContent;
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const TestimonialsSection = ({ section, trainer }: TestimonialsSectionProps) => {
  const content = parseContent(section.content);

  const testimonials: Testimonial[] =
    content.sourceType === 'reviews'
      ? trainer.reviews.map((r) => ({
          author: r.reviewer.name,
          name: r.reviewer.name,
          quote: r.text ?? '',
          text: r.text ?? '',
          rating: r.rating,
          image: r.reviewer.image,
        }))
      : content.items ?? [];

  return (
    <section id={`section-${section.id}`} className="bg-[hsl(var(--muted))] py-16 sm:py-20">
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <CardContent className="p-6">
                {t.rating != null && (
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (t.rating ?? 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-[hsl(var(--muted-foreground))]'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {(t.quote ?? t.text) && (
                  <p className="mb-4 text-sm text-[hsl(var(--card-foreground))]">
                    &ldquo;{t.quote ?? t.text}&rdquo;
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {t.image && <AvatarImage src={t.image} alt={t.author ?? t.name ?? ''} />}
                    <AvatarFallback className="text-xs">
                      {getInitials(t.author ?? t.name ?? 'A')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-[hsl(var(--card-foreground))]">
                    {t.author ?? t.name}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {testimonials.length === 0 && (
          <p className="text-center text-[hsl(var(--muted-foreground))]">
            No testimonials to display.
          </p>
        )}
      </div>
    </section>
  );
};
