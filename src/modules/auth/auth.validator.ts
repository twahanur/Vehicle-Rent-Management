import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    'any.required': 'current_password is required',
  }),
  new_password: Joi.string().min(6).required().messages({
    'string.min': 'new_password must be at least 6 characters long',
    'any.required': 'new_password is required',
  }),
});

