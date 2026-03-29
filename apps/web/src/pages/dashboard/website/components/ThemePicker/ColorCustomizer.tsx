import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui';
import { useUpdateWebsiteSettings } from '@/api/website';
import { THEME_PRESETS } from '../../website.constants';
import type { WebsiteData, ThemeColors } from '../../website.types';

interface ColorCustomizerProps {
  website: WebsiteData;
}

const COLOR_FIELDS = [
  { key: 'primary', label: 'Primary' },
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Text' },
  { key: 'accent', label: 'Accent' },
  { key: 'muted', label: 'Muted' },
] as const;

const hslToHex = (hsl: string): string => {
  const parts = hsl.split(' ').map((p) => parseFloat(p));
  const h = parts[0] ?? 0;
  const s = parts[1] ?? 0;
  const l = parts[2] ?? 0;
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const ColorCustomizer = ({ website }: ColorCustomizerProps) => {
  const updateSettings = useUpdateWebsiteSettings();
  const theme = (THEME_PRESETS.find((t) => t.id === website.themeId) ?? THEME_PRESETS[0])!;
  const customColors = (website.customColors ?? {}) as Record<string, string>;

  const currentColors: Record<string, string> = { ...theme.colors, ...customColors };
  const [localColors, setLocalColors] = useState<Record<string, string>>(currentColors);

  const handleColorChange = (key: string, hex: string) => {
    setLocalColors((prev) => ({ ...prev, [key]: hexToHsl(hex) }));
  };

  const handleSave = () => {
    const overrides: Record<string, string> = {};
    for (const field of COLOR_FIELDS) {
      const localValue = localColors[field.key];
      if (localValue && localValue !== theme.colors[field.key as keyof ThemeColors]) {
        overrides[field.key] = localValue;
      }
    }
    updateSettings.mutate({
      customColors: Object.keys(overrides).length > 0 ? overrides : undefined,
    });
  };

  const handleReset = () => {
    setLocalColors({ ...theme.colors });
    updateSettings.mutate({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Colors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {COLOR_FIELDS.map((field) => (
            <div key={field.key}>
              <Label className="text-xs">{field.label}</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={hslToHex(localColors[field.key] || '0 0% 0%')}
                  onChange={(e) => handleColorChange(field.key, e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-border"
                />
                <Input
                  value={hslToHex(localColors[field.key] || '0 0% 0%')}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      handleColorChange(field.key, e.target.value);
                    }
                  }}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Colors
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset to Theme Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
