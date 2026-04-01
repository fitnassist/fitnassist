import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const createEmptyItem = (): FaqItem => ({ question: '', answer: '' });

export const FaqForm = ({ sectionId, content }: FaqFormProps) => {
  const updateSection = useUpdateSection();
  const initialItems = Array.isArray(content.items) ? (content.items as FaqItem[]) : [];
  const [items, setItems] = useState<FaqItem[]>(
    initialItems.length > 0 ? initialItems : [createEmptyItem()],
  );

  const handleUpdate = (index: number, field: keyof FaqItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
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
            <span className="text-sm font-medium">FAQ {index + 1}</span>
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
            <Label className="text-xs">Question</Label>
            <Input
              value={item.question}
              onChange={(e) => handleUpdate(index, 'question', e.target.value)}
              placeholder="What is...?"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Answer</Label>
            <Textarea
              value={item.answer}
              onChange={(e) => handleUpdate(index, 'answer', e.target.value)}
              placeholder="The answer is..."
              rows={3}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Question
      </Button>

      <div>
        <Button onClick={handleSave} disabled={updateSection.isPending}>
          {updateSection.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
