import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { useUpdateSection } from '@/api/website';
import { IconPicker } from './IconPicker';

interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  price: string;
}

interface ServicesFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const createEmptyItem = (): ServiceItem => ({
  title: '',
  description: '',
  icon: '',
  price: '',
});

export const ServicesForm = ({ sectionId, content }: ServicesFormProps) => {
  const updateSection = useUpdateSection();
  const initialItems = Array.isArray(content.items)
    ? (content.items as ServiceItem[])
    : [];
  const [items, setItems] = useState<ServiceItem[]>(
    initialItems.length > 0 ? initialItems : [createEmptyItem()]
  );

  const handleUpdate = (index: number, field: keyof ServiceItem, value: string) => {
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
            <span className="text-sm font-medium">Service {index + 1}</span>
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
              <Label className="text-xs">Title</Label>
              <Input
                value={item.title}
                onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                placeholder="Service name"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price</Label>
              <Input
                value={item.price}
                onChange={(e) => handleUpdate(index, 'price', e.target.value)}
                placeholder="From $50"
              />
            </div>
          </div>

          <IconPicker
            value={item.icon}
            onChange={(v) => handleUpdate(index, 'icon', v)}
          />

          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={item.description}
              onChange={(e) => handleUpdate(index, 'description', e.target.value)}
              placeholder="Describe this service..."
              rows={2}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Service
      </Button>

      <div>
        <Button onClick={handleSave} disabled={updateSection.isPending}>
          {updateSection.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
