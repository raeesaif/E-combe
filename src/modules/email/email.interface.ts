export interface EmailRecipient {
  firstName: string;
  lastName: string;
  email: string;
}

export interface VerificationEmailPayload extends EmailRecipient {
  verificationUrl: string;
  expiresInMinutes: number;
}

export interface ResetPasswordEmailPayload extends EmailRecipient {
  resetUrl: string;
}

export interface WelcomeEmailPayload extends EmailRecipient {
  loginUrl: string;
}
