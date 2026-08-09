import { Router } from 'express';
import { authController } from './auth.controller.js';
import { loginSchema } from './auth.validator.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { loginRateLimiter } from './rateLimiter.middleware.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), asyncHandler(authController.login));

export default router;
