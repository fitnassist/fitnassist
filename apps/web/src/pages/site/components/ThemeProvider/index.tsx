import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { THEME_PRESETS } from '@/pages/dashboard/website/website.constants';
import type { ThemeColors, ThemePreset } from '@/pages/dashboard/website/website.types';
import type { PublicWebsite } from '../../site.types';

interface SiteThemeProviderProps {
  website: PublicWebsite;
  children: ReactNode;
}

const DEFAULT_PRESET: ThemePreset = THEME_PRESETS[0] ?? {
  id: 'default',
  name: 'Clean',
  description: '',
  colors: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    primary: '222.2 47.4% 11.2%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    border: '214.3 31.8% 91.4%',
  },
  fonts: { heading: 'Inter', body: 'Inter' },
  borderRadius: '0.5rem',
};

const buildCssVariables = (colors: ThemeColors, customColors: unknown): Record<string, string> => {
  const overrides =
    customColors && typeof customColors === 'object'
      ? (customColors as Record<string, string>)
      : {};
  const merged = { ...colors, ...overrides };

  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(merged)) {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    vars[`--${cssKey}`] = value as string;
  }
  return vars;
};

const getGoogleFontsUrl = (heading: string, body: string): string => {
  const families = new Set([heading, body]);
  const params = Array.from(families)
    .map((f) => `family=${f.replace(/\s+/g, '+')}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
};

export const SiteThemeProvider = ({ website, children }: SiteThemeProviderProps) => {
  const preset = THEME_PRESETS.find((p) => p.id === website.themeId) ?? DEFAULT_PRESET;

  const customFonts =
    website.customFonts && typeof website.customFonts === 'object'
      ? (website.customFonts as { heading?: string; body?: string })
      : {};

  const headingFont = customFonts.heading ?? preset.fonts.heading;
  const bodyFont = customFonts.body ?? preset.fonts.body;

  useEffect(() => {
    const id = 'site-google-fonts';
    if (document.getElementById(id)) {
      (document.getElementById(id) as HTMLLinkElement).href = getGoogleFontsUrl(
        headingFont,
        bodyFont,
      );
      return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = getGoogleFontsUrl(headingFont, bodyFont);
    document.head.appendChild(link);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [headingFont, bodyFont]);

  const style = useMemo(() => {
    const colorVars = buildCssVariables(preset.colors, website.customColors);
    // Set --ring to match primary so form focus rings match the theme
    const primaryValue = colorVars['--primary'] ?? preset.colors.primary;
    return {
      ...colorVars,
      '--ring': primaryValue,
      '--font-heading': `"${headingFont}", sans-serif`,
      '--font-body': `"${bodyFont}", sans-serif`,
      '--radius': preset.borderRadius,
    } as React.CSSProperties;
  }, [preset, website.customColors, headingFont, bodyFont]);

  return (
    <div
      style={style}
      className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
    >
      <style>{`
        .site-heading { font-family: var(--font-heading); }
        .site-body { font-family: var(--font-body); }
      `}</style>
      <div className="site-body">{children}</div>
    </div>
  );
};
