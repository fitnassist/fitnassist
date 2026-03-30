import { useState } from 'react';
import {
  Layout, Palette, FileText, Settings, ExternalLink, Loader2, Eye,
} from 'lucide-react';
import { Button, ResponsiveTabs, TabsContent } from '@/components/ui';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useMyWebsite, useCreateWebsite } from '@/api/website';
import { useMyProfile } from '@/api/trainer';
import { SiteSettings } from './components/SiteSettings';
import { ThemePicker } from './components/ThemePicker';
import { SectionEditor } from './components/SectionEditor';
import { BlogManager } from './components/BlogManager';
import { SitePreview } from './components/SitePreview';
import type { WebsiteData } from './website.types';

const TAB_OPTIONS = [
  { value: 'sections', label: 'Sections', icon: <Layout className="h-4 w-4" /> },
  { value: 'theme', label: 'Theme', icon: <Palette className="h-4 w-4" /> },
  { value: 'blog', label: 'Blog', icon: <FileText className="h-4 w-4" /> },
  { value: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export const WebsitePage = () => {
  const { hasAccess, isLoading: tierLoading } = useFeatureAccess('websiteBuilder');
  const { data: website, isLoading: websiteLoading } = useMyWebsite();
  const { data: profile } = useMyProfile();
  const createWebsite = useCreateWebsite();
  const [activeTab, setActiveTab] = useState('sections');
  const [showPreview, setShowPreview] = useState(false);

  if (tierLoading || websiteLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Website Builder</h1>
        <UpgradePrompt requiredTier="ELITE" featureName="Website Builder" />
      </div>
    );
  }

  if (!website) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Website Builder</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Layout className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Create Your Website</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Build a branded micro-site for your personal training business.
            Your site will be available at <strong>{profile?.handle ?? 'yourhandle'}.sites.fitnassist.co</strong>.
          </p>
          <Button
            onClick={() => createWebsite.mutate()}
            disabled={createWebsite.isPending}
          >
            {createWebsite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Website
          </Button>
        </div>
      </div>
    );
  }

  const siteUrl = `https://${website.subdomain}.sites.fitnassist.co`;
  const ws = website as unknown as WebsiteData;

  if (showPreview) {
    return <SitePreview website={ws} onClose={() => setShowPreview(false)} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {website.status === 'PUBLISHED' ? (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-coral hover:underline"
              >
                {siteUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span>Draft — not yet published</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          {website.status === 'PUBLISHED' && (
            <Button size="sm" asChild>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Site
              </a>
            </Button>
          )}
        </div>
      </div>

      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={TAB_OPTIONS}
      >
        <TabsContent value="sections">
          <SectionEditor website={ws} />
        </TabsContent>
        <TabsContent value="theme">
          <ThemePicker website={ws} />
        </TabsContent>
        <TabsContent value="blog">
          <BlogManager />
        </TabsContent>
        <TabsContent value="settings">
          <SiteSettings website={ws} />
        </TabsContent>
      </ResponsiveTabs>
    </div>
  );
};
