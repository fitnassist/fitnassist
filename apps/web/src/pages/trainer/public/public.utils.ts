import { TRAINER_SERVICES, TRAINER_QUALIFICATIONS } from '@fitnassist/schemas';

export function getServiceLabel(value: string): string {
  return TRAINER_SERVICES.find((s) => s.value === value)?.label || value;
}

export function getQualificationLabel(value: string): string {
  return TRAINER_QUALIFICATIONS.find((q) => q.value === value)?.label || value;
}

export function getTravelOptionDisplay(value: string): { label: string; description: string } {
  const options: Record<string, { label: string; description: string }> = {
    CLIENT_TRAVELS: {
      label: 'Studio/Gym Based',
      description: 'Clients travel to trainer\'s location',
    },
    TRAINER_TRAVELS: {
      label: 'Mobile Trainer',
      description: 'Trainer travels to client locations',
    },
    BOTH: {
      label: 'Flexible Location',
      description: 'Both studio and mobile sessions available',
    },
  };
  return options[value] || { label: value, description: '' };
}

export function getPostcodeArea(postcode: string | null | undefined): string {
  if (!postcode) return '';
  // Extract outward code (e.g., "SW1A" from "SW1A 1AA")
  const match = postcode.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/i);
  return match?.[1]?.toUpperCase() || postcode;
}

export function formatRate(min: number | null | undefined, max: number | null | undefined): string | null {
  if (!min && !max) return null;
  const minPounds = min ? Math.round(min / 100) : null;
  const maxPounds = max ? Math.round(max / 100) : null;
  if (minPounds && maxPounds) {
    if (minPounds === maxPounds) return `£${minPounds}/hr`;
    return `£${minPounds} - £${maxPounds}/hr`;
  }
  if (minPounds) return `From £${minPounds}/hr`;
  if (maxPounds) return `Up to £${maxPounds}/hr`;
  return null;
}
