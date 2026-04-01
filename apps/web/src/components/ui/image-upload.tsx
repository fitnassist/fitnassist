import * as React from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'cover' | 'auto';
  dropZoneClassName?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onDelete,
  label,
  description,
  error,
  disabled,
  className,
  aspectRatio = 'square',
  dropZoneClassName,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size
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
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so the same file can be selected again
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

  const aspectRatioClass = {
    square: 'aspect-square max-w-[200px]',
    cover: 'aspect-[3/1]',
    auto: '',
  }[aspectRatio];

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium leading-none">{label}</label>}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
          aspectRatioClass,
          !value && 'min-h-[150px]',
          dragActive && 'border-primary bg-primary/5',
          !dragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive',
          dropZoneClassName,
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
          <div className="flex flex-col items-center gap-2 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : value ? (
          <>
            <img
              src={value}
              alt="Uploaded"
              className={cn('h-full w-full rounded-lg object-cover', aspectRatioClass)}
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
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {dragActive ? 'Drop image here' : 'Click or drag to upload'}
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
}
