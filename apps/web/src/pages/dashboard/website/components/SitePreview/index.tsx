import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Monitor, Smartphone, ExternalLink } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { Button, Skeleton } from '@/components/ui';
import { useWebsitePreview } from '@/api/website';
import { SiteThemeProvider } from '@/pages/site/components/ThemeProvider';
import { SiteLayout } from '@/pages/site/components/SiteLayout';
import { SectionRenderer } from '@/pages/site/components/sections';
import type { WebsiteData } from '../../website.types';

interface SitePreviewProps {
  website: WebsiteData;
  onClose: () => void;
}

const PreviewContent = ({ preview }: { preview: NonNullable<ReturnType<typeof useWebsitePreview>['data']> }) => {
  return (
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
  );
};

export const SitePreview = ({ website, onClose }: SitePreviewProps) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const { data: preview, isLoading } = useWebsitePreview();
  const siteUrl = `${window.location.origin}/site/${website.subdomain}`;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [, setIframeReady] = useState(false);

  // Render React content into the iframe
  useEffect(() => {
    if (!preview || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Copy stylesheets from parent document into iframe
    doc.open();
    doc.write('<!DOCTYPE html><html><head></head><body><div id="preview-root"></div></body></html>');
    doc.close();

    // Copy all stylesheets
    const parentStyles = document.querySelectorAll('link[rel="stylesheet"], style');
    parentStyles.forEach((style) => {
      doc.head.appendChild(style.cloneNode(true));
    });

    // Add base styles
    const baseStyle = doc.createElement('style');
    baseStyle.textContent = `
      body { margin: 0; font-family: system-ui, sans-serif; }
      * { box-sizing: border-box; }
    `;
    doc.head.appendChild(baseStyle);

    const root = doc.getElementById('preview-root');
    if (root) {
      const reactRoot = createRoot(root);
      reactRoot.render(<PreviewContent preview={preview} />);
      setIframeReady(true);

      return () => {
        reactRoot.unmount();
      };
    }
  }, [preview]);

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
            Preview — fitnassist.co/site/{website.subdomain}
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
        {isLoading || !preview ? (
          <div className="bg-white rounded-lg shadow-lg w-full h-full p-8 space-y-4">
            <Skeleton className="h-[40vh] w-full" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Site preview"
            className="rounded-lg shadow-lg bg-white transition-all duration-300 border-0"
            style={{
              width: viewport === 'mobile' ? '375px' : '100%',
              height: '100%',
            }}
          />
        )}
      </div>
    </div>
  );
};
