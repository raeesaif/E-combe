import sendEmail from '../../utils/sendEmail';
import {
  EmailRecipient,
  VerificationEmailPayload,
  ResetPasswordEmailPayload,
  WelcomeEmailPayload,
} from './email.interface';

const BRAND_COLOR = '#006b61';
const APP_NAME = 'E-com';

const getFullName = ({ firstName, lastName }: EmailRecipient): string =>
  `${firstName} ${lastName}`;

const buildEmailTemplate = (options: {
  heading: string;
  fullName: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
}): string => {
  const { heading, fullName, description, buttonLabel, buttonUrl } = options;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background-color:${BRAND_COLOR}; padding:24px 32px;">
                <span style="color:#ffffff; font-size:20px; font-weight:bold; letter-spacing:0.5px;">${APP_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:20px; color:#111827;">${heading}</h1>
                <p style="margin:0 0 8px; font-size:15px; color:#374151;">Hi ${fullName},</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#374151;">${description}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:6px; background-color:${BRAND_COLOR};">
                      <a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:12px 28px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:6px;">${buttonLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0; font-size:13px; color:#9ca3af;">
                  If the button above doesn't work, copy and paste this link into your browser:<br />
                  <a href="${buttonUrl}" style="color:${BRAND_COLOR}; word-break:break-all;">${buttonUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
                <p style="margin:0; font-size:12px; color:#9ca3af;">&copy; ${year} ${APP_NAME}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const sendVerificationEmail = async (
  payload: VerificationEmailPayload
): Promise<void> => {
  const html = buildEmailTemplate({
    heading: 'Verify your email address',
    fullName: getFullName(payload),
    description: `Thanks for signing up with ${APP_NAME}! Please confirm your email address to activate your account. This link is valid for ${payload.expiresInMinutes} minutes — if it expires, you can request a new one.`,
    buttonLabel: 'Verify Email',
    buttonUrl: payload.verificationUrl,
  });

  await sendEmail({
    to: payload.email,
    subject: 'Verify your email address',
    html,
  });
};

export const sendResetPasswordEmail = async (
  payload: ResetPasswordEmailPayload
): Promise<void> => {
  const html = buildEmailTemplate({
    heading: 'Reset your password',
    fullName: getFullName(payload),
    description:
      'We received a request to reset your password. Click the button below to choose a new one. For your security, this link will expire soon. If you did not request this, you can safely ignore this email.',
    buttonLabel: 'Reset Password',
    buttonUrl: payload.resetUrl,
  });

  await sendEmail({
    to: payload.email,
    subject: 'Reset your password',
    html,
  });
};

export const sendWelcomeEmail = async (
  payload: WelcomeEmailPayload
): Promise<void> => {
  const html = buildEmailTemplate({
    heading: `Welcome to ${APP_NAME}!`,
    fullName: getFullName(payload),
    description: `Your account has been created successfully. We're excited to have you with us — click below to get started.`,
    buttonLabel: 'Get Started',
    buttonUrl: payload.loginUrl,
  });

  await sendEmail({
    to: payload.email,
    subject: `Welcome to ${APP_NAME}!`,
    html,
  });
};
