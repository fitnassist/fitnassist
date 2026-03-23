import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Video } from 'lucide-react';

interface ProfileVideoIntroProps {
  videoUrl: string;
}

export const ProfileVideoIntro = ({ videoUrl }: ProfileVideoIntroProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Introduction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <video
            src={videoUrl}
            controls
            className="h-full w-full object-contain"
            preload="metadata"
          />
        </div>
      </CardContent>
    </Card>
  );
};
