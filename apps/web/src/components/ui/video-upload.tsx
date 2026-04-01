import * as React from 'react';
import { Upload, X, Loader2, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface VideoUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  maxSizeMB?: number;
}

export const VideoUpload = ({
  value,
  onChange,
  onUpload,
  onDelete,
  label,
  description,
  error,
  disabled,
  className,
  maxSizeMB = 50,
}: VideoUploadProps) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a video file');
      return;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleRemove = async () => {
    if (value && onDelete) {
      try {
        await onDelete(value);
      } catch {
        // Ignore delete errors, still remove from UI
      }
    }
    onChange(undefined);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium leading-none">{label}</label>}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => !disabled && !isUploading && !value && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors aspect-video',
          !value && 'cursor-pointer',
          dragActive && 'border-primary bg-primary/5',
          !dragActive && !value && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          value && 'border-transparent',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading video...</p>
          </div>
        ) : value ? (
          <>
            <video
              src={value}
              controls
              className="h-full w-full rounded-lg object-contain bg-black"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            {dragActive ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <Video className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {dragActive ? 'Drop video here' : 'Click or drag to upload'}
              </p>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              <p className="text-xs text-muted-foreground">Max {maxSizeMB}MB</p>
            </div>
          </div>
        )}
      </div>

      {(error || uploadError) && <p className="text-sm text-destructive">{error || uploadError}</p>}
    </div>
  );
};
