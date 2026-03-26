import { useState, useCallback } from 'react';
import { Camera, Loader2, Trash2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Dialog, DialogContent, DialogTitle, Button } from '@/components/ui';
import { useLogProgressPhotos, useDeleteProgressPhoto } from '@/api/diary';
import { trpc } from '@/lib/trpc';

interface ProgressPhotosProps {
  date: string;
  entries: Array<{
    id: string;
    progressPhotos?: Array<{
      id: string;
      imageUrl: string;
      category: string | null;
      notes: string | null;
    }>;
  }>;
  readOnly?: boolean;
  variant?: 'default' | 'profile';
}

export const ProgressPhotos = ({ date, entries, readOnly, variant = 'default' }: ProgressPhotosProps) => {
  const isProfile = variant === 'profile';
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const logPhotos = useLogProgressPhotos();
  const deletePhoto = useDeleteProgressPhoto();
  const getUploadParams = trpc.upload.getUploadParams.useMutation();

  const allPhotos = entries.flatMap(e => (e.progressPhotos ?? []).map(p => ({ ...p, entryId: e.id })));
  const viewingPhoto = viewIndex !== null ? allPhotos[viewIndex] : null;

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;

    setIsUploading(true);
    try {
      const params = await getUploadParams.mutateAsync({ type: 'progress-photo' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', params.apiKey);
      formData.append('timestamp', params.timestamp.toString());
      formData.append('signature', params.signature);
      formData.append('folder', params.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${params.cloudName}/${params.resourceType}/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error('Upload failed');

      await logPhotos.mutateAsync({
        date,
        photos: [{ imageUrl: data.secure_url }],
      });
    } catch {
      // Error handled by mutation
    } finally {
      setIsUploading(false);
    }
  }, [date, getUploadParams, logPhotos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={isProfile
            ? 'flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider'
            : 'flex items-center gap-2 text-base'
          }>
            <Camera className={isProfile ? 'h-5 w-5' : 'h-4 w-4 text-pink-500'} />
            Progress Photos
            {allPhotos.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">({allPhotos.length})</span>
            )}
          </CardTitle>
          {!readOnly && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
                disabled={isUploading}
              />
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              {isUploading ? 'Uploading...' : 'Add Photo'}
            </label>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Thumbnail grid + drop zone */}
        <div
          onDragOver={readOnly ? undefined : (e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={readOnly ? undefined : () => setIsDragging(false)}
          onDrop={readOnly ? undefined : handleDrop}
          className={readOnly
            ? 'rounded-lg p-3'
            : `rounded-lg border-2 border-dashed p-3 transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/20'
              }`
          }
        >
          {allPhotos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="group relative h-[100px] w-[100px] flex-shrink-0 overflow-hidden rounded-md border border-border"
                >
                  <button
                    onClick={() => setViewIndex(i)}
                    className="h-full w-full"
                  >
                    <img
                      src={photo.imageUrl}
                      alt="Progress photo"
                      className="h-full w-full object-cover"
                    />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletePhotoId(photo.id); }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : !readOnly ? (
            <div className="flex flex-col items-center gap-1.5 py-4 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <p className="text-xs">Drop photos here or use the button above</p>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No progress photos</p>
          )}
        </div>
      </CardContent>

      {/* Full image viewer modal */}
      <Dialog open={viewIndex !== null} onOpenChange={(open) => { if (!open) setViewIndex(null); }}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-4">
          <DialogTitle className="sr-only">Progress Photo</DialogTitle>
          {viewingPhoto && (
            <div className="relative">
              <img
                src={viewingPhoto.imageUrl}
                alt="Progress photo"
                className="mx-auto max-h-[70vh] w-auto rounded object-contain"
              />

              {/* Nav arrows */}
              {allPhotos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80 shadow-sm hover:bg-background"
                    onClick={() => setViewIndex((viewIndex! - 1 + allPhotos.length) % allPhotos.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80 shadow-sm hover:bg-background"
                    onClick={() => setViewIndex((viewIndex! + 1) % allPhotos.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Counter */}
              {allPhotos.length > 1 && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2.5 py-0.5 text-xs text-muted-foreground shadow-sm">
                  {viewIndex! + 1} / {allPhotos.length}
                </span>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      {deletePhotoId && (
        <ConfirmDialog
          open={!!deletePhotoId}
          onOpenChange={(open) => { if (!open) setDeletePhotoId(null); }}
          title="Delete photo?"
          description="This photo will be permanently removed."
          onConfirm={() => {
            deletePhoto.mutate({ id: deletePhotoId });
            setDeletePhotoId(null);
            if (allPhotos.length <= 1) {
              setViewIndex(null);
            } else if (viewIndex !== null && viewIndex >= allPhotos.length - 1) {
              setViewIndex(viewIndex - 1);
            }
          }}
          isLoading={deletePhoto.isPending}
        />
      )}
    </Card>
  );
};
