import Joi from 'joi';

const monthFormat = /^\d{4}-(0[1-9]|1[0-2])$/;

export const reportQuerySchema = Joi.object({
  month: Joi.string().pattern(monthFormat).required().messages({
    'string.pattern.base': 'month must be in YYYY-MM format',
    'any.required': 'month parameter (YYYY-MM) is required',
  }),
  vehicle_id: Joi.number().integer().positive().optional(),
});
