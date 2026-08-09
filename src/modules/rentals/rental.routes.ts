import { Router } from 'express';
import { rentalController } from './rental.controller.js';
import { createRentalSchema, updateRentalSchema, rentalQuerySchema } from './rental.validator.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { verifyJwt } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';

const router = Router();

// Protect all rental routes with JWT authentication
router.use(verifyJwt);

router.get('/', validate(rentalQuerySchema, 'query'), asyncHandler(rentalController.getAll));
router.get('/:id', asyncHandler(rentalController.getById));
router.post('/', validate(createRentalSchema, 'body'), asyncHandler(rentalController.create));
router.put('/:id', validate(updateRentalSchema, 'body'), asyncHandler(rentalController.update));
router.delete('/:id', asyncHandler(rentalController.delete));

export default router;
