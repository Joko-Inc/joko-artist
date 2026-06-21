import nodemailer from 'nodemailer';
import crypto from 'crypto';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? 'Joko <noreply@joko.app>';

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export function buildVerificationUrl(token) {
  return `${APP_URL}/api/auth/verify-email?token=${token}`;
}

export async function sendVerificationEmail({ to, name, token }) {
  const verifyUrl = buildVerificationUrl(token);
  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n[email] SMTP not configured — verification link for', to);
    console.log(verifyUrl, '\n');
    return { sent: false, verifyUrl };
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: 'Verify your Joko artist account',
      html: `
      <p>Hi ${name},</p>
      <p>Thanks for signing up for Joko. Click the link below to verify your email and activate your account:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours.</p>
      <p>— The Joko Team</p>
    `,
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] Verification send failed for', to, '—', err.message);
    console.log('[email] Verification link:', verifyUrl, '\n');
    return { sent: false, verifyUrl, error: err.message };
  }
}

export function buildPasswordResetUrl(token) {
  return `${APP_URL}/reset-password?token=${token}`;
}

export async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = buildPasswordResetUrl(token);
  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n[email] SMTP not configured — password reset link for', to);
    console.log(resetUrl, '\n');
    return { sent: false, resetUrl };
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: 'Reset your Joko artist password',
      html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to choose a new one:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      <p>— The Joko Team</p>
    `,
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] Password reset send failed for', to, '—', err.message);
    console.log('[email] Reset link:', resetUrl, '\n');
    return { sent: false, resetUrl, error: err.message };
  }
}
