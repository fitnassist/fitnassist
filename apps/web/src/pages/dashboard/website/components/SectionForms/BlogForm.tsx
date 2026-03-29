import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Label, Select, type SelectOption } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface BlogContent {
  postsToShow: number;
  layout: string;
}

interface BlogFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const LAYOUT_OPTIONS: SelectOption[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
];

export const BlogForm = ({ sectionId, content }: BlogFormProps) => {
  const updateSection = useUpdateSection();

  const { register, handleSubmit, control } = useForm<BlogContent>({
    defaultValues: {
      postsToShow: (content.postsToShow as number) || 3,
      layout: (content.layout as string) || 'grid',
    },
  });

  const onSubmit = (data: BlogContent) => {
    updateSection.mutate({ sectionId, content: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="postsToShow">Posts to Show</Label>
        <Input
          id="postsToShow"
          type="number"
          min={1}
          max={20}
          {...register('postsToShow', { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label>Layout</Label>
        <Controller
          name="layout"
          control={control}
          render={({ field }) => (
            <Select
              options={LAYOUT_OPTIONS}
              value={LAYOUT_OPTIONS.find((o) => o.value === field.value) || null}
              onChange={(option) => field.onChange(option?.value || 'grid')}
            />
          )}
        />
      </div>

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
