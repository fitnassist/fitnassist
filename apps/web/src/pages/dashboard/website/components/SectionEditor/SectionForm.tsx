import type { WebsiteSectionData } from '../../website.types';
import {
  HeroForm,
  AboutForm,
  ServicesForm,
  GalleryForm,
  TestimonialsForm,
  BlogForm,
  ContactForm,
  CustomTextForm,
  VideoForm,
  PricingForm,
  FaqForm,
  CtaForm,
  SocialLinksForm,
} from '../SectionForms';

interface SectionFormProps {
  section: WebsiteSectionData;
}

const parseContent = (content: unknown): Record<string, unknown> => {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    return content as Record<string, unknown>;
  }
  return {};
};

export const SectionForm = ({ section }: SectionFormProps) => {
  const content = parseContent(section.content);

  switch (section.type) {
    case 'HERO':
      return <HeroForm sectionId={section.id} content={content} />;
    case 'ABOUT':
      return <AboutForm sectionId={section.id} content={content} />;
    case 'SERVICES':
      return <ServicesForm sectionId={section.id} content={content} />;
    case 'GALLERY':
      return <GalleryForm sectionId={section.id} content={content} />;
    case 'TESTIMONIALS':
      return <TestimonialsForm sectionId={section.id} content={content} />;
    case 'BLOG':
      return <BlogForm sectionId={section.id} content={content} />;
    case 'CONTACT':
      return <ContactForm sectionId={section.id} content={content} />;
    case 'CUSTOM_TEXT':
      return <CustomTextForm sectionId={section.id} content={content} />;
    case 'VIDEO':
      return <VideoForm sectionId={section.id} content={content} />;
    case 'PRICING':
      return <PricingForm sectionId={section.id} content={content} />;
    case 'FAQ':
      return <FaqForm sectionId={section.id} content={content} />;
    case 'CTA':
      return <CtaForm sectionId={section.id} content={content} />;
    case 'SOCIAL_LINKS':
      return <SocialLinksForm sectionId={section.id} content={content} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          No editor available for this section type.
        </p>
      );
  }
};
