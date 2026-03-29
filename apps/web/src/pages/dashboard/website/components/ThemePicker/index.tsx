import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useUpdateWebsiteSettings } from '@/api/website';
import { THEME_PRESETS } from '../../website.constants';
import { ColorCustomizer } from './ColorCustomizer';
import { cn } from '@/lib/utils';
import type { WebsiteData } from '../../website.types';

interface ThemePickerProps {
  website: WebsiteData;
}

export const ThemePicker = ({ website }: ThemePickerProps) => {
  const updateSettings = useUpdateWebsiteSettings();

  const handleSelectTheme = (themeId: string) => {
    updateSettings.mutate({ themeId });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose a Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {THEME_PRESETS.map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isSelected={website.themeId === theme.id}
                onSelect={() => handleSelectTheme(theme.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <ColorCustomizer website={website} />
    </div>
  );
};

interface ThemePreviewCardProps {
  theme: (typeof THEME_PRESETS)[number];
  isSelected: boolean;
  onSelect: () => void;
}

const ThemePreviewCard = ({ theme, isSelected, onSelect }: ThemePreviewCardProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative rounded-lg border-2 p-3 text-left transition-all hover:shadow-md',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      {/* Theme preview swatch */}
      <div className="mb-3 rounded-md overflow-hidden h-20">
        <div className="flex h-full">
          <div
            className="flex-1"
            style={{ backgroundColor: `hsl(${theme.colors.background})` }}
          >
            <div className="p-2">
              <div
                className="h-2 w-12 rounded mb-1"
                style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
              />
              <div
                className="h-1.5 w-8 rounded"
                style={{ backgroundColor: `hsl(${theme.colors.mutedForeground})` }}
              />
            </div>
          </div>
          <div
            className="w-1/3"
            style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
          />
        </div>
      </div>
      <p className="text-sm font-semibold">{theme.name}</p>
      <p className="text-xs text-muted-foreground">{theme.description}</p>
    </button>
  );
};
