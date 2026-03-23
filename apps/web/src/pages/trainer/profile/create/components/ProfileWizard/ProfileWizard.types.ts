import type {
  WizardBasicInfoInput,
  WizardLocationInput,
  WizardServicesInput,
  WizardImagesInput,
  WizardReviewInput,
} from '@fitnassist/schemas';

export type WizardStep = 'basic-info' | 'location' | 'services' | 'images' | 'review';

export interface WizardStepConfig {
  id: WizardStep;
  title: string;
  description: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: 'basic-info',
    title: 'Basic Info',
    description: 'Tell us about yourself',
  },
  {
    id: 'location',
    title: 'Location',
    description: 'Where do you train?',
  },
  {
    id: 'services',
    title: 'Services',
    description: 'What do you offer?',
  },
  {
    id: 'images',
    title: 'Images',
    description: 'Show your best self',
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Check your profile',
  },
];

export interface WizardFormData {
  basicInfo: WizardBasicInfoInput;
  location: WizardLocationInput;
  services: WizardServicesInput;
  images: WizardImagesInput;
  review: WizardReviewInput;
}

export interface WizardStepProps {
  data: WizardFormData;
  onUpdate: <K extends keyof WizardFormData>(
    step: K,
    data: WizardFormData[K]
  ) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}
