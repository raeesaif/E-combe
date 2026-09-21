import { registerController, resendVerificationController } from '../modules/auth/user.controller';
import { RegisterSchema, ResendVerificationSchema } from '../modules/auth/user.validation';
import validateSchemaPayload from '../utils/validateSchemaPayload';
import { Router } from 'express';

const router = Router();

router.post(
  '/register',
  validateSchemaPayload(RegisterSchema),
  registerController
);

router.post(
  '/resend-verification',
  validateSchemaPayload(ResendVerificationSchema),
  resendVerificationController
);

export default router;
