import { FileText } from 'lucide-react';
import { Button } from '@/components/ui';
import type { PublicSection } from '../../site.types';

interface BlogSectionProps {
  section: PublicSection;
  onNavigateBlog?: () => void;
}

export const BlogSection = ({ section, onNavigateBlog }: BlogSectionProps) => {
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

        <div className="flex flex-col items-center gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12">
          <FileText className="h-12 w-12 text-[hsl(var(--muted-foreground))]" />
          <p className="text-lg font-medium text-[hsl(var(--card-foreground))]">
            Check out our latest posts
          </p>
          <Button
            onClick={onNavigateBlog}
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
          >
            Visit our blog
          </Button>
        </div>
      </div>
    </section>
  );
};
