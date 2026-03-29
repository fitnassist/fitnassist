import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Select, type SelectOption } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

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
  const initialImages = Array.isArray(content.images)
    ? (content.images as GalleryImage[])
    : [];

  const { control, watch } = useForm({
    defaultValues: {
      sourceType: (content.sourceType as string) || 'profile',
    },
  });

  const sourceType = watch('sourceType');

  const [images, setImages] = useState<GalleryImage[]>(
    initialImages.length > 0 ? initialImages : [createEmptyImage()]
  );

  const handleUpdate = (index: number, field: keyof GalleryImage, value: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, [field]: value } : img))
    );
  };

  const handleAdd = () => {
    setImages((prev) => [...prev, createEmptyImage()]);
  };

  const handleRemove = (index: number) => {
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

              <div className="space-y-1">
                <Label className="text-xs">URL</Label>
                <Input
                  value={img.url}
                  onChange={(e) => handleUpdate(index, 'url', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Caption</Label>
                <Input
                  value={img.caption}
                  onChange={(e) => handleUpdate(index, 'caption', e.target.value)}
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
