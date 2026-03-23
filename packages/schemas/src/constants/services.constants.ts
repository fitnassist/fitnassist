// =============================================================================
// TRAINER SERVICES / AREAS OF EXPERTISE
// =============================================================================

export const TRAINER_SERVICES = [
  // Fitness
  { value: 'personal-training', label: 'Personal Training', category: 'fitness' },
  { value: 'strength-conditioning', label: 'Strength & Conditioning', category: 'fitness' },
  { value: 'weight-loss', label: 'Weight Loss', category: 'fitness' },
  { value: 'bodybuilding', label: 'Bodybuilding', category: 'fitness' },
  { value: 'sports-performance', label: 'Sports Performance', category: 'fitness' },
  { value: 'group-fitness', label: 'Group Fitness', category: 'fitness' },
  { value: 'hiit', label: 'HIIT', category: 'fitness' },
  { value: 'crossfit', label: 'CrossFit', category: 'fitness' },
  // Wellness
  { value: 'nutrition-coaching', label: 'Nutrition Coaching', category: 'wellness' },
  { value: 'rehabilitation', label: 'Rehabilitation', category: 'wellness' },
  { value: 'mobility-flexibility', label: 'Mobility & Flexibility', category: 'wellness' },
  { value: 'pre-postnatal', label: 'Pre/Postnatal Fitness', category: 'wellness' },
  { value: 'senior-fitness', label: 'Senior Fitness', category: 'wellness' },
  { value: 'stress-management', label: 'Stress Management', category: 'wellness' },
  { value: 'yoga', label: 'Yoga', category: 'wellness' },
  { value: 'pilates', label: 'Pilates', category: 'wellness' },
] as const;

export type TrainerService = (typeof TRAINER_SERVICES)[number];
export type TrainerServiceValue = TrainerService['value'];
export type TrainerServiceCategory = TrainerService['category'];

// Helper to get services by category
export const getServicesByCategory = (category: TrainerServiceCategory) =>
  TRAINER_SERVICES.filter((s) => s.category === category);

// All service values for validation
export const TRAINER_SERVICE_VALUES = TRAINER_SERVICES.map((s) => s.value);
