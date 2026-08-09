import { Router } from 'express';
import { authController } from './auth.controller.js';
import { loginSchema, changePasswordSchema } from './auth.validator.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { loginRateLimiter } from './rateLimiter.middleware.js';
import { verifyJwt } from './auth.middleware.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), asyncHandler(authController.login));

// Authenticated auth routes
router.get('/me', verifyJwt, asyncHandler(authController.getProfile));
router.post('/change-password', verifyJwt, validate(changePasswordSchema, 'body'), asyncHandler(authController.changePassword));

export default router;

