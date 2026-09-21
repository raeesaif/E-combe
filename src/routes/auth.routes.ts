import {
  registerController,
  resendVerificationController,
  loginController,
} from '../modules/auth/user.controller';
import {
  RegisterSchema,
  ResendVerificationSchema,
  LoginSchema,
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
  '/resend-verification',
  validateSchemaPayload(ResendVerificationSchema),
  resendVerificationController
);

export default router;
