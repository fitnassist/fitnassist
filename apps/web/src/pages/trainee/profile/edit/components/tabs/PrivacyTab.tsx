import { useState, useEffect, useCallback } from 'react';
import { Shield, Check, Loader2, AlertCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
} from '@/components/ui';
import { Select } from '@/components/ui';
import { usePrivacySettings, useUpdatePrivacySettings } from '@/api/trainee';
import { PRIVACY_SETTINGS, VISIBILITY_OPTIONS } from '@fitnassist/schemas';
import type { VisibilityLevel } from '@fitnassist/schemas';

const visibilitySelectOptions = VISIBILITY_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

export const PrivacyTab = () => {
  const { data: settings, isLoading } = usePrivacySettings();
  const updateMutation = useUpdatePrivacySettings();

  const [localSettings, setLocalSettings] = useState<Record<string, VisibilityLevel> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings as Record<string, VisibilityLevel>);
    }
  }, [settings, localSettings]);

  const handleChange = useCallback(
    (key: string, value: VisibilityLevel) => {
      setLocalSettings((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, [key]: value };
        return updated;
      });
      setHasChanges(true);
    },
    [],
  );

  const handleSave = async () => {
    if (!localSettings) return;
    await updateMutation.mutateAsync(localSettings as Parameters<typeof updateMutation.mutateAsync>[0]);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings || !localSettings) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <AlertCircle className="h-6 w-6" />
          <p className="text-sm">Create your profile first to manage privacy settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Privacy Settings</CardTitle>
        </div>
        <CardDescription>
          Control who can see different parts of your profile. Each setting determines the minimum relationship needed to view that information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="divide-y">
          {PRIVACY_SETTINGS.map((setting) => (
            <div
              key={setting.key}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{setting.label}</Label>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </div>
              <div className="w-full sm:w-48">
                <Select
                  options={visibilitySelectOptions}
                  value={visibilitySelectOptions.find(
                    (opt) => opt.value === localSettings[setting.key],
                  )}
                  onChange={(opt) => {
                    if (opt) handleChange(setting.key, opt.value as VisibilityLevel);
                  }}
                  isSearchable={false}
                  menuPlacement="auto"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          {updateMutation.error && (
            <p className="text-sm text-destructive">{updateMutation.error.message}</p>
          )}
          {updateMutation.isSuccess && !hasChanges && (
            <p className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              Saved
            </p>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Privacy Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
