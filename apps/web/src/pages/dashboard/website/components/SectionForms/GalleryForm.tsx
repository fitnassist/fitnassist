import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Select, ImageUpload, type SelectOption } from '@/components/ui';
import { useUpdateSection } from '@/api/website';
import { useWebsiteUpload } from '../../hooks';

interface GalleryImage {
  url: string;
  caption: string;
}

interface GalleryFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const SOURCE_OPTIONS: SelectOption[] = [
  { value: 'profile', label: 'From Profile' },
  { value: 'custom', label: 'Custom Images' },
];

const createEmptyImage = (): GalleryImage => ({ url: '', caption: '' });

export const GalleryForm = ({ sectionId, content }: GalleryFormProps) => {
  const updateSection = useUpdateSection();
  const { uploadImage, deleteFile } = useWebsiteUpload();
  const initialImages = Array.isArray(content.images) ? (content.images as GalleryImage[]) : [];

  const { control, watch } = useForm({
    values: {
      sourceType: (content.sourceType as string) || 'profile',
    },
  });

  const sourceType = watch('sourceType');

  const [images, setImages] = useState<GalleryImage[]>(
    initialImages.length > 0 ? initialImages : [createEmptyImage()],
  );

  const handleImageUpload = async (index: number, file: File) => {
    const url = await uploadImage(file);
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, url } : img)));
    return url;
  };

  const handleImageDelete = async (index: number) => {
    const current = images[index];
    if (current?.url) {
      await deleteFile(current.url);
    }
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, url: '' } : img)));
  };

  const handleCaptionUpdate = (index: number, caption: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, caption } : img)));
  };

  const handleAdd = () => {
    setImages((prev) => [...prev, createEmptyImage()]);
  };

  const handleRemove = (index: number) => {
    const current = images[index];
    if (current?.url) {
      deleteFile(current.url);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateSection.mutate({
      sectionId,
      content: { sourceType, images: sourceType === 'custom' ? images : [] },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Source</Label>
        <Controller
          name="sourceType"
          control={control}
          render={({ field }) => (
            <Select
              options={SOURCE_OPTIONS}
              value={SOURCE_OPTIONS.find((o) => o.value === field.value) || null}
              onChange={(option) => field.onChange(option?.value || 'profile')}
            />
          )}
        />
      </div>

      {sourceType === 'custom' && (
        <>
          {images.map((img, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Image {index + 1}</span>
                {images.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <ImageUpload
                value={img.url}
                onChange={(url) =>
                  setImages((prev) =>
                    prev.map((im, i) => (i === index ? { ...im, url: url ?? '' } : im)),
                  )
                }
                onUpload={(file) => handleImageUpload(index, file)}
                onDelete={() => handleImageDelete(index)}
                maxSizeMB={10}
              />

              <div className="space-y-1">
                <Label className="text-xs">Caption</Label>
                <Input
                  value={img.caption}
                  onChange={(e) => handleCaptionUpdate(index, e.target.value)}
                  placeholder="Optional caption"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Image
          </Button>
        </>
      )}

      <div>
        <Button onClick={handleSave} disabled={updateSection.isPending}>
          {updateSection.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
