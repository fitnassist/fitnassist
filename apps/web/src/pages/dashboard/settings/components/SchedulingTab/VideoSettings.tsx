import { Video } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Label, Switch, Badge } from '@/components/ui';
import { useVideoSettings, useUpdateVideoSettings } from '@/api/availability';

export const VideoSettings = () => {
  const { data, isLoading } = useVideoSettings();
  const updateMutation = useUpdateVideoSettings();

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const offersVideo = data?.offersVideoSessions ?? false;

  const handleToggle = (checked: boolean) => {
    updateMutation.mutate({ offersVideoSessions: checked });
  };

  const handleFreeToggle = (checked: boolean) => {
    updateMutation.mutate({ offersVideoSessions: offersVideo, videoCallsFree: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-4 w-4" />
          Video Sessions
          <Badge variant="secondary" className="text-xs">
            ELITE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Offer video sessions</Label>
            <p className="text-xs text-muted-foreground">
              Allow clients to book video call sessions with you
            </p>
          </div>
          <Switch
            checked={offersVideo}
            onCheckedChange={handleToggle}
            disabled={updateMutation.isPending}
          />
        </div>
        {offersVideo && (
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Video calls are free</Label>
              <p className="text-xs text-muted-foreground">
                No payment required for video call sessions
              </p>
            </div>
            <Switch
              checked={data?.videoCallsFree ?? true}
              onCheckedChange={handleFreeToggle}
              disabled={updateMutation.isPending}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
