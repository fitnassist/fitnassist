import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PublicSection } from '../../site.types';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqContent {
  items?: FaqItem[];
}

interface FaqSectionProps {
  section: PublicSection;
}

const parseContent = (raw: unknown): FaqContent => {
  if (!raw || typeof raw !== 'object') return {};
  return raw as FaqContent;
};

export const FaqSection = ({ section }: FaqSectionProps) => {
  const content = parseContent(section.content);
  const items = content.items ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id={`section-${section.id}`} className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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

        <div className="divide-y divide-[hsl(var(--border))]">
          {items.map((item, idx) => (
            <div key={idx}>
              <button
                onClick={() => toggle(idx)}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className="pr-4 text-base font-medium text-[hsl(var(--foreground))]">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === idx && (
                <div className="pb-4 pr-8 text-sm text-[hsl(var(--muted-foreground))]">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-center text-[hsl(var(--muted-foreground))]">
            No FAQ items to display.
          </p>
        )}
      </div>
    </section>
  );
};
