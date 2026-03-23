import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, Loader2, ImageIcon, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface GalleryImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface GalleryUploadProps {
  images: GalleryImage[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onReorder: (imageIds: string[]) => Promise<void>;
  maxImages?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  error?: string;
}

const SortableImage = ({
  image,
  onRemove,
  disabled,
}: {
  image: GalleryImage;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border bg-muted group',
        isDragging && 'opacity-50 z-10'
      )}
    >
      <img
        src={image.url}
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      <button
        type="button"
        className="absolute top-1.5 left-1.5 cursor-grab active:cursor-grabbing rounded bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(image.id)}
        disabled={disabled}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export const GalleryUpload = ({
  images,
  onUpload,
  onRemove,
  onReorder,
  maxImages = 6,
  maxSizeMB = 10,
  disabled,
  error,
}: GalleryUploadProps) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [optimisticOrder, setOptimisticOrder] = React.useState<string[] | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Clear optimistic order once server data matches it
  React.useEffect(() => {
    if (!optimisticOrder) return;
    const serverOrder = images.map((img) => img.id).join(',');
    const expected = optimisticOrder.join(',');
    if (serverOrder === expected) {
      setOptimisticOrder(null);
    }
  }, [images, optimisticOrder]);

  // Apply optimistic ordering to the server images
  const displayImages = React.useMemo(() => {
    if (!optimisticOrder) return images;
    const imageMap = new Map(images.map((img) => [img.id, img]));
    return optimisticOrder
      .map((id) => imageMap.get(id))
      .filter((img): img is GalleryImage => !!img);
  }, [images, optimisticOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canUpload = displayImages.length < maxImages;

  const handleFile = async (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    if (!canUpload) {
      setUploadError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || isUploading || !canUpload) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayImages.findIndex((img) => img.id === active.id);
    const newIndex = displayImages.findIndex((img) => img.id === over.id);
    const reordered = arrayMove(displayImages, oldIndex, newIndex);
    const newOrder = reordered.map((img) => img.id);
    setOptimisticOrder(newOrder);
    onReorder(newOrder);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">Gallery Photos</label>
      <p className="text-xs text-muted-foreground">
        Upload up to {maxImages} photos to showcase your work. Drag to reorder.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={displayImages.map((img) => img.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayImages.map((image) => (
              <SortableImage
                key={image.id}
                image={image}
                onRemove={onRemove}
                disabled={disabled}
              />
            ))}

            {canUpload && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!disabled && !isUploading) setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onClick={() => !disabled && !isUploading && inputRef.current?.click()}
                className={cn(
                  'aspect-square flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                  dragActive && 'border-primary bg-primary/5',
                  !dragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  disabled={disabled || isUploading}
                  className="hidden"
                />
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : dragActive ? (
                  <Upload className="h-6 w-6 text-primary" />
                ) : (
                  <>
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">Add photo</span>
                  </>
                )}
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-xs text-muted-foreground">
        {displayImages.length}/{maxImages} photos uploaded
      </p>

      {(error || uploadError) && (
        <p className="text-sm text-destructive">{error || uploadError}</p>
      )}
    </div>
  );
};
