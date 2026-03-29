import type { SectionType, WebsiteStatus } from '@fitnassist/database';

export interface WebsiteData {
  id: string;
  trainerId: string;
  subdomain: string;
  status: WebsiteStatus;
  themeId: string;
  customColors: unknown;
  customFonts: unknown;
  logoUrl: string | null;
  faviconUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  googleAnalyticsId: string | null;
  sections: WebsiteSectionData[];
}

export interface WebsiteSectionData {
  id: string;
  type: SectionType;
  title: string | null;
  subtitle: string | null;
  content: unknown;
  settings: unknown;
  sortOrder: number;
  isVisible: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  borderRadius: string;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  border: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface SectionTypeConfig {
  type: SectionType;
  label: string;
  description: string;
  icon: string;
  defaultContent?: Record<string, unknown>;
}
