import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface SocialLinkItem {
  platform: string;
  url: string;
}

interface SocialLinksFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const createEmptyItem = (): SocialLinkItem => ({ platform: '', url: '' });

export const SocialLinksForm = ({ sectionId, content }: SocialLinksFormProps) => {
  const updateSection = useUpdateSection();
  const initialItems = Array.isArray(content.items)
    ? (content.items as SocialLinkItem[])
    : [];
  const [items, setItems] = useState<SocialLinkItem[]>(
    initialItems.length > 0 ? initialItems : [createEmptyItem()]
  );

  const handleUpdate = (index: number, field: keyof SocialLinkItem, value: string) => {
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
        <div key={index} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Link {index + 1}</span>
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
              <Label className="text-xs">Platform</Label>
              <Input
                value={item.platform}
                onChange={(e) => handleUpdate(index, 'platform', e.target.value)}
                placeholder="e.g. Instagram"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input
                value={item.url}
                onChange={(e) => handleUpdate(index, 'url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Link
      </Button>

      <div>
        <Button onClick={handleSave} disabled={updateSection.isPending}>
          {updateSection.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
