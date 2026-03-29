import { Badge } from './badge';

interface SourceBadgeProps {
  source: string;
  className?: string;
}

const SOURCE_CONFIG: Record<string, { label: string; className: string }> = {
  STRAVA: { label: 'Strava', className: 'bg-[#FC4C02]/10 text-[#FC4C02] border-[#FC4C02]/20' },
  GOOGLE_FIT: { label: 'Google Fit', className: 'bg-[#4285F4]/10 text-[#4285F4] border-[#4285F4]/20' },
  FITBIT: { label: 'Fitbit', className: 'bg-[#00B0B9]/10 text-[#00B0B9] border-[#00B0B9]/20' },
  GARMIN: { label: 'Garmin', className: 'bg-[#007CC3]/10 text-[#007CC3] border-[#007CC3]/20' },
  APPLE_HEALTH: { label: 'Apple Health', className: 'bg-[#FF2D55]/10 text-[#FF2D55] border-[#FF2D55]/20' },
};

export const SourceBadge = ({ source, className = '' }: SourceBadgeProps) => {
  if (source === 'MANUAL' || !source) return null;

  const config = SOURCE_CONFIG[source];
  if (!config) return null;

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium ${config.className} ${className}`}>
      {config.label}
    </Badge>
  );
};
