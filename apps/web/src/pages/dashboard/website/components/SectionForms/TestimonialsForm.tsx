import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Textarea, Select, type SelectOption } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface TestimonialItem {
  quote: string;
  author: string;
  rating: number;
}

interface TestimonialsFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const SOURCE_OPTIONS: SelectOption[] = [
  { value: 'reviews', label: 'From Reviews' },
  { value: 'custom', label: 'Custom Testimonials' },
];

const createEmptyItem = (): TestimonialItem => ({
  quote: '',
  author: '',
  rating: 5,
});

export const TestimonialsForm = ({ sectionId, content }: TestimonialsFormProps) => {
  const updateSection = useUpdateSection();
  const initialItems = Array.isArray(content.items) ? (content.items as TestimonialItem[]) : [];

  const { control, watch } = useForm({
    values: {
      sourceType: (content.sourceType as string) || 'reviews',
    },
  });

  const sourceType = watch('sourceType');

  const [items, setItems] = useState<TestimonialItem[]>(
    initialItems.length > 0 ? initialItems : [createEmptyItem()],
  );

  const handleUpdate = (index: number, field: keyof TestimonialItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleAdd = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateSection.mutate({
      sectionId,
      content: { sourceType, items: sourceType === 'custom' ? items : [] },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="testimonials-source">Source</Label>
        <Controller
          name="sourceType"
          control={control}
          render={({ field }) => (
            <Select
              inputId="testimonials-source"
              options={SOURCE_OPTIONS}
              value={SOURCE_OPTIONS.find((o) => o.value === field.value) || null}
              onChange={(option) => field.onChange(option?.value || 'reviews')}
            />
          )}
        />
      </div>

      {sourceType === 'custom' && (
        <>
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Testimonial {index + 1}</span>
                {items.length > 1 && (
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
                <Label className="text-xs">Quote</Label>
                <Textarea
                  value={item.quote}
                  onChange={(e) => handleUpdate(index, 'quote', e.target.value)}
                  placeholder="What the client said..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Author</Label>
                  <Input
                    value={item.author}
                    onChange={(e) => handleUpdate(index, 'author', e.target.value)}
                    placeholder="Client name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rating (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={item.rating}
                    onChange={(e) => handleUpdate(index, 'rating', parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
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
