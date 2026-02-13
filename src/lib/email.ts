import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "NutriApp <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const url = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  if (resend) {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verifica tu email - NutriApp",
      html: `<p>Haz clic para verificar tu cuenta:</p><p><a href="${url}">${url}</a></p><p>El enlace caduca en 24 horas.</p>`,
    });
    return !error;
  }
  // Dev fallback: log link
  console.log("[DEV] Verification link:", url);
  return true;
}

export async function sendPasswordSetEmail(email: string, token: string): Promise<boolean> {
  const url = `${APP_URL}/set-password?token=${encodeURIComponent(token)}`;
  if (resend) {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Activa tu cuenta - NutriApp",
      html: `<p>Un administrador te ha creado una cuenta. Haz clic para establecer tu contraseña:</p><p><a href="${url}">${url}</a></p><p>El enlace caduca en 48 horas.</p>`,
    });
    return !error;
  }
  console.log("[DEV] Set password link:", url);
  return true;
}
