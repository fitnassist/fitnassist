import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import {
  useUpdateWebsiteSettings,
  useUpdateSubdomain,
  usePublishWebsite,
  useUnpublishWebsite,
} from '@/api/website';
import { updateWebsiteSettingsSchema, updateSubdomainSchema } from '@fitnassist/schemas';
import { env } from '@/config/env';
import type { WebsiteData } from '../../website.types';
import type { z } from 'zod';

interface SiteSettingsProps {
  website: WebsiteData;
}

export const SiteSettings = ({ website }: SiteSettingsProps) => {
  return (
    <div className="space-y-6">
      <SubdomainSettings website={website} />
      <PublishSettings website={website} />
      <SeoSettings website={website} />
    </div>
  );
};

const SubdomainSettings = ({ website }: SiteSettingsProps) => {
  const updateSubdomain = useUpdateSubdomain();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateSubdomainSchema),
    defaultValues: { subdomain: website.subdomain },
  });

  const onSubmit = (data: z.infer<typeof updateSubdomainSchema>) => {
    updateSubdomain.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Subdomain
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="subdomain">Your website URL</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                id="subdomain"
                {...register('subdomain')}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">.{env.SITE_DOMAIN}</span>
            </div>
            {errors.subdomain && (
              <p className="text-sm text-destructive mt-1">{errors.subdomain.message}</p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={updateSubdomain.isPending}>
            {updateSubdomain.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Subdomain
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const PublishSettings = ({ website }: SiteSettingsProps) => {
  const publishWebsite = usePublishWebsite();
  const unpublishWebsite = useUnpublishWebsite();
  const [showUnpublish, setShowUnpublish] = useState(false);

  const isPublished = website.status === 'PUBLISHED';
  const siteUrl = `https://${website.subdomain}.${env.SITE_DOMAIN}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {isPublished ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Published</span>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline ml-2"
              >
                {siteUrl}
              </a>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Draft</span>
            </>
          )}
        </div>

        {isPublished ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnpublish(true)}
            >
              Unpublish
            </Button>
            <ConfirmDialog
              open={showUnpublish}
              onOpenChange={setShowUnpublish}
              title="Unpublish website?"
              description="Your website will no longer be publicly accessible. You can republish it at any time."
              onConfirm={() => unpublishWebsite.mutate()}
              isLoading={unpublishWebsite.isPending}
            />
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => publishWebsite.mutate()}
            disabled={publishWebsite.isPending}
          >
            {publishWebsite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish Website
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const SeoSettings = ({ website }: SiteSettingsProps) => {
  const updateSettings = useUpdateWebsiteSettings();
  const {
    register,
    handleSubmit,
  } = useForm({
    resolver: zodResolver(updateWebsiteSettingsSchema),
    defaultValues: {
      seoTitle: website.seoTitle ?? '',
      seoDescription: website.seoDescription ?? '',
      ogImageUrl: website.ogImageUrl ?? '',
      googleAnalyticsId: website.googleAnalyticsId ?? '',
    },
  });

  const onSubmit = (data: z.infer<typeof updateWebsiteSettingsSchema>) => {
    updateSettings.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO & Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input id="seoTitle" {...register('seoTitle')} placeholder="My Fitness Training" />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              {...register('seoDescription')}
              placeholder="Personal training services..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="ogImageUrl">Social Share Image URL</Label>
            <Input id="ogImageUrl" {...register('ogImageUrl')} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
            <Input
              id="googleAnalyticsId"
              {...register('googleAnalyticsId')}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <Button type="submit" size="sm" disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save SEO Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
