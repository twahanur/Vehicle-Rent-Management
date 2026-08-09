import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import vehicleRoutes from '../modules/vehicles/vehicle.routes.js';
import rentalRoutes from '../modules/rentals/rental.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/rentals', rentalRoutes);
router.use('/reports', reportRoutes);

export default router;
