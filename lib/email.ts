import { Resend } from "resend";

/**
 * Sends a password reset email via Resend.
 *
 * Important: Resend's sandbox sender (onboarding@resend.dev) can only
 * deliver to the email address of the Resend account owner — sending to
 * any other address returns a 403. For this to work for real end users,
 * verify a domain at https://resend.com/domains and set EMAIL_FROM to an
 * address on that domain (e.g. "DayReady <noreply@yourdomain.com>").
 *
 * If RESEND_API_KEY isn't configured, the reset link is logged to the
 * server console instead of emailed — handy for local development without
 * needing a Resend account.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[dev] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "DayReady <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Reset your DayReady password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #12213D;">Reset your password</h2>
        <p style="color: #333;">We got a request to reset the password on your DayReady account. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #F5A623; color: #12213D; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset password
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #888; font-size: 13px;">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("Could not send the reset email. Please try again later.");
  }
}

/**
 * Notifies a user who requested a password reset but whose account was
 * created via Google sign-in (no password to reset).
 */
export async function sendGoogleOnlyNotice(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[dev] Google-only notice would be sent to ${to}`);
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "DayReady <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "About your DayReady account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #12213D;">You signed up with Google</h2>
        <p style="color: #333;">Someone requested a password reset for this email address, but this DayReady account was created with "Continue with Google" and has no password to reset.</p>
        <p style="color: #333;">Just sign in using the Google button instead.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    // Don't throw — this is a best-effort courtesy notice, not the primary flow.
  }
}
