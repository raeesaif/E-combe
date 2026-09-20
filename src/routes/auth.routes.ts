import { registerController } from '../modules/auth/user.controller';
import { RegisterSchema } from '../modules/auth/user.validation';
import validateSchemaPayload from '../utils/validateSchemaPayload';
import { Router } from 'express';

const router = Router();

router.post(
  '/register',
  validateSchemaPayload(RegisterSchema),
  registerController
);

export default router;
