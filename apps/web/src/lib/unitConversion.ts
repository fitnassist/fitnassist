const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;
const KG_PER_LB = 0.453592;

export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = Math.round(totalInches % INCHES_PER_FOOT);
  return { feet, inches };
};

export const feetInchesToCm = (feet: number, inches: number): number => {
  return (feet * INCHES_PER_FOOT + inches) * CM_PER_INCH;
};

export const kgToLbs = (kg: number): number => {
  return Math.round((kg / KG_PER_LB) * 10) / 10;
};

export const lbsToKg = (lbs: number): number => {
  return Math.round(lbs * KG_PER_LB * 10) / 10;
};

export const formatHeight = (cm: number, unit: 'METRIC' | 'IMPERIAL'): string => {
  if (unit === 'IMPERIAL') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
};

export const formatWeight = (kg: number, unit: 'METRIC' | 'IMPERIAL'): string => {
  if (unit === 'IMPERIAL') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
};
