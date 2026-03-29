import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useUpdateSection } from '@/api/website';

interface CustomTextFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

export const CustomTextForm = ({ sectionId, content }: CustomTextFormProps) => {
  const updateSection = useUpdateSection();
  const [richText, setRichText] = useState((content.richText as string) || '');
  const [title, setTitle] = useState((content.title as string) || '');

  const handleSave = () => {
    updateSection.mutate({ sectionId, content: { richText, title } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customTitle">Title (optional)</Label>
        <Input
          id="customTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title"
        />
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <RichTextEditor content={richText} onChange={setRichText} />
      </div>

      <Button onClick={handleSave} disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
};
