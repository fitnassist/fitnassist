import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Briefcase, Award, Image } from 'lucide-react';
import {
  wizardReviewSchema,
  type WizardReviewInput,
  TRAINER_SERVICES,
  TRAINER_QUALIFICATIONS,
} from '@fitnassist/schemas';
import { Badge, Button, Card, CardContent, Separator } from '@/components/ui';
import type { WizardStepProps, WizardStep } from '../../ProfileWizard/ProfileWizard.types';

interface ReviewSectionProps {
  title: string;
  icon: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}

const ReviewSection = ({ title, icon, onEdit, children }: ReviewSectionProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="rounded-lg bg-muted/50 p-4">{children}</div>
    </div>
  );
};

interface ReviewStepProps extends WizardStepProps {
  onGoToStep: (step: WizardStep) => void;
  isSubmitting: boolean;
  onSubmit: (reviewData: WizardReviewInput) => void;
}

export const ReviewStep = ({
  data,
  onBack,
  onGoToStep,
  isSubmitting,
  onSubmit,
}: ReviewStepProps) => {
  const { control, handleSubmit } = useForm<WizardReviewInput>({
    resolver: zodResolver(wizardReviewSchema),
    defaultValues: data.review,
  });

  const getServiceLabel = (value: string) =>
    TRAINER_SERVICES.find((s) => s.value === value)?.label || value;

  const getQualificationLabel = (value: string) =>
    TRAINER_QUALIFICATIONS.find((q) => q.value === value)?.label || value;

  const getTravelOptionLabel = (value: string) => {
    const labels: Record<string, string> = {
      CLIENT_TRAVELS: 'Client travels to me',
      TRAINER_TRAVELS: 'I travel to clients',
      BOTH: 'Both options available',
    };
    return labels[value] || value;
  };

  const handleFormSubmit = (formValues: WizardReviewInput) => {
    onSubmit(formValues);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <ReviewSection
          title="Basic Info"
          icon={<Briefcase className="h-4 w-4" />}
          onEdit={() => onGoToStep('basic-info')}
        >
          <div className="space-y-2">
            <p>
              <span className="font-medium">Display Name:</span> {data.basicInfo.displayName}
            </p>
            <p>
              <span className="font-medium">Profile URL:</span> fitnassist.co/
              {data.basicInfo.handle}
            </p>
            {data.basicInfo.bio && (
              <p>
                <span className="font-medium">Bio:</span>{' '}
                <span className="text-muted-foreground">
                  {data.basicInfo.bio.length > 100
                    ? `${data.basicInfo.bio.slice(0, 100)}...`
                    : data.basicInfo.bio}
                </span>
              </p>
            )}
          </div>
        </ReviewSection>

        <ReviewSection
          title="Location & Contact"
          icon={<MapPin className="h-4 w-4" />}
          onEdit={() => onGoToStep('location')}
        >
          <div className="space-y-2">
            {data.location.addressLine1 && (
              <div>
                <span className="font-medium">Address:</span>
                <p className="text-muted-foreground">
                  {data.location.addressLine1}
                  {data.location.addressLine2 && (
                    <>
                      <br />
                      {data.location.addressLine2}
                    </>
                  )}
                  <br />
                  {[data.location.city, data.location.county, data.location.postcode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}
            {!data.location.addressLine1 && data.location.postcode && (
              <p>
                <span className="font-medium">Postcode:</span> {data.location.postcode}
              </p>
            )}
            <p>
              <span className="font-medium">Training Location:</span>{' '}
              {getTravelOptionLabel(data.location.travelOption)}
            </p>
          </div>
        </ReviewSection>

        <ReviewSection
          title="Services & Qualifications"
          icon={<Award className="h-4 w-4" />}
          onEdit={() => onGoToStep('services')}
        >
          <div className="space-y-3">
            <div>
              <p className="mb-1 font-medium">Services:</p>
              <div className="flex flex-wrap gap-1">
                {data.services.services.map((s) => (
                  <Badge key={s}>{getServiceLabel(s)}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 font-medium">Qualifications:</p>
              <div className="flex flex-wrap gap-1">
                {data.services.qualifications.map((q) => (
                  <Badge key={q} variant="secondary">
                    {getQualificationLabel(q)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ReviewSection>

        <ReviewSection
          title="Images"
          icon={<Image className="h-4 w-4" />}
          onEdit={() => onGoToStep('images')}
        >
          <div className="flex gap-4">
            {data.images.profileImageUrl ? (
              <div className="space-y-1">
                <p className="text-xs font-medium">Profile Photo</p>
                <img
                  src={data.images.profileImageUrl}
                  alt="Profile"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No profile photo</p>
            )}
            {data.images.coverImageUrl ? (
              <div className="space-y-1">
                <p className="text-xs font-medium">Cover Photo</p>
                <img
                  src={data.images.coverImageUrl}
                  alt="Cover"
                  className="h-16 w-24 rounded-lg object-cover"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No cover photo</p>
            )}
          </div>
        </ReviewSection>
      </div>

      <Separator />

      <Card>
        <CardContent className="pt-6">
          <Controller
            name="isPublished"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <p className="font-medium">Publish profile immediately</p>
                  <p className="text-sm text-muted-foreground">
                    Your profile will be visible to potential clients. You can unpublish it later
                    from your dashboard.
                  </p>
                </div>
              </label>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
        </Button>
      </div>
    </form>
  );
};
