import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
} from 'lucide-react';
import type { PublicTrainer } from '../../site.types';

interface SiteFooterProps {
  trainer: PublicTrainer;
}

interface SocialLink {
  platform: string;
  url: string;
}

const socialIcons: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

const parseSocialLinks = (raw: unknown): SocialLink[] => {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is SocialLink =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.platform === 'string' &&
      typeof item.url === 'string'
  );
};

export const SiteFooter = ({ trainer }: SiteFooterProps) => {
  const socialLinks = parseSocialLinks(trainer.socialLinks);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            &copy; {currentYear} {trainer.displayName}. All rights reserved.
          </p>

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => {
                const Icon = socialIcons[link.platform.toLowerCase()] ?? Globe;
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                    aria-label={link.platform}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <a
            href="https://fitnassist.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
          >
            Powered by Fitnassist
          </a>
        </div>
      </div>
    </footer>
  );
};
