import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { routes } from '@/config/routes';
import {
  BasicInfoStep,
  LocationStep,
  ServicesStep,
  ImagesStep,
  ReviewStep,
} from '../steps';
import {
  WIZARD_STEPS,
  type WizardStep,
  type WizardFormData,
} from './ProfileWizard.types';

const initialFormData: WizardFormData = {
  basicInfo: {
    handle: '',
    displayName: '',
    bio: '',
  },
  location: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'GB',
    placeId: '',
    latitude: undefined,
    longitude: undefined,
    travelOption: 'CLIENT_TRAVELS',
    phoneNumber: '',
  },
  services: {
    services: [],
    qualifications: [],
  },
  images: {
    profileImageUrl: '',
    coverImageUrl: '',
  },
  review: {
    isPublished: false,
  },
};

export function ProfileWizard() {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProfileMutation = trpc.trainer.create.useMutation();

  const currentStep = WIZARD_STEPS[currentStepIndex]!;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  const handleUpdate = <K extends keyof WizardFormData>(
    step: K,
    data: WizardFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [step]: data }));
  };

  const handleNext = () => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleGoToStep = (stepId: WizardStep) => {
    const index = WIZARD_STEPS.findIndex((s) => s.id === stepId);
    if (index !== -1) {
      setCurrentStepIndex(index);
    }
  };

  const handleSubmit = async (reviewData?: { isPublished: boolean }) => {
    setIsSubmitting(true);
    try {
      await createProfileMutation.mutateAsync({
        handle: formData.basicInfo.handle,
        displayName: formData.basicInfo.displayName,
        bio: formData.basicInfo.bio || undefined,
        addressLine1: formData.location.addressLine1 || undefined,
        addressLine2: formData.location.addressLine2 || undefined,
        city: formData.location.city || undefined,
        county: formData.location.county || undefined,
        postcode: formData.location.postcode,
        country: formData.location.country || 'GB',
        placeId: formData.location.placeId || undefined,
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        travelOption: formData.location.travelOption,
        phoneNumber: formData.location.phoneNumber || undefined,
        services: formData.services.services,
        qualifications: formData.services.qualifications,
        profileImageUrl: formData.images.profileImageUrl || undefined,
        coverImageUrl: formData.images.coverImageUrl || undefined,
        isPublished: reviewData?.isPublished ?? formData.review.isPublished,
      });

      // Navigate to dashboard on success
      navigate(routes.dashboard);
    } catch (error) {
      // Error will be handled by tRPC/React Query
      console.error('Failed to create profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = {
    data: formData,
    onUpdate: handleUpdate,
    onNext: handleNext,
    onBack: handleBack,
    isFirstStep,
    isLastStep,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <li key={step.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => index < currentStepIndex && handleGoToStep(step.id)}
                  disabled={index > currentStepIndex}
                  className={cn(
                    'flex flex-col items-center gap-2',
                    index > currentStepIndex && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      isCurrent && 'border-primary text-primary',
                      !isCompleted && !isCurrent && 'border-muted-foreground/25 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'hidden text-xs sm:block',
                      isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                </button>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 flex-1',
                      isCompleted ? 'bg-primary' : 'bg-muted-foreground/25'
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep.id === 'basic-info' && <BasicInfoStep {...stepProps} />}
          {currentStep.id === 'location' && <LocationStep {...stepProps} />}
          {currentStep.id === 'services' && <ServicesStep {...stepProps} />}
          {currentStep.id === 'images' && <ImagesStep {...stepProps} />}
          {currentStep.id === 'review' && (
            <ReviewStep
              {...stepProps}
              onGoToStep={handleGoToStep}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {createProfileMutation.error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {createProfileMutation.error.message}
        </div>
      )}
    </div>
  );
}
