import {
  registerController,
  verifyEmailController,
  resendVerificationController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
} from '../modules/auth/user.controller';
import {
  RegisterSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../modules/auth/user.validation';
import validateSchemaPayload from '../utils/validateSchemaPayload';
import { Router } from 'express';

const router = Router();

router.post(
  '/register',
  validateSchemaPayload(RegisterSchema),
  registerController
);

router.post('/login', validateSchemaPayload(LoginSchema), loginController);

router.post(
  '/verify-email',
  validateSchemaPayload(VerifyEmailSchema),
  verifyEmailController
);

router.post(
  '/resend-verification',
  validateSchemaPayload(ResendVerificationSchema),
  resendVerificationController
);

router.post(
  '/forgot-password',
  validateSchemaPayload(ForgotPasswordSchema),
  forgotPasswordController
);

router.post(
  '/reset-password',
  validateSchemaPayload(ResetPasswordSchema),
  resetPasswordController
);

export default router;
