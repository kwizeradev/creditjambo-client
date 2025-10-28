import { Request, Response } from 'express';
import authService from '@/services/auth.service';
import { LoginUserInput, RegisterUserInput, RefreshTokenInput, LoginSuccessResponse } from '@/dtos';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const data: RegisterUserInput = req.body;
    const result = await authService.registerUser(data);

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: {
        user: result.user,
        device: result.device,
        devicePending: result.devicePending,
      },
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const data: LoginUserInput = req.body;

    const result = await authService.loginUser(data);

    if ('devicePending' in result && result.devicePending) {
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          devicePending: true,
          deviceId: result.deviceId,
        },
      });
      return;
    }

    const successResult = result as LoginSuccessResponse & { message: string };
    res.status(200).json({
      status: 'success',
      message: successResult.message,
      data: {
        user: successResult.user,
        tokens: successResult.tokens,
      },
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const data: RefreshTokenInput = req.body;

    const result = await authService.refreshAccessToken(data);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const result = await authService.logoutUser(req.user.userId, req.user.deviceId);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  }
}

export default new AuthController();
