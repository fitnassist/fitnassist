import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
} from 'lucide-react';
import type { PublicSection, PublicTrainer } from '../../site.types';

interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

interface SocialLinksContent {
  links?: SocialLink[];
  sourceType?: 'profile' | 'custom';
}

interface SocialLinksSectionProps {
  section: PublicSection;
  trainer: PublicTrainer;
}

const socialIcons: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

const parseContent = (raw: unknown): SocialLinksContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as SocialLinksContent;
};

const parseProfileSocialLinks = (raw: unknown): SocialLink[] => {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is SocialLink =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.platform === 'string' &&
      typeof item.url === 'string'
  );
};

export const SocialLinksSection = ({ section, trainer }: SocialLinksSectionProps) => {
  const content = parseContent(section.content);
  const links =
    content.sourceType === 'profile'
      ? parseProfileSocialLinks(trainer.socialLinks)
      : content.links ?? [];

  return (
    <section id={`section-${section.id}`} className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        <div className="flex flex-wrap items-center justify-center gap-4">
          {links.map((link, idx) => {
            const Icon = socialIcons[link.platform.toLowerCase()] ?? Globe;
            return (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
                aria-label={link.label ?? link.platform}
              >
                <Icon className="h-4 w-4" />
                <span className="capitalize">{link.label ?? link.platform}</span>
              </a>
            );
          })}
        </div>

        {links.length === 0 && (
          <p className="text-center text-[hsl(var(--muted-foreground))]">
            No social links to display.
          </p>
        )}
      </div>
    </section>
  );
};
