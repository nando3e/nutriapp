import { compare, hash } from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}

export function isSuperadminEnv(email: string, password: string): boolean {
  const envEmail = process.env.SUPERADMIN_EMAIL;
  const envPassword = process.env.SUPERADMIN_PASSWORD;
  if (!envEmail || !envPassword) return false;
  return email === envEmail && password === envPassword;
}
