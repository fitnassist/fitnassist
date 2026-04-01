import { useState, useEffect, useCallback } from 'react';
import { Shield, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
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
import { toast } from '@/lib/toast';
import {
  SECTION_PRIVACY_SETTINGS,
  TREND_PRIVACY_SETTINGS,
  VISIBILITY_OPTIONS,
} from '@fitnassist/schemas';
import type { VisibilityLevel } from '@fitnassist/schemas';

const visibilitySelectOptions = VISIBILITY_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

const SettingRow = ({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
}) => (
  <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-0.5">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <div className="w-full sm:w-48">
      <Select
        options={visibilitySelectOptions}
        value={visibilitySelectOptions.find((opt) => opt.value === value)}
        onChange={(opt) => {
          if (opt) onChange(opt.value as VisibilityLevel);
        }}
        isSearchable={false}
        menuPlacement="auto"
      />
    </div>
  </div>
);

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

  const handleChange = useCallback((key: string, value: VisibilityLevel) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!localSettings) return;
    await updateMutation.mutateAsync(
      localSettings as Parameters<typeof updateMutation.mutateAsync>[0],
    );
    setHasChanges(false);
    toast.success('Privacy settings saved');
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
    <div className="space-y-6">
      {/* Profile sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profile Sections</CardTitle>
          </div>
          <CardDescription>Control who can see different parts of your profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="divide-y">
            {SECTION_PRIVACY_SETTINGS.map((setting) => (
              <SettingRow
                key={setting.key}
                label={setting.label}
                description={setting.description}
                value={localSettings[setting.key] as VisibilityLevel}
                onChange={(value) => handleChange(setting.key, value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Trend Charts</CardTitle>
          </div>
          <CardDescription>
            Control who can see each type of trend data on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="divide-y">
            {TREND_PRIVACY_SETTINGS.map((setting) => (
              <SettingRow
                key={setting.key}
                label={setting.label}
                description={setting.description}
                value={localSettings[setting.key] as VisibilityLevel}
                onChange={(value) => handleChange(setting.key, value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical notes notice */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Medical Notes</strong> are only visible to your connected personal trainer and
            are never shown publicly.
          </p>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3">
        {updateMutation.error && (
          <p className="text-sm text-destructive">{updateMutation.error.message}</p>
        )}
        <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
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
    </div>
  );
};
