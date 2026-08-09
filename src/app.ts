import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';
import routes from './routes/index.js';
import { errorHandlerMiddleware } from './common/middlewares/errorHandler.middleware.js';
import { notFoundRouteMiddleware } from './common/middlewares/notFoundRoute.middleware.js';
import { env } from './config/env.js';

const app: Application = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded vehicle photos
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

// Interactive API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root Health Check Route
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Vehicle Rental Management API is running',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 Route Middleware
app.use(notFoundRouteMiddleware);

// Global Error Handling Middleware
app.use(errorHandlerMiddleware);

export default app;
