import { Request, Response } from 'express';
import { authService, AuthService } from './auth.service.js';
import { LoginRequestBody, LoginResponseData } from './auth.types.js';
import { ApiSuccess } from '../../common/types/api-response.types.js';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  login = async (
    req: Request<{}, {}, LoginRequestBody>,
    res: Response<ApiSuccess<LoginResponseData>>,
  ): Promise<void> => {
    const result = await this.service.login(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const profile = await this.service.getProfile(userId);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: profile,
    });
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { current_password, new_password } = req.body;
    await this.service.changePassword(userId, current_password, new_password);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  };
}

export const authController = new AuthController();
