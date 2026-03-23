// =============================================================================
// TDEE & Macro Calculation (Mifflin-St Jeor equation)
// =============================================================================

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTREMELY_ACTIVE: 1.9,
};

// 1 kg of body fat ≈ 7,700 kcal
const KCAL_PER_KG = 7700;

interface TDEEInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  activityLevel: string;
}

interface NutritionTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 */
export const calculateBMR = ({ weightKg, heightCm, ageYears, gender }: Omit<TDEEInput, 'activityLevel'>): number => {
  // Mifflin-St Jeor: base formula is the same, gender offset differs
  // Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
  // Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;

  if (gender === 'MALE') return base + 5;
  if (gender === 'FEMALE') return base - 161;
  // For non-binary / prefer not to say, use average of male and female
  return base - 78;
};

/**
 * Calculate Total Daily Energy Expenditure
 */
export const calculateTDEE = (input: TDEEInput): number => {
  const bmr = calculateBMR(input);
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel] ?? 1.55;
  return Math.round(bmr * multiplier);
};

/**
 * Calculate daily calorie target from TDEE and weekly weight goal
 */
export const calculateCalorieTarget = (tdee: number, weeklyWeightGoalKg: number): number => {
  const dailyAdjustment = (weeklyWeightGoalKg * KCAL_PER_KG) / 7;
  return Math.round(tdee + dailyAdjustment);
};

/**
 * Calculate macro targets from calorie target
 * Uses a balanced split: 30% protein, 35% carbs, 35% fat
 * Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
 */
export const calculateMacros = (calories: number): Omit<NutritionTargets, 'calories'> => {
  const proteinCal = calories * 0.3;
  const carbsCal = calories * 0.35;
  const fatCal = calories * 0.35;

  return {
    proteinG: Math.round(proteinCal / 4),
    carbsG: Math.round(carbsCal / 4),
    fatG: Math.round(fatCal / 9),
  };
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculate complete nutrition targets from a trainee profile.
 * Returns auto-calculated values; callers should prefer manual overrides when set.
 */
export const calculateNutritionTargets = (profile: {
  currentWeightKg?: number | null;
  heightCm?: number | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  activityLevel?: string | null;
  weeklyWeightGoalKg?: number | null;
}): NutritionTargets | null => {
  const { currentWeightKg, heightCm, dateOfBirth, gender, activityLevel } = profile;

  // Need all required fields to calculate
  if (!currentWeightKg || !heightCm || !dateOfBirth || !gender || !activityLevel) {
    return null;
  }

  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const ageYears = Math.max(calculateAge(dob), 18);

  const validGenders = ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'] as const;
  if (!validGenders.includes(gender as typeof validGenders[number])) return null;

  const tdee = calculateTDEE({
    weightKg: currentWeightKg,
    heightCm,
    ageYears,
    gender: gender as typeof validGenders[number],
    activityLevel,
  });

  const weeklyGoal = profile.weeklyWeightGoalKg ?? 0;
  const calories = calculateCalorieTarget(tdee, weeklyGoal);
  const macros = calculateMacros(calories);

  return { calories, ...macros };
};
