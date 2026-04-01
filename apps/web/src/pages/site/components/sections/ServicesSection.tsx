import { Card, CardContent } from '@/components/ui';
import { ICON_MAP } from '@/pages/dashboard/website/components/SectionForms/IconPicker';
import type { PublicSection, PublicTrainer } from '../../site.types';

interface ServiceItem {
  title?: string;
  description?: string;
  price?: string;
  icon?: string;
}

interface ServicesContent {
  items?: ServiceItem[];
  sourceType?: 'custom' | 'profile';
}

interface ServicesSectionProps {
  section: PublicSection;
  trainer: PublicTrainer;
}

const parseContent = (raw: unknown): ServicesContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as ServicesContent;
};

const parseProfileServices = (services: string[]): ServiceItem[] => {
  return services.map((s) => ({
    title: s,
  }));
};

export const ServicesSection = ({ section, trainer }: ServicesSectionProps) => {
  const content = parseContent(section.content);
  const services =
    content.sourceType === 'profile'
      ? parseProfileServices(trainer.services)
      : (content.items ?? []);

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
          {services.map((service, idx) => (
            <Card key={idx} className="border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <CardContent className="p-6">
                {(() => {
                  const Icon = service.icon ? ICON_MAP[service.icon] : undefined;
                  return Icon ? <Icon className="mb-3 h-8 w-8 text-[hsl(var(--primary))]" /> : null;
                })()}
                <h3 className="site-heading mb-2 text-lg font-semibold text-[hsl(var(--card-foreground))]">
                  {service.title}
                </h3>
                {service.description && (
                  <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
                    {service.description}
                  </p>
                )}
                {service.price && (
                  <p className="text-lg font-bold text-[hsl(var(--primary))]">{service.price}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <p className="text-center text-[hsl(var(--muted-foreground))]">No services to display.</p>
        )}
      </div>
    </section>
  );
};
