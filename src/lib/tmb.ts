/**
 * Mifflin-St Jeor TMB (kcal/día)
 * weightKg, heightCm, age (years), sex 'male' | 'female'
 */
export function mifflinStJeor(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: string
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "female" ? base - 161 : base + 5;
}

export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
