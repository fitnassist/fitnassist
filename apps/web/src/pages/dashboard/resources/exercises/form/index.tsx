import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dumbbell } from 'lucide-react';
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
  VideoUpload,
  SelectableBadge,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { routes } from '@/config/routes';
import { trpc } from '@/lib/trpc';
import { useExercise, useCreateExercise, useUpdateExercise } from '@/api/exercise';
import {
  createExerciseSchema,
  MUSCLE_GROUP_OPTIONS,
  COMMON_EQUIPMENT,
  EXPERIENCE_LEVEL_OPTIONS,
} from '@fitnassist/schemas';
import type { CreateExerciseInput } from '@fitnassist/schemas';
import type { MuscleGroup } from '@fitnassist/database';

export const ExerciseFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading: isLoadingExercise } = useExercise(id || '');
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();

  const getUploadParams = trpc.upload.getUploadParams.useMutation();
  const deleteFile = trpc.upload.deleteFile.useMutation();

  const [videoMode, setVideoMode] = useState<'link' | 'upload'>('link');
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateExerciseInput>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: '',
      description: '',
      instructions: '',
      videoUrl: '',
      videoUploadUrl: '',
      thumbnailUrl: '',
      muscleGroups: [],
      equipment: [],
      difficulty: null,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description ?? '',
        instructions: existing.instructions ?? '',
        videoUrl: existing.videoUrl ?? '',
        videoUploadUrl: existing.videoUploadUrl ?? '',
        thumbnailUrl: existing.thumbnailUrl ?? '',
        muscleGroups: existing.muscleGroups as MuscleGroup[],
        equipment: existing.equipment,
        difficulty: existing.difficulty ?? null,
      });
      if (existing.videoUploadUrl) {
        setVideoMode('upload');
      }
    }
  }, [existing, reset]);

  const muscleGroups = watch('muscleGroups') ?? [];
  const equipment = watch('equipment') ?? [];
  const difficulty = watch('difficulty');
  const videoUploadUrl = watch('videoUploadUrl');
  const thumbnailUrl = watch('thumbnailUrl');

  const uploadToCloudinary = async (file: File, type: 'exercise-video' | 'exercise-thumbnail'): Promise<string> => {
    const params = await getUploadParams.mutateAsync({ type });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', params.timestamp.toString());
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/${params.resourceType}/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Failed to upload file');
    const result = await response.json();
    return result.secure_url;
  };

  const handleVideoUpload = async (file: File): Promise<string> => {
    const url = await uploadToCloudinary(file, 'exercise-video');
    setValue('videoUploadUrl', url);
    return url;
  };

  const handleVideoDelete = async (url: string) => {
    await deleteFile.mutateAsync({ url, resourceType: 'video' });
    setValue('videoUploadUrl', '');
  };

  const handleThumbnailUpload = async (file: File): Promise<string> => {
    const url = await uploadToCloudinary(file, 'exercise-thumbnail');
    setValue('thumbnailUrl', url);
    return url;
  };

  const handleThumbnailDelete = async (url: string) => {
    await deleteFile.mutateAsync({ url, resourceType: 'image' });
    setValue('thumbnailUrl', '');
  };

  const toggleMuscleGroup = (mg: MuscleGroup) => {
    const current = muscleGroups;
    if (current.includes(mg)) {
      setValue('muscleGroups', current.filter(m => m !== mg));
    } else {
      setValue('muscleGroups', [...current, mg]);
    }
  };

  const toggleEquipment = (eq: string) => {
    const current = equipment;
    if (current.includes(eq)) {
      setValue('equipment', current.filter(e => e !== eq));
    } else {
      setValue('equipment', [...current, eq]);
    }
  };

  const onSubmit = async (data: CreateExerciseInput) => {
    setIsSaving(true);
    try {
      const cleaned = {
        ...data,
        description: data.description || null,
        instructions: data.instructions || null,
        videoUrl: data.videoUrl || null,
        videoUploadUrl: data.videoUploadUrl || null,
        thumbnailUrl: data.thumbnailUrl || null,
        difficulty: data.difficulty || null,
      };

      if (isEdit && id) {
        await updateExercise.mutateAsync({ id, ...cleaned });
      } else {
        await createExercise.mutateAsync(cleaned);
      }
      navigate(`${routes.dashboardResources}?tab=exercises`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && isLoadingExercise) {
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
        title={isEdit ? 'Edit Exercise' : 'New Exercise'}
        icon={<Dumbbell className="h-6 w-6 sm:h-8 sm:w-8" />}
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
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g. Barbell Bench Press"
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the exercise"
                rows={3}
              />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                {...register('instructions')}
                placeholder="Step-by-step instructions for performing the exercise"
                rows={4}
              />
              {errors.instructions && (
                <p className="text-sm text-destructive mt-1">{errors.instructions.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Each exercise needs at least instructions or a video.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Video */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Video <span className="text-sm font-normal text-muted-foreground">(optional)</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={videoMode === 'link' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVideoMode('link')}
              >
                Paste a Link
              </Button>
              <Button
                type="button"
                variant={videoMode === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVideoMode('upload')}
              >
                Upload Video
              </Button>
            </div>

            {videoMode === 'link' ? (
              <div>
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  {...register('videoUrl')}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {errors.videoUrl && <p className="text-sm text-destructive mt-1">{errors.videoUrl.message}</p>}
              </div>
            ) : (
              <VideoUpload
                value={videoUploadUrl || ''}
                onChange={(url) => setValue('videoUploadUrl', url ?? '')}
                onUpload={handleVideoUpload}
                onDelete={handleVideoDelete}
                label="Exercise Video"
                description="Upload a demonstration video (max 100MB)"
                maxSizeMB={100}
              />
            )}
          </CardContent>
        </Card>

        {/* Thumbnail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thumbnail</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={thumbnailUrl || ''}
              onChange={(url) => setValue('thumbnailUrl', url ?? '')}
              onUpload={handleThumbnailUpload}
              onDelete={handleThumbnailDelete}
              label="Exercise Thumbnail"
              description="Upload a thumbnail image (max 5MB)"
              aspectRatio="auto"
              maxSizeMB={5}
            />
          </CardContent>
        </Card>

        {/* Categorisation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Difficulty */}
            <div>
              <Label>Difficulty</Label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={difficulty === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('difficulty', difficulty === opt.value ? null : opt.value as CreateExerciseInput['difficulty'])}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Muscle Groups */}
            <div>
              <Label>Muscle Groups</Label>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUP_OPTIONS.map((opt) => (
                  <SelectableBadge
                    key={opt.value}
                    selected={muscleGroups.includes(opt.value as MuscleGroup)}
                    onClick={() => toggleMuscleGroup(opt.value as MuscleGroup)}
                  >
                    {opt.label}
                  </SelectableBadge>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <Label>Equipment</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_EQUIPMENT.map((eq) => (
                  <SelectableBadge
                    key={eq}
                    selected={equipment.includes(eq)}
                    onClick={() => toggleEquipment(eq)}
                  >
                    {eq}
                  </SelectableBadge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`${routes.dashboardResources}?tab=exercises`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Exercise'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default ExerciseFormPage;
