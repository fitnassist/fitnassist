import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';
import type { PublicWebsite, PublicSection } from '../../site.types';

interface SiteHeaderProps {
  website: PublicWebsite;
}

const getSectionLabel = (section: PublicSection): string => {
  if (section.title) return section.title;
  const labels: Record<string, string> = {
    HERO: 'Home',
    ABOUT: 'About',
    SERVICES: 'Services',
    GALLERY: 'Gallery',
    TESTIMONIALS: 'Testimonials',
    BLOG: 'Blog',
    CONTACT: 'Contact',
    CUSTOM_TEXT: 'Info',
    VIDEO: 'Video',
    PRICING: 'Pricing',
    FAQ: 'FAQ',
    CTA: 'Get Started',
    SOCIAL_LINKS: 'Social',
    SHOP: 'Shop',
  };
  return labels[section.type] ?? section.type;
};

export const SiteHeader = ({ website }: SiteHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = website.sections.filter(
    (s) => s.isVisible && s.type !== 'HERO'
  );

  const handleNav = (sectionId: string) => {
    setMobileOpen(false);
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Name */}
        <a href="#" className="flex items-center gap-2">
          {website.logoUrl ? (
            <img
              src={website.logoUrl}
              alt={website.trainer.displayName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="site-heading text-lg font-bold text-[hsl(var(--foreground))]">
              {website.trainer.displayName}
            </span>
          )}
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleNav(section.id)}
              className="rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
            >
              {getSectionLabel(section)}
            </button>
          ))}
        </nav>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleNav(section.id)}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              >
                {getSectionLabel(section)}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
