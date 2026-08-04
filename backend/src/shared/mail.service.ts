import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM ?? "NexBand <no-reply@nexband.local>";

const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

async function sendMail(to: string, subject: string, html: string, text: string) {
  if (!transporter) {
    // No SMTP_* env vars configured yet. Log instead of blocking
    // registration/reset-password locally or in a fresh environment.
    console.log(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n[mail:dev] ${text}\n`);
    return;
  }

  await transporter.sendMail({ from: MAIL_FROM, to, subject, html, text });
}

export async function sendOtpEmail(to: string, fullName: string, otp: string) {
  const subject = "Verify your NexBand email address";
  const text = `Hi ${fullName},\n\nYour NexBand verification code is ${otp}. It expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#553285;">Verify your email</h2>
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Your NexBand verification code is:</p>
      <p style="font-size:32px; font-weight:700; letter-spacing:8px; color:#553285;">${otp}</p>
      <p>This code expires in 10 minutes.</p>
      <p style="color:#64748b; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  await sendMail(to, subject, html, text);
}

export async function sendPasswordResetEmail(to: string, fullName: string, resetUrl: string) {
  const subject = "Reset your NexBand password";
  const text = `Hi ${fullName},\n\nWe received a request to reset your password. Use the link below within 20 minutes:\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#553285;">Reset your password</h2>
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>We received a request to reset your NexBand password. This link expires in 20 minutes.</p>
      <p><a href="${resetUrl}" style="display:inline-block; padding:12px 24px; background:#553285; color:#fff; border-radius:8px; text-decoration:none;">Reset password</a></p>
      <p style="color:#64748b; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  await sendMail(to, subject, html, text);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
