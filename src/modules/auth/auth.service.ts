import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authRepository, AuthRepository } from './auth.repository.js';
import { LoginRequestBody, LoginResponseData } from './auth.types.js';
import { UnauthorizedError } from '../../common/errors/index.js';
import { env } from '../../config/env.js';

export class AuthService {
  constructor(private repository: AuthRepository = authRepository) {}

  async login(payload: LoginRequestBody): Promise<LoginResponseData> {
    const user = await this.repository.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(payload.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const signOptions: SignOptions = {
      expiresIn: env.jwtExpiresIn as any,
    };

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      env.jwtSecret,
      signOptions,
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User profile not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.repository.updatePassword(userId, newHash);
  }
}

export const authService = new AuthService();
