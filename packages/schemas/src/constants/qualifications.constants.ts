// =============================================================================
// TRAINER QUALIFICATIONS / CERTIFICATIONS
// =============================================================================

export const TRAINER_QUALIFICATIONS = [
  // UK Qualifications
  { value: 'level-2-gym', label: 'Level 2 Gym Instructor', region: 'uk' },
  { value: 'level-3-pt', label: 'Level 3 Personal Trainer', region: 'uk' },
  { value: 'level-4-specialist', label: 'Level 4 Specialist', region: 'uk' },
  { value: 'cimspa', label: 'CIMSPA Registered', region: 'uk' },
  { value: 'reps', label: 'REPs Registered', region: 'uk' },
  { value: 'first-aid', label: 'First Aid Certified', region: 'uk' },
  { value: 'sports-massage', label: 'Sports Massage', region: 'uk' },
  { value: 'level-3-nutrition', label: 'Level 3 Nutrition', region: 'uk' },
  // International Qualifications
  { value: 'nasm-cpt', label: 'NASM Certified Personal Trainer', region: 'international' },
  { value: 'ace-cpt', label: 'ACE Certified Personal Trainer', region: 'international' },
  { value: 'acsm', label: 'ACSM Certified', region: 'international' },
  { value: 'nsca-cscs', label: 'NSCA CSCS', region: 'international' },
  { value: 'issa', label: 'ISSA Certified', region: 'international' },
  { value: 'crossfit-l1', label: 'CrossFit Level 1', region: 'international' },
  { value: 'crossfit-l2', label: 'CrossFit Level 2', region: 'international' },
  { value: 'precision-nutrition', label: 'Precision Nutrition', region: 'international' },
] as const;

export type TrainerQualification = (typeof TRAINER_QUALIFICATIONS)[number];
export type TrainerQualificationValue = TrainerQualification['value'];
export type TrainerQualificationRegion = TrainerQualification['region'];

// Helper to get qualifications by region
export const getQualificationsByRegion = (region: TrainerQualificationRegion) =>
  TRAINER_QUALIFICATIONS.filter((q) => q.region === region);

// All qualification values for validation
export const TRAINER_QUALIFICATION_VALUES = TRAINER_QUALIFICATIONS.map((q) => q.value);
