import { Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useProgressPhotos } from '@/api/diary';
import { PhotoCompare } from '@/pages/dashboard/diary/components/ProgressPhotos/PhotoCompare';

export const ProgressPhotoCompare = () => {
  const { data: entries } = useProgressPhotos();

  const photos = (entries ?? []).flatMap((entry) =>
    (entry.progressPhotos ?? []).map(
      (p: { id: string; imageUrl: string; category: string | null }) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        category: p.category,
        date: typeof entry.date === 'string' ? entry.date : new Date(entry.date).toISOString(),
      }),
    ),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-4 w-4 text-pink-500" />
          Progress Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PhotoCompare photos={photos} />
      </CardContent>
    </Card>
  );
};
