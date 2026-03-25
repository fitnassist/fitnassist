import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';

interface PrivacyTabProps {
  profile: {
    isPublic: boolean;
  } | null;
}

export const PrivacyTab = ({ profile }: PrivacyTabProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const isPublic = profile?.isPublic ?? false;

  const utils = trpc.useUtils();
  const createMutation = trpc.trainee.create.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
      utils.trainee.hasProfile.invalidate();
    },
  });
  const updateMutation = trpc.trainee.update.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
    },
  });

  const mutation = profile ? updateMutation : createMutation;

  const handleToggleVisibility = async () => {
    setIsUpdating(true);
    try {
      await mutation.mutateAsync({ isPublic: !isPublic });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Privacy</CardTitle>
        <CardDescription>
          Control who can see your profile information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="rounded-full bg-amber-100 p-2">
                <EyeOff className="h-5 w-5 text-amber-600" />
              </div>
            )}
            <div>
              <p className="font-medium">
                {isPublic ? 'Profile is Public' : 'Profile is Private'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPublic
                  ? 'Any trainer can view your profile information.'
                  : 'Only your connected trainers can see your profile.'}
              </p>
            </div>
          </div>
          <Button
            variant={isPublic ? 'outline' : 'default'}
            onClick={handleToggleVisibility}
            disabled={isUpdating}
          >
            {isUpdating
              ? 'Updating...'
              : isPublic
              ? 'Make Private'
              : 'Make Public'}
          </Button>
        </div>

        {mutation.error && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
};
