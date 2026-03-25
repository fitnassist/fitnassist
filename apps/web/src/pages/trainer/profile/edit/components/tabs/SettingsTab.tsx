import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ExternalLink, UserCheck, UserX } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Switch } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { routes } from '@/config/routes';

interface SettingsTabProps {
  profile: {
    handle: string;
    isPublished: boolean;
    acceptingClients: boolean;
    hourlyRateMin: number | null;
    hourlyRateMax: number | null;
  };
}

export const SettingsTab = ({ profile }: SettingsTabProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [rateMin, setRateMin] = useState(profile.hourlyRateMin !== null ? String(profile.hourlyRateMin / 100) : '');
  const [rateMax, setRateMax] = useState(profile.hourlyRateMax !== null ? String(profile.hourlyRateMax / 100) : '');
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const publishMutation = trpc.trainer.publish.useMutation({
    onSuccess: () => utils.trainer.getMyProfile.invalidate(),
  });
  const unpublishMutation = trpc.trainer.unpublish.useMutation({
    onSuccess: () => utils.trainer.getMyProfile.invalidate(),
  });
  const updateMutation = trpc.trainer.update.useMutation({
    onSuccess: () => utils.trainer.getMyProfile.invalidate(),
  });

  const handleTogglePublish = async () => {
    setIsUpdating(true);
    try {
      if (profile.isPublished) {
        await unpublishMutation.mutateAsync();
      } else {
        await publishMutation.mutateAsync();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAccepting = async () => {
    await updateMutation.mutateAsync({ acceptingClients: !profile.acceptingClients });
  };

  const handleSaveRates = async () => {
    setRateError(null);
    const minPence = rateMin ? Math.round(parseFloat(rateMin) * 100) : null;
    const maxPence = rateMax ? Math.round(parseFloat(rateMax) * 100) : null;

    if (minPence !== null && maxPence !== null && minPence > maxPence) {
      setRateError('Minimum rate cannot be higher than maximum rate');
      return;
    }

    setRateSaving(true);
    try {
      await updateMutation.mutateAsync({
        hourlyRateMin: minPence,
        hourlyRateMax: maxPence,
      });
    } finally {
      setRateSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
          <CardDescription>
            Control whether your profile is visible to the public.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {profile.isPublished ? (
                <div className="rounded-full bg-green-100 p-2">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-100 p-2">
                  <EyeOff className="h-5 w-5 text-amber-600" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {profile.isPublished ? 'Profile is Published' : 'Profile is Hidden'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile.isPublished
                    ? 'Your profile is visible to everyone and can be found in search results.'
                    : 'Your profile is hidden from the public. Only you can see it.'}
                </p>
              </div>
            </div>
            <Button
              variant={profile.isPublished ? 'outline' : 'default'}
              onClick={handleTogglePublish}
              disabled={isUpdating}
            >
              {isUpdating
                ? 'Updating...'
                : profile.isPublished
                ? 'Unpublish'
                : 'Publish'}
            </Button>
          </div>

          {(publishMutation.error || unpublishMutation.error) && (
            <p className="text-sm text-destructive">
              {publishMutation.error?.message || unpublishMutation.error?.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Accepting Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Client Availability</CardTitle>
          <CardDescription>
            Let potential clients know whether you're currently taking on new clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {profile.acceptingClients ? (
                <div className="rounded-full bg-green-100 p-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-100 p-2">
                  <UserX className="h-5 w-5 text-amber-600" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {profile.acceptingClients ? 'Accepting New Clients' : 'Not Accepting New Clients'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile.acceptingClients
                    ? 'Your profile shows that you are open to new clients.'
                    : 'Your profile shows that you are not currently accepting new clients.'}
                </p>
              </div>
            </div>
            <Switch
              checked={profile.acceptingClients}
              onCheckedChange={handleToggleAccepting}
              disabled={updateMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hourly Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Rate</CardTitle>
          <CardDescription>
            Set your price range so clients can find you based on their budget. This is shown on your public profile and in search results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rate-min" className="mb-2 block">Minimum (£/hr)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  id="rate-min"
                  type="number"
                  min={0}
                  step={5}
                  placeholder="e.g. 25"
                  value={rateMin}
                  onChange={(e) => setRateMin(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rate-max" className="mb-2 block">Maximum (£/hr)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  id="rate-max"
                  type="number"
                  min={0}
                  step={5}
                  placeholder="e.g. 50"
                  value={rateMax}
                  onChange={(e) => setRateMax(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>
          {rateError && (
            <p className="text-sm text-destructive">{rateError}</p>
          )}
          {updateMutation.error && (
            <p className="text-sm text-destructive">{updateMutation.error.message}</p>
          )}
          <Button onClick={handleSaveRates} disabled={rateSaving}>
            {rateSaving ? 'Saving...' : 'Save Rates'}
          </Button>
        </CardContent>
      </Card>

      {/* Profile URL */}
      <Card>
        <CardHeader>
          <CardTitle>Profile URL</CardTitle>
          <CardDescription>
            Share this link with potential clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <code className="flex-1 text-sm">
              fitnassist.co/trainers/{profile.handle}
            </code>
            <Link
              to={routes.trainerPublicProfile(profile.handle)}
              target="_blank"
              className="text-primary hover:text-primary/80"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
