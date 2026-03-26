/** The privacy-filtered trainee profile shape returned by the API */
export interface FilteredTraineeProfile {
  id: string;
  userId: string;
  handle: string | null;
  avatarUrl: string | null;
  userName: string;
  unitPreference: string | null;
  createdAt: Date;

  // Privacy-gated
  bio: string | null;
  experienceLevel: string | null;
  activityLevel: string | null;
  gender: string | null;
  dateOfBirth: Date | string | null;
  city: string | null;
  postcode: string | null;
  location: string | null;
  fitnessGoals: string[];
  fitnessGoalNotes: string | null;
  heightCm: number | null;
  startWeightKg: number | null;
  goalWeightKg: number | null;
  medicalNotes: string | null;
}
