import type { PublicSection, PublicTrainer } from '../../site.types';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { ServicesSection } from './ServicesSection';
import { GallerySection } from './GallerySection';
import { TestimonialsSection } from './TestimonialsSection';
import { BlogSection } from './BlogSection';
import { ShopSection } from '../shop/ShopSection';
import { ContactSection } from './ContactSection';
import { CustomTextSection } from './CustomTextSection';
import { VideoSection } from './VideoSection';
import { PricingSection } from './PricingSection';
import { FaqSection } from './FaqSection';
import { CtaSection } from './CtaSection';
import { SocialLinksSection } from './SocialLinksSection';

interface SectionRendererProps {
  section: PublicSection;
  trainer: PublicTrainer;
  onNavigateBlog?: () => void;
  onNavigatePost?: (slug: string) => void;
  onNavigateShop?: () => void;
  onNavigateProduct?: (slug: string) => void;
  onAddToCart?: (productId: string) => void;
  subdomain?: string;
  preview?: boolean;
}

export const SectionRenderer = ({ section, trainer, onNavigateBlog, onNavigatePost, onNavigateShop, onNavigateProduct, onAddToCart, subdomain, preview }: SectionRendererProps) => {
  if (!section.isVisible) return null;

  const renderSection = () => {
    switch (section.type) {
      case 'HERO':
        return <HeroSection section={section} />;
      case 'ABOUT':
        return <AboutSection section={section} trainer={trainer} />;
      case 'SERVICES':
        return <ServicesSection section={section} trainer={trainer} />;
      case 'GALLERY':
        return <GallerySection section={section} trainer={trainer} />;
      case 'TESTIMONIALS':
        return <TestimonialsSection section={section} trainer={trainer} />;
      case 'BLOG':
        return preview ? null : <BlogSection section={section} subdomain={subdomain} onNavigateBlog={onNavigateBlog} onNavigatePost={onNavigatePost} />;
      case 'SHOP':
        return preview ? null : <ShopSection section={section} trainerId={trainer.id} onNavigateShop={onNavigateShop} onNavigateProduct={onNavigateProduct} onAddToCart={onAddToCart} />;
      case 'CONTACT':
        return <ContactSection section={section} trainer={trainer} preview={preview} />;
      case 'CUSTOM_TEXT':
        return <CustomTextSection section={section} />;
      case 'VIDEO':
        return <VideoSection section={section} />;
      case 'PRICING':
        return <PricingSection section={section} />;
      case 'FAQ':
        return <FaqSection section={section} />;
      case 'CTA':
        return <CtaSection section={section} />;
      case 'SOCIAL_LINKS':
        return <SocialLinksSection section={section} trainer={trainer} />;
      default:
        return null;
    }
  };

  return (
    <div data-section-type={section.type.toLowerCase().replace('_', '-')}>
      {renderSection()}
    </div>
  );
};
