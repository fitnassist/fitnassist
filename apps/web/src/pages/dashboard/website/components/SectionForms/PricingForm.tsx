import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface PricingItem {
  name: string;
  price: string;
  description: string;
  features: string;
  ctaText: string;
}

interface PricingFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const createEmptyItem = (): PricingItem => ({
  name: '',
  price: '',
  description: '',
  features: '',
  ctaText: '',
});

export const PricingForm = ({ sectionId, content }: PricingFormProps) => {
  const updateSection = useUpdateSection();
  const initialItems = Array.isArray(content.items)
    ? (content.items as PricingItem[])
    : [];
  const [items, setItems] = useState<PricingItem[]>(
    initialItems.length > 0 ? initialItems : [createEmptyItem()]
  );

  const handleUpdate = (index: number, field: keyof PricingItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAdd = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateSection.mutate({ sectionId, content: { items } });
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plan {index + 1}</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={item.name}
                onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                placeholder="Plan name"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price</Label>
              <Input
                value={item.price}
                onChange={(e) => handleUpdate(index, 'price', e.target.value)}
                placeholder="$99/mo"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={item.description}
              onChange={(e) => handleUpdate(index, 'description', e.target.value)}
              placeholder="Plan description..."
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Features (comma-separated)</Label>
            <Input
              value={item.features}
              onChange={(e) => handleUpdate(index, 'features', e.target.value)}
              placeholder="Feature 1, Feature 2, Feature 3"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">CTA Text</Label>
            <Input
              value={item.ctaText}
              onChange={(e) => handleUpdate(index, 'ctaText', e.target.value)}
              placeholder="Get Started"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Plan
      </Button>

      <div>
        <Button onClick={handleSave} disabled={updateSection.isPending}>
          {updateSection.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
