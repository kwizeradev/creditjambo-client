import { Request, Response } from 'express';
import authService from '@/services/auth.service';
import { LoginUserInput, RegisterUserInput } from '@/dtos/user.dto';

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

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  }
}

export default new AuthController();
