export const ENTRY_TYPE_OPTIONS = [
  { value: 'WEIGHT', label: 'Weight' },
  { value: 'WATER', label: 'Water' },
  { value: 'MEASUREMENT', label: 'Measurement' },
  { value: 'MOOD', label: 'Mood' },
  { value: 'SLEEP', label: 'Sleep' },
  { value: 'FOOD', label: 'Food' },
  { value: 'WORKOUT_LOG', label: 'Workout' },
  { value: 'PROGRESS_PHOTO', label: 'Progress Photo' },
  { value: 'STEPS', label: 'Steps' },
] as const;

export const ENTRY_FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
  WEIGHT: [{ value: 'weightKg', label: 'Weight (kg)' }],
  MEASUREMENT: [
    { value: 'waistCm', label: 'Waist (cm)' },
    { value: 'chestCm', label: 'Chest (cm)' },
    { value: 'hipsCm', label: 'Hips (cm)' },
    { value: 'bicepCm', label: 'Bicep (cm)' },
    { value: 'thighCm', label: 'Thigh (cm)' },
    { value: 'calfCm', label: 'Calf (cm)' },
    { value: 'neckCm', label: 'Neck (cm)' },
  ],
};

export const TARGET_UNIT_MAP: Record<string, string> = {
  weightKg: 'kg',
  waistCm: 'cm',
  chestCm: 'cm',
  hipsCm: 'cm',
  bicepCm: 'cm',
  thighCm: 'cm',
  calfCm: 'cm',
  neckCm: 'cm',
};

export const HABIT_ENTRY_TYPE_OPTIONS = [
  { value: 'WEIGHT', label: 'Log weight' },
  { value: 'WATER', label: 'Log water' },
  { value: 'FOOD', label: 'Log food' },
  { value: 'MOOD', label: 'Log mood' },
  { value: 'SLEEP', label: 'Log sleep' },
  { value: 'MEASUREMENT', label: 'Log measurements' },
  { value: 'WORKOUT_LOG', label: 'Log workout' },
  { value: 'PROGRESS_PHOTO', label: 'Log progress photo' },
  { value: 'STEPS', label: 'Log steps' },
] as const;
