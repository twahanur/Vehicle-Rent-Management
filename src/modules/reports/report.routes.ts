import { Router } from 'express';
import { reportController } from './report.controller.js';
import { reportQuerySchema } from './report.validator.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { verifyJwt } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';

const router = Router();

// Protect all report routes with JWT authentication
router.use(verifyJwt);

router.get('/rentals', validate(reportQuerySchema, 'query'), asyncHandler(reportController.getMonthlyReport));

export default router;
