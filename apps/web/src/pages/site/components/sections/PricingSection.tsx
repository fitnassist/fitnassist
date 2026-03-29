import { Check } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import type { PublicSection } from '../../site.types';

interface PricingPlan {
  name?: string;
  price?: string;
  period?: string;
  description?: string;
  features?: string[];
  ctaText?: string;
  ctaUrl?: string;
  highlighted?: boolean;
}

interface PricingContent {
  plans?: PricingPlan[];
}

interface PricingSectionProps {
  section: PublicSection;
}

const parseContent = (raw: unknown): PricingContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as PricingContent;
};

export const PricingSection = ({ section }: PricingSectionProps) => {
  const content = parseContent(section.content);
  const plans = content.plans ?? [];

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
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`border-[hsl(var(--border))] bg-[hsl(var(--card))] ${
                plan.highlighted ? 'ring-2 ring-[hsl(var(--primary))]' : ''
              }`}
            >
              <CardContent className="flex flex-col p-6">
                <h3 className="site-heading text-lg font-semibold text-[hsl(var(--card-foreground))]">
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {plan.description}
                  </p>
                )}
                <div className="mt-4">
                  <span className="text-3xl font-bold text-[hsl(var(--card-foreground))]">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-1 text-sm text-[hsl(var(--muted-foreground))]">
                      /{plan.period}
                    </span>
                  )}
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="mt-6 flex-1 space-y-2">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-sm text-[hsl(var(--card-foreground))]">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--primary))]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {plan.ctaText && (
                  <div className="mt-6">
                    <Button
                      className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
                      onClick={() => {
                        if (plan.ctaUrl) window.open(plan.ctaUrl, '_blank');
                      }}
                    >
                      {plan.ctaText}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {plans.length === 0 && (
          <p className="text-center text-[hsl(var(--muted-foreground))]">
            No pricing plans to display.
          </p>
        )}
      </div>
    </section>
  );
};
