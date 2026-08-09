import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().required(),
  DB_POOL_MIN: Joi.number().default(2),
  DB_POOL_MAX: Joi.number().default(10),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  UPLOAD_DIR: Joi.string().default('uploads'),
  MAX_UPLOAD_SIZE_MB: Joi.number().default(5),
  RATE_LIMIT_WINDOW_MIN: Joi.number().default(15),
  RATE_LIMIT_MAX: Joi.number().default(5),
}).unknown();

const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
  env: envVars.NODE_ENV as string,
  port: envVars.PORT as number,
  dbUrl: envVars.DATABASE_URL as string,
  dbPoolMin: envVars.DB_POOL_MIN as number,
  dbPoolMax: envVars.DB_POOL_MAX as number,
  jwtSecret: envVars.JWT_SECRET as string,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN as string,
  uploadDir: envVars.UPLOAD_DIR as string,
  maxUploadSizeMb: envVars.MAX_UPLOAD_SIZE_MB as number,
  rateLimitWindowMin: envVars.RATE_LIMIT_WINDOW_MIN as number,
  rateLimitMax: envVars.RATE_LIMIT_MAX as number,
};
