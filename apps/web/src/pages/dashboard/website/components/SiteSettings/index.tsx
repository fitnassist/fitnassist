import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Loader2, CheckCircle, XCircle, Image } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  ImageUpload,
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
import { useWebsiteUpload } from '../../hooks';
import type { WebsiteData } from '../../website.types';
import type { z } from 'zod';

interface SiteSettingsProps {
  website: WebsiteData;
}

export const SiteSettings = ({ website }: SiteSettingsProps) => {
  return (
    <div className="space-y-6">
      <SubdomainSettings website={website} />
      <LogoSettings website={website} />
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
              <span className="text-sm text-muted-foreground">.sites.fitnassist.co</span>
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

const LogoSettings = ({ website }: SiteSettingsProps) => {
  const updateSettings = useUpdateWebsiteSettings();
  const { uploadImage, deleteFile } = useWebsiteUpload();
  const [logoUrl, setLogoUrl] = useState<string>(website.logoUrl || '');

  const handleSave = () => {
    updateSettings.mutate({ logoUrl: logoUrl || null });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Logo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload a logo to display in your site header. If no logo is set, your display name will be shown instead.
        </p>
        <ImageUpload
          value={logoUrl}
          onChange={(url) => setLogoUrl(url ?? '')}
          onUpload={uploadImage}
          onDelete={(url) => deleteFile(url)}
          maxSizeMB={5}
        />
        <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Logo
        </Button>
      </CardContent>
    </Card>
  );
};

const PublishSettings = ({ website }: SiteSettingsProps) => {
  const publishWebsite = usePublishWebsite();
  const unpublishWebsite = useUnpublishWebsite();
  const [showUnpublish, setShowUnpublish] = useState(false);

  const isPublished = website.status === 'PUBLISHED';
  const siteUrl = `https://${website.subdomain}.sites.fitnassist.co`;

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
  const { uploadImage, deleteFile } = useWebsiteUpload();
  const [ogImageUrl, setOgImageUrl] = useState<string>(website.ogImageUrl || '');

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
    updateSettings.mutate({ ...data, ogImageUrl: ogImageUrl || null });
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
            <Label>Social Share Image</Label>
            <ImageUpload
              value={ogImageUrl}
              onChange={(url) => setOgImageUrl(url ?? '')}
              onUpload={uploadImage}
              onDelete={(url) => deleteFile(url)}
              aspectRatio="cover"
              maxSizeMB={5}
            />
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
