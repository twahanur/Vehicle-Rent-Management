import { Router } from 'express';
import { vehicleController } from './vehicle.controller.js';
import { createVehicleSchema, updateVehicleSchema, vehicleQuerySchema, availabilityQuerySchema } from './vehicle.validator.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { verifyJwt } from '../auth/auth.middleware.js';
import { vehicleUpload } from './vehicle.upload.middleware.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';

const router = Router();

// Protect all vehicle routes with JWT authentication
router.use(verifyJwt);

router.get('/stats/summary', asyncHandler(vehicleController.getStats));
router.get('/', validate(vehicleQuerySchema, 'query'), asyncHandler(vehicleController.getAll));
router.get('/:id/availability', validate(availabilityQuerySchema, 'query'), asyncHandler(vehicleController.checkAvailability));
router.get('/:id', asyncHandler(vehicleController.getById));
router.post(
  '/',
  vehicleUpload.single('photo'),
  validate(createVehicleSchema, 'body'),
  asyncHandler(vehicleController.create),
);
router.put(
  '/:id',
  vehicleUpload.single('photo'),
  validate(updateVehicleSchema, 'body'),
  asyncHandler(vehicleController.update),
);
router.delete('/:id', asyncHandler(vehicleController.delete));

export default router;
