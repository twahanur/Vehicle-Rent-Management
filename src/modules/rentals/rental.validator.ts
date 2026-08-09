import Joi from 'joi';

const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

export const createRentalSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required().messages({
    'any.required': 'vehicle_id is required',
  }),
  customer_name: Joi.string().trim().min(2).max(255).required().messages({
    'any.required': 'customer_name is required',
  }),
  customer_phone: Joi.string().trim().min(5).max(100).required().messages({
    'any.required': 'customer_phone is required',
  }),
  start_date: Joi.string().pattern(dateFormat).required().messages({
    'string.pattern.base': 'start_date must be in YYYY-MM-DD format',
    'any.required': 'start_date is required',
  }),
  end_date: Joi.string().pattern(dateFormat).required().messages({
    'string.pattern.base': 'end_date must be in YYYY-MM-DD format',
    'any.required': 'end_date is required',
  }),
});

export const updateRentalSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().optional(),
  customer_name: Joi.string().trim().min(2).max(255).optional(),
  customer_phone: Joi.string().trim().min(5).max(100).optional(),
  start_date: Joi.string().pattern(dateFormat).optional(),
  end_date: Joi.string().pattern(dateFormat).optional(),
  status: Joi.string().valid('booked', 'ongoing', 'completed', 'cancelled').optional(),
});

export const rentalQuerySchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('booked', 'ongoing', 'completed', 'cancelled').optional(),
  start_date: Joi.string().pattern(dateFormat).optional(),
  end_date: Joi.string().pattern(dateFormat).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('booked', 'ongoing', 'completed', 'cancelled').required().messages({
    'any.only': 'status must be one of: booked, ongoing, completed, cancelled',
    'any.required': 'status is required',
  }),
});

