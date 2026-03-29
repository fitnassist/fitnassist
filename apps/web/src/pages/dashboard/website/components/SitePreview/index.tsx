import { useState } from 'react';
import { ArrowLeft, Monitor, Smartphone, ExternalLink } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { useWebsitePreview } from '@/api/website';
import { env } from '@/config/env';
import { SiteThemeProvider } from '@/pages/site/components/ThemeProvider';
import { SiteLayout } from '@/pages/site/components/SiteLayout';
import { SectionRenderer } from '@/pages/site/components/sections';
import type { WebsiteData } from '../../website.types';

interface SitePreviewProps {
  website: WebsiteData;
  onClose: () => void;
}

export const SitePreview = ({ website, onClose }: SitePreviewProps) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const { data: preview, isLoading } = useWebsitePreview();
  const siteUrl = `https://${website.subdomain}.${env.SITE_DOMAIN}`;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
          <span className="text-sm text-muted-foreground">
            Preview — {website.subdomain}.{env.SITE_DOMAIN}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewport('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewport('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          {website.status === 'PUBLISHED' && (
            <Button size="sm" variant="outline" asChild>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Site
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Preview frame */}
      <div className="flex-1 overflow-hidden bg-muted flex items-start justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-lg overflow-y-auto transition-all duration-300"
          style={{
            width: viewport === 'mobile' ? '375px' : '100%',
            maxWidth: viewport === 'desktop' ? '100%' : '375px',
            height: '100%',
          }}
        >
          {isLoading || !preview ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-[40vh] w-full" />
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
          ) : (
            <SiteThemeProvider website={preview}>
              <SiteLayout website={preview}>
                {[...preview.sections]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((section) => (
                    <SectionRenderer
                      key={section.id}
                      section={section}
                      trainer={preview.trainer}
                    />
                  ))}
              </SiteLayout>
            </SiteThemeProvider>
          )}
        </div>
      </div>
    </div>
  );
};
