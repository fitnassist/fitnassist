import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClipboardCheck, Plus, Trash2, GripVertical } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Switch,
  Textarea,
  type SelectOption,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { routes } from '@/config/routes';
import {
  useOnboardingTemplate,
  useCreateOnboardingTemplate,
  useUpdateOnboardingTemplate,
} from '@/api/onboarding';
import {
  createOnboardingTemplateSchema,
  type CreateOnboardingTemplateInput,
  type Question,
  type QuestionType,
} from '@fitnassist/schemas';

const QUESTION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'SHORT_TEXT', label: 'Short Text' },
  { value: 'LONG_TEXT', label: 'Long Text' },
  { value: 'SINGLE_CHOICE', label: 'Single Choice' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'YES_NO', label: 'Yes / No' },
  { value: 'NUMBER', label: 'Number' },
];

const CHOICE_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'] as const;

const createEmptyQuestion = (): Question => ({
  id: crypto.randomUUID(),
  type: 'SHORT_TEXT',
  label: '',
  required: false,
});

const SortableQuestion = ({
  question,
  qIndex,
  questionsLength,
  updateQuestion,
  removeQuestion,
  updateOption,
  addOption,
  removeOption,
}: {
  question: Question;
  qIndex: number;
  questionsLength: number;
  updateQuestion: (index: number, field: keyof Question, value: unknown) => void;
  removeQuestion: (index: number) => void;
  updateOption: (qIndex: number, oIndex: number, value: string) => void;
  addOption: (qIndex: number) => void;
  removeOption: (qIndex: number, oIndex: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 space-y-3 bg-background">
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-1 mt-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Q{qIndex + 1}</span>
        </div>
        <div className="flex-1 space-y-3">
          <Input
            placeholder="Question text"
            value={question.label}
            onChange={(e) => updateQuestion(qIndex, 'label', e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <Select
                value={QUESTION_TYPE_OPTIONS.find((o) => o.value === question.type)}
                onChange={(opt) => updateQuestion(qIndex, 'type', opt?.value as QuestionType)}
                options={QUESTION_TYPE_OPTIONS}
                isClearable={false}
                isSearchable={false}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={question.required}
                onCheckedChange={(checked) => updateQuestion(qIndex, 'required', checked)}
              />
              <Label className="mb-0">Required</Label>
            </div>
          </div>

          {/* Options for choice types */}
          {CHOICE_TYPES.includes(question.type as (typeof CHOICE_TYPES)[number]) && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label className="text-sm">Options</Label>
              {(question.options || []).map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${oIndex + 1}`}
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(qIndex, oIndex)}
                    disabled={(question.options?.length || 0) <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => addOption(qIndex)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeQuestion(qIndex)}
          disabled={questionsLength <= 1}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export const OnboardingTemplateFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: existingTemplate, isLoading } = useOnboardingTemplate(id || '');
  const createTemplate = useCreateOnboardingTemplate();
  const updateTemplate = useUpdateOnboardingTemplate();

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (existingTemplate) {
      return existingTemplate.questions as Question[];
    }
    return [createEmptyQuestion()];
  });

  // Sync questions when template data loads
  const [prevTemplateId, setPrevTemplateId] = useState<string | null>(null);
  if (existingTemplate && existingTemplate.id !== prevTemplateId) {
    setPrevTemplateId(existingTemplate.id);
    setQuestions(existingTemplate.questions as Question[]);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateOnboardingTemplateInput>({
    resolver: zodResolver(createOnboardingTemplateSchema),
    defaultValues: {
      name: '',
      waiverText: '',
      isActive: false,
      questions: [createEmptyQuestion()],
    },
    values: existingTemplate
      ? {
          name: existingTemplate.name,
          waiverText: existingTemplate.waiverText || '',
          isActive: existingTemplate.isActive,
          questions: existingTemplate.questions as Question[],
        }
      : undefined,
  });

  const isActive = watch('isActive');

  const addQuestion = useCallback(() => {
    const newQ = createEmptyQuestion();
    setQuestions((prev) => {
      const updated = [...prev, newQ];
      setValue('questions', updated, { shouldValidate: true });
      return updated;
    });
  }, [setValue]);

  const removeQuestion = useCallback(
    (index: number) => {
      setQuestions((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        setValue('questions', updated, { shouldValidate: true });
        return updated;
      });
    },
    [setValue],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setQuestions((prev) => {
          const oldIndex = prev.findIndex((q) => q.id === String(active.id));
          const newIndex = prev.findIndex((q) => q.id === String(over.id));
          const updated = arrayMove(prev, oldIndex, newIndex);
          setValue('questions', updated, { shouldValidate: true });
          return updated;
        });
      }
    },
    [setValue],
  );

  const updateQuestion = useCallback(
    (index: number, field: keyof Question, value: unknown) => {
      setQuestions((prev) => {
        const updated = prev.map((q, i) => {
          if (i !== index) return q;
          const newQ = { ...q, [field]: value };
          // Clear options when switching away from choice types
          if (field === 'type' && !CHOICE_TYPES.includes(value as (typeof CHOICE_TYPES)[number])) {
            newQ.options = undefined;
          }
          // Initialize options when switching to choice types
          if (
            field === 'type' &&
            CHOICE_TYPES.includes(value as (typeof CHOICE_TYPES)[number]) &&
            !newQ.options?.length
          ) {
            newQ.options = [''];
          }
          return newQ;
        });
        setValue('questions', updated, { shouldValidate: true });
        return updated;
      });
    },
    [setValue],
  );

  const updateOption = useCallback(
    (qIndex: number, oIndex: number, value: string) => {
      setQuestions((prev) => {
        const updated = prev.map((q, i) => {
          if (i !== qIndex) return q;
          const options = [...(q.options || [])];
          options[oIndex] = value;
          return { ...q, options };
        });
        setValue('questions', updated, { shouldValidate: true });
        return updated;
      });
    },
    [setValue],
  );

  const addOption = useCallback(
    (qIndex: number) => {
      setQuestions((prev) => {
        const updated = prev.map((q, i) => {
          if (i !== qIndex) return q;
          return { ...q, options: [...(q.options || []), ''] };
        });
        setValue('questions', updated, { shouldValidate: true });
        return updated;
      });
    },
    [setValue],
  );

  const removeOption = useCallback(
    (qIndex: number, oIndex: number) => {
      setQuestions((prev) => {
        const updated = prev.map((q, i) => {
          if (i !== qIndex) return q;
          return {
            ...q,
            options: (q.options || []).filter((_, j) => j !== oIndex),
          };
        });
        setValue('questions', updated, { shouldValidate: true });
        return updated;
      });
    },
    [setValue],
  );

  const onSubmit = (data: CreateOnboardingTemplateInput) => {
    const payload = { ...data, questions };

    if (isEditing && id) {
      updateTemplate.mutate(
        { ...payload, id },
        { onSuccess: () => navigate(routes.dashboardOnboarding) },
      );
    } else {
      createTemplate.mutate(payload, {
        onSuccess: () => navigate(routes.dashboardOnboarding),
      });
    }
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  if (isEditing && isLoading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header
        title={isEditing ? 'Edit Template' : 'New Onboarding Template'}
        icon={<ClipboardCheck className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{
          to: routes.dashboardOnboarding,
          label: 'Back to Onboarding',
        }}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Template settings */}
        <Card>
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" placeholder="e.g., New Client Questionnaire" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <div>
                <Label className="mb-0">Set as active template</Label>
                <p className="text-sm text-muted-foreground">
                  Active template is used automatically for new clients.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Questions</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {questions.map((question, qIndex) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      qIndex={qIndex}
                      questionsLength={questions.length}
                      updateQuestion={updateQuestion}
                      removeQuestion={removeQuestion}
                      updateOption={updateOption}
                      addOption={addOption}
                      removeOption={removeOption}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {errors.questions && (
              <p className="text-sm text-destructive">{errors.questions.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Waiver */}
        <Card>
          <CardHeader>
            <CardTitle>Waiver (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter waiver text that clients must agree to..."
              rows={6}
              {...register('waiverText')}
            />
            <p className="text-sm text-muted-foreground mt-2">
              If provided, clients will need to read and agree to this waiver before completing
              onboarding.
            </p>
            {errors.waiverText && (
              <p className="text-sm text-destructive mt-1">{errors.waiverText.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(routes.dashboardOnboarding)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default OnboardingTemplateFormPage;
