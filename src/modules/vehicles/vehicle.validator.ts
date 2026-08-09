import Joi from 'joi';

export const createVehicleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required().messages({
    'any.required': 'Vehicle name is required',
  }),
  plate_number: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Plate number is required',
  }),
  category: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Category is required',
  }),
  daily_rate: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Daily rate must be a positive number',
    'any.required': 'Daily rate is required',
  }),
});

export const updateVehicleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  plate_number: Joi.string().trim().min(2).max(100).optional(),
  category: Joi.string().trim().min(2).max(100).optional(),
  daily_rate: Joi.number().positive().precision(2).optional(),
});

export const vehicleQuerySchema = Joi.object({
  category: Joi.string().trim().optional(),
  search: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const availabilityQuerySchema = Joi.object({
  start_date: Joi.string().isoDate().required().messages({
    'string.isoDate': 'start_date must be a valid YYYY-MM-DD date',
    'any.required': 'start_date is required',
  }),
  end_date: Joi.string().isoDate().required().messages({
    'string.isoDate': 'end_date must be a valid YYYY-MM-DD date',
    'any.required': 'end_date is required',
  }),
});

