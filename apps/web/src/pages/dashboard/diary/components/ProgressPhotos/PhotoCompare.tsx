import { useState } from 'react';
import { SplitSquareHorizontal, ImageIcon } from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface ComparePhoto {
  id: string;
  imageUrl: string;
  category: string | null;
  date: string;
}

interface PhotoCompareProps {
  photos: ComparePhoto[];
}

export const PhotoCompare = ({ photos }: PhotoCompareProps) => {
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);

  const beforePhoto = photos.find((p) => p.id === beforeId);
  const afterPhoto = photos.find((p) => p.id === afterId);

  if (photos.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Upload at least 2 photos to compare
        </p>
      </div>
    );
  }

  const formatLabel = (photo: ComparePhoto) => {
    const dateStr = format(parseISO(photo.date), 'dd MMM yyyy');
    return photo.category ? `${photo.category} - ${dateStr}` : dateStr;
  };

  return (
    <div className="space-y-4">
      {/* Before selector */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Before
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setBeforeId(photo.id)}
              className={cn(
                'relative flex-shrink-0 h-16 w-16 overflow-hidden rounded-md border-2 transition-all',
                beforeId === photo.id
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <img
                src={photo.imageUrl}
                alt={photo.category ?? 'Progress photo'}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5 py-px text-[8px] text-white text-center truncate">
                {format(parseISO(photo.date), 'dd/MM/yy')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* After selector */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          After
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setAfterId(photo.id)}
              className={cn(
                'relative flex-shrink-0 h-16 w-16 overflow-hidden rounded-md border-2 transition-all',
                afterId === photo.id
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <img
                src={photo.imageUrl}
                alt={photo.category ?? 'Progress photo'}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5 py-px text-[8px] text-white text-center truncate">
                {format(parseISO(photo.date), 'dd/MM/yy')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Comparison slider */}
      {beforePhoto && afterPhoto ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatLabel(beforePhoto)}</span>
            <span>{formatLabel(afterPhoto)}</span>
          </div>
          <div className="overflow-hidden rounded-lg">
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={beforePhoto.imageUrl}
                  alt={`Before - ${formatLabel(beforePhoto)}`}
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={afterPhoto.imageUrl}
                  alt={`After - ${formatLabel(afterPhoto)}`}
                />
              }
              className="aspect-[3/4] w-full"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
          <SplitSquareHorizontal className="h-5 w-5 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Select a before and after photo to compare
          </p>
        </div>
      )}
    </div>
  );
};
