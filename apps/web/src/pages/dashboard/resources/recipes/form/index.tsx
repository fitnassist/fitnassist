import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UtensilsCrossed, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  ImageUpload,
  Select,
  type SelectOption,
  SelectableBadge,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { routes } from '@/config/routes';
import { trpc } from '@/lib/trpc';
import { useRecipe, useCreateRecipe, useUpdateRecipe } from '@/api/recipe';
import { createRecipeSchema, COMMON_RECIPE_TAGS, COMMON_UNITS } from '@fitnassist/schemas';
import type { CreateRecipeInput, Ingredient } from '@fitnassist/schemas';

const UNIT_OPTIONS: SelectOption[] = COMMON_UNITS.map((u) => ({ value: u, label: u }));

export const RecipeFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading: isLoadingRecipe } = useRecipe(id || '');
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();

  const getUploadParams = trpc.upload.getUploadParams.useMutation();
  const deleteFile = trpc.upload.deleteFile.useMutation();

  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<CreateRecipeInput>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      ingredients: [{ name: '', quantity: '', unit: '' }],
      instructions: '',
      calories: null,
      proteinG: null,
      carbsG: null,
      fatG: null,
      prepTimeMin: null,
      cookTimeMin: null,
      servings: null,
      tags: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      const ingredients = (existing.ingredients as Ingredient[]) || [];
      reset({
        name: existing.name,
        description: existing.description ?? '',
        imageUrl: existing.imageUrl ?? '',
        ingredients: ingredients.length > 0 ? ingredients : [{ name: '', quantity: '', unit: '' }],
        instructions: existing.instructions,
        calories: existing.calories,
        proteinG: existing.proteinG,
        carbsG: existing.carbsG,
        fatG: existing.fatG,
        prepTimeMin: existing.prepTimeMin,
        cookTimeMin: existing.cookTimeMin,
        servings: existing.servings,
        tags: existing.tags,
      });
    }
  }, [existing, reset]);

  const imageUrl = watch('imageUrl');
  const tags = watch('tags') ?? [];

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const params = await getUploadParams.mutateAsync({ type: 'recipe-image' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', params.timestamp.toString());
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/${params.resourceType}/upload`,
      { method: 'POST', body: formData },
    );

    if (!response.ok) throw new Error('Failed to upload image');
    const result = await response.json();
    return result.secure_url;
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const url = await uploadToCloudinary(file);
    setValue('imageUrl', url);
    return url;
  };

  const handleImageDelete = async (url: string) => {
    await deleteFile.mutateAsync({ url, resourceType: 'image' });
    setValue('imageUrl', '');
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setValue(
        'tags',
        tags.filter((t) => t !== tag),
      );
    } else {
      setValue('tags', [...tags, tag]);
    }
  };

  const onSubmit = async (data: CreateRecipeInput) => {
    setIsSaving(true);
    try {
      // Clean empty strings to null, filter empty ingredients
      const cleanedIngredients = data.ingredients.filter((i) => i.name.trim() !== '');
      const cleaned = {
        ...data,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        ingredients: cleanedIngredients,
        calories: data.calories ?? null,
        proteinG: data.proteinG ?? null,
        carbsG: data.carbsG ?? null,
        fatG: data.fatG ?? null,
        prepTimeMin: data.prepTimeMin ?? null,
        cookTimeMin: data.cookTimeMin ?? null,
        servings: data.servings ?? null,
      };

      if (isEdit && id) {
        await updateRecipe.mutateAsync({ id, ...cleaned });
      } else {
        await createRecipe.mutateAsync(cleaned);
      }
      navigate(`${routes.dashboardResources}?tab=recipes`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && isLoadingRecipe) {
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
        title={isEdit ? 'Edit Recipe' : 'New Recipe'}
        icon={<UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{ to: routes.dashboardResources, label: 'Back to Resources' }}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Chicken Breast with Rice" />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the recipe"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={imageUrl || ''}
              onChange={(url) => setValue('imageUrl', url ?? '')}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              label="Recipe Image"
              description="Upload a photo of the dish (max 10MB)"
              aspectRatio="auto"
              maxSizeMB={10}
            />
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input {...register(`ingredients.${index}.name`)} placeholder="Ingredient name" />
                  {errors.ingredients?.[index]?.name && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.ingredients[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="w-20">
                  <Input {...register(`ingredients.${index}.quantity`)} placeholder="Qty" />
                </div>
                <div className="w-28">
                  <Controller
                    control={control}
                    name={`ingredients.${index}.unit`}
                    render={({ field }) => (
                      <Select
                        inputId={`ingredient-unit-${index}`}
                        aria-label={`Unit for ingredient ${index + 1}`}
                        options={UNIT_OPTIONS}
                        value={UNIT_OPTIONS.find((o) => o.value === field.value) ?? null}
                        onChange={(opt) => field.onChange(opt?.value ?? '')}
                        placeholder="Unit"
                        isClearable
                        menuPlacement="auto"
                      />
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                  className="text-destructive hover:text-destructive mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', quantity: '', unit: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions *</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('instructions')}
              placeholder="Step-by-step cooking instructions..."
              rows={6}
            />
            {errors.instructions && (
              <p className="text-sm text-destructive mt-1">{errors.instructions.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nutrition (per serving)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  {...register('calories', { valueAsNumber: true })}
                  placeholder="kcal"
                />
              </div>
              <div>
                <Label htmlFor="proteinG">Protein (g)</Label>
                <Input
                  id="proteinG"
                  type="number"
                  step="0.1"
                  {...register('proteinG', { valueAsNumber: true })}
                  placeholder="g"
                />
              </div>
              <div>
                <Label htmlFor="carbsG">Carbs (g)</Label>
                <Input
                  id="carbsG"
                  type="number"
                  step="0.1"
                  {...register('carbsG', { valueAsNumber: true })}
                  placeholder="g"
                />
              </div>
              <div>
                <Label htmlFor="fatG">Fat (g)</Label>
                <Input
                  id="fatG"
                  type="number"
                  step="0.1"
                  {...register('fatG', { valueAsNumber: true })}
                  placeholder="g"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing & Servings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timing & Servings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prepTimeMin">Prep Time (min)</Label>
                <Input
                  id="prepTimeMin"
                  type="number"
                  {...register('prepTimeMin', { valueAsNumber: true })}
                  placeholder="min"
                />
              </div>
              <div>
                <Label htmlFor="cookTimeMin">Cook Time (min)</Label>
                <Input
                  id="cookTimeMin"
                  type="number"
                  {...register('cookTimeMin', { valueAsNumber: true })}
                  placeholder="min"
                />
              </div>
              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  {...register('servings', { valueAsNumber: true })}
                  placeholder="servings"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {COMMON_RECIPE_TAGS.map((tag) => (
                <SelectableBadge
                  key={tag}
                  selected={tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </SelectableBadge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`${routes.dashboardResources}?tab=recipes`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Recipe'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default RecipeFormPage;
